"use client";
import {useEffect,useRef,useState} from "react";
import {useRouter} from "next/navigation";

function extractToken(raw){
  const value=(raw||"").trim();
  try{
    const u=new URL(value);
    const parts=u.pathname.split("/").filter(Boolean);
    return parts[parts.length-1]||"";
  }catch{
    return value.replace(/^.*\/q\//,"").replace(/^.*\/r\//,"").trim();
  }
}

export default function Scan(){
  const router=useRouter();
  const scannerRef=useRef(null);
  const [msg,setMsg]=useState("Autorisez la caméra puis placez le QR dans le cadre.");
  const [manual,setManual]=useState("");

  useEffect(()=>{
    let active=true;
    let scanner;
    (async()=>{
      try{
        const {Html5Qrcode}=await import("html5-qrcode");
        if(!active)return;
        scanner=new Html5Qrcode("qretail-reader");
        scannerRef.current=scanner;
        const onSuccess=async(decodedText)=>{
          const token=extractToken(decodedText);
          if(!token)return;
          active=false;
          try{await scanner.stop()}catch{}
          router.replace("/retailer/configure/"+encodeURIComponent(token));
        };
        await scanner.start(
          {facingMode:"environment"},
          {fps:10,qrbox:(w,h)=>{const s=Math.min(w,h,280);return {width:s,height:s}},aspectRatio:1},
          onSuccess,
          ()=>{}
        );
        setMsg("Placez le QR QRetail dans le cadre.");
      }catch(e){
        setMsg("Impossible d’ouvrir la caméra. Vérifiez l’autorisation caméra dans votre navigateur.");
      }
    })();
    return()=>{active=false;if(scannerRef.current){scannerRef.current.stop().catch(()=>{});scannerRef.current.clear().catch(()=>{})}};
  },[router]);

  function test(e){
    e.preventDefault();
    const token=extractToken(manual);
    if(token)router.push("/retailer/configure/"+encodeURIComponent(token));
  }

  return <main className="scanner retailerScanner">
    <header><button onClick={()=>router.back()} aria-label="Retour">←</button><Logo/><span/></header>
    <section className="scannerIntro">
      <span className="eyebrow">CONFIGURATION PLV</span>
      <h1>Scannez le QR<br/>de l’affiche.</h1>
      <p>Le scan identifie l’affiche physique. Vous choisirez ensuite le vélo à lui associer.</p>
    </section>
    <div className="camera nativeCamera">
      <div id="qretail-reader"/>
      <div className="scanCorners"><i/><i/><i/><i/></div>
    </div>
    <p className="scanMessage">{msg}</p>
    <details className="scanTest">
      <summary>Test sur ordinateur</summary>
      <form onSubmit={test}>
        <input value={manual} onChange={e=>setManual(e.target.value)} placeholder="URL ou token du QR"/>
        <button className="secondary full">Continuer</button>
      </form>
    </details>
  </main>
}
function Logo(){return <div className="logo darkLogo"><span>Q</span><span>R</span>etail</div>}
