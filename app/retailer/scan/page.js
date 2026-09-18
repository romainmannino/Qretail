"use client";
import {useEffect,useRef,useState} from "react";
import {useRouter} from "next/navigation";

function extractToken(raw){
  const value=(raw||"").trim();
  if(!value)return "";
  try{
    const u=new URL(value);
    const parts=u.pathname.split("/").filter(Boolean);
    const qIndex=parts.lastIndexOf("q");
    const rIndex=parts.lastIndexOf("r");
    const index=Math.max(qIndex,rIndex);
    return index>=0&&parts[index+1]?decodeURIComponent(parts[index+1]):decodeURIComponent(parts[parts.length-1]||"");
  }catch{
    return value.replace(/^.*\/q\//,"").replace(/^.*\/r\//,"").split(/[?#]/)[0].trim();
  }
}

export default function Scan(){
  const router=useRouter();
  const scannerRef=useRef(null);
  const lockedRef=useRef(false);
  const [msg,setMsg]=useState("Autorisez la caméra puis placez le QR dans le cadre.");
  const [manual,setManual]=useState("");

  function go(decodedText){
    if(lockedRef.current)return;
    const token=extractToken(decodedText);
    if(!token){setMsg("QR détecté mais non reconnu.");return}
    lockedRef.current=true;
    setMsg("QR détecté. Ouverture de l’affiche…");
    if(scannerRef.current)scannerRef.current.stop().catch(()=>{});
    // Hard navigation is intentional here: more reliable than a client router
    // transition from an active iOS camera stream.
    window.location.assign("/retailer/configure/"+encodeURIComponent(token));
  }

  useEffect(()=>{
    let mounted=true;
    let scanner;
    (async()=>{
      try{
        const {Html5Qrcode}=await import("html5-qrcode");
        if(!mounted)return;
        scanner=new Html5Qrcode("qretail-reader");
        scannerRef.current=scanner;
        await scanner.start(
          {facingMode:"environment"},
          {fps:15,qrbox:(w,h)=>{const s=Math.min(w,h,300);return {width:s,height:s}},aspectRatio:1},
          decodedText=>go(decodedText),
          ()=>{}
        );
        if(mounted)setMsg("Placez le QR QRetail dans le cadre.");
      }catch(e){
        if(mounted)setMsg("Impossible d’ouvrir la caméra. Vérifiez l’autorisation caméra dans votre navigateur.");
      }
    })();
    return()=>{
      mounted=false;
      if(scannerRef.current){
        scannerRef.current.stop().catch(()=>{});
        scannerRef.current.clear().catch(()=>{});
      }
    };
  },[]);

  function test(e){
    e.preventDefault();
    go(manual);
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
