"use client";
import {useEffect,useRef,useState} from "react";
import {useRouter} from "next/navigation";

function extractToken(raw){
  const value=(raw||"").trim();
  if(!value)return "";
  try{
    const u=new URL(value);
    const parts=u.pathname.split("/").filter(Boolean);
    const i=Math.max(parts.lastIndexOf("q"),parts.lastIndexOf("r"));
    return i>=0&&parts[i+1]?decodeURIComponent(parts[i+1]):"";
  }catch{
    const m=value.match(/(?:^|\/)(?:q|r)\/([^?#/]+)/i);
    return m?.[1]?decodeURIComponent(m[1]):"";
  }
}

export default function Scan(){
  const router=useRouter();
  const scannerRef=useRef(null);
  const handledRef=useRef(false);
  const [status,setStatus]=useState("Initialisation de la caméra…");
  const [error,setError]=useState("");

  useEffect(()=>{
    let cancelled=false;
    async function start(){
      try{
        const {Html5Qrcode}=await import("html5-qrcode");
        if(cancelled)return;
        const scanner=new Html5Qrcode("qretail-live-reader");
        scannerRef.current=scanner;

        const onSuccess=async decoded=>{
          if(handledRef.current)return;
          const token=extractToken(decoded);
          if(!token)return;
          handledRef.current=true;
          setStatus("QR reconnu");
          try{await scanner.stop()}catch{}
          // IMPORTANT: the retailer scanner intercepts the QR URL and goes to
          // configuration. The QR itself stays a consumer URL (/q/... or /r/...).
          router.replace("/retailer/configure/"+encodeURIComponent(token));
        };

        await scanner.start(
          {facingMode:"environment"},
          {fps:12,qrbox:(w,h)=>{
            const s=Math.floor(Math.min(w,h)*0.72);
            return {width:s,height:s};
          },aspectRatio:1},
          onSuccess,
          ()=>{}
        );
        if(!cancelled)setStatus("Placez le QR dans le cadre");
      }catch(e){
        console.error("Live QR camera failed",e);
        if(!cancelled){
          setError("Caméra indisponible. Autorisez l’accès à la caméra dans Safari puis rechargez la page.");
          setStatus("");
        }
      }
    }
    start();
    return ()=>{
      cancelled=true;
      const s=scannerRef.current;
      if(s){Promise.resolve(s.stop()).catch(()=>{});}
    };
  },[router]);

  return <main className="scanner retailerScanner">
    <header><button onClick={()=>router.back()} aria-label="Retour">←</button><Logo/><span/></header>
    <section className="scannerIntro">
      <span className="eyebrow">CONFIGURATION PLV</span>
      <h1>Scannez le QR<br/>de l’affiche.</h1>
      <p>Visez simplement le QR. Dès qu’il est reconnu, la fiche de configuration s’ouvre automatiquement.</p>
    </section>

    <div className="camera liveCamera">
      <div id="qretail-live-reader"/>
      <div className="scanFrame" aria-hidden="true"/>
    </div>
    <p className={error?"scanMessage scanError":"scanMessage"}>{error||status}</p>
  </main>
}
function Logo(){return <div className="logo darkLogo"><span>Q</span><span>R</span>etail</div>}
