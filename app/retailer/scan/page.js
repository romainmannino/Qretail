"use client";
import {useEffect,useRef,useState} from "react";
import {useRouter} from "next/navigation";

function extractToken(raw){
  const value=(raw||"").trim();
  if(!value)return "";
  try{
    const u=new URL(value);
    const parts=u.pathname.split("/").filter(Boolean);
    const qi=parts.lastIndexOf("q"),ri=parts.lastIndexOf("r");
    const i=Math.max(qi,ri);
    return i>=0&&parts[i+1]?decodeURIComponent(parts[i+1]):"";
  }catch{
    const m=value.match(/(?:^|\/)(?:q|r)\/([^?#/]+)/i);
    return m?.[1]?decodeURIComponent(m[1]):value;
  }
}

export default function Scan(){
  const router=useRouter();
  const scannerRef=useRef(null);
  const lockedRef=useRef(false);
  const [msg,setMsg]=useState("Autorisez la caméra puis placez le QR dans le cadre.");
  const [detected,setDetected]=useState(false);
  const [manual,setManual]=useState("");

  function go(raw){
    if(lockedRef.current)return;
    const token=extractToken(raw);
    if(!token){setMsg("QR détecté mais URL QRetail non reconnue.");return}
    lockedRef.current=true;
    setDetected(true);
    setMsg("QR reconnu. Ouverture…");
    // Navigate immediately. Do not await camera shutdown on iOS.
    window.location.href="/retailer/configure/"+encodeURIComponent(token);
  }

  useEffect(()=>{
    let mounted=true;
    (async()=>{
      try{
        const {Html5Qrcode}=await import("html5-qrcode");
        if(!mounted)return;
        const scanner=new Html5Qrcode("qretail-reader");
        scannerRef.current=scanner;
        await scanner.start(
          {facingMode:{ideal:"environment"}},
          {fps:20,qrbox:{width:300,height:300},disableFlip:false},
          (decodedText)=>go(decodedText),
          ()=>{}
        );
        if(mounted)setMsg("Placez le QR QRetail dans le cadre.");
      }catch(e){
        if(mounted)setMsg("Caméra indisponible. Vérifiez son autorisation.");
      }
    })();
    return()=>{
      mounted=false;
      const s=scannerRef.current;
      if(s){try{s.stop().then(()=>s.clear()).catch(()=>{})}catch{}}
    };
  },[]);

  function test(e){e.preventDefault();go(manual)}

  return <main className="scanner retailerScanner">
    <header><button onClick={()=>router.back()} aria-label="Retour">←</button><Logo/><span/></header>
    <section className="scannerIntro">
      <span className="eyebrow">CONFIGURATION PLV</span>
      <h1>Scannez le QR<br/>de l’affiche.</h1>
      <p>Le scan identifie l’affiche physique. Vous choisirez ensuite le vélo à lui associer.</p>
    </section>
    <div className="camera nativeCamera">
      <div id="qretail-reader"/>
      <div className={"scanCorners"+(detected?" detected":"")}><i/><i/><i/><i/></div>
    </div>
    <p className="scanMessage">{msg}</p>
    <details className="scanTest">
      <summary>Diagnostic / test</summary>
      <form onSubmit={test}>
        <input value={manual} onChange={e=>setManual(e.target.value)} placeholder="Collez l’URL du QR"/>
        <button className="secondary full">Ouvrir ce QR</button>
      </form>
    </details>
  </main>
}
function Logo(){return <div className="logo darkLogo"><span>Q</span><span>R</span>etail</div>}
