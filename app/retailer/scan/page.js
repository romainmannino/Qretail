"use client";
import {useRef,useState} from "react";
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
    return m?.[1]?decodeURIComponent(m[1]):value;
  }
}

export default function Scan(){
  const router=useRouter();
  const inputRef=useRef(null);
  const [msg,setMsg]=useState("Photographiez le QR de l’affiche.");
  const [busy,setBusy]=useState(false);

  async function readImage(file){
    if(!file||busy)return;
    setBusy(true);
    setMsg("Lecture du QR…");
    try{
      const {Html5Qrcode}=await import("html5-qrcode");
      const reader=new Html5Qrcode("qretail-file-reader");
      const decoded=await reader.scanFile(file,true);
      try{reader.clear()}catch{}
      const token=extractToken(decoded);
      if(!token)throw new Error("QRetail non reconnu");
      setMsg("QR reconnu. Ouverture…");
      window.location.assign("/retailer/configure/"+encodeURIComponent(token));
    }catch(e){
      setBusy(false);
      setMsg("QR non reconnu. Reprenez la photo en cadrant uniquement le QR.");
    }
  }

  return <main className="scanner retailerScanner">
    <header><button onClick={()=>router.back()} aria-label="Retour">←</button><Logo/><span/></header>
    <section className="scannerIntro">
      <span className="eyebrow">CONFIGURATION PLV</span>
      <h1>Scannez le QR<br/>de l’affiche.</h1>
      <p>Le QR identifie l’affiche physique. Vous choisirez ensuite le vélo à lui associer.</p>
    </section>

    <div className="camera nativeCamera fileScanner" onClick={()=>!busy&&inputRef.current?.click()}>
      <div className="fileScanInner">
        <div className="cameraGlyph">⌑</div>
        <strong>{busy?"Lecture en cours…":"Ouvrir l’appareil photo"}</strong>
        <span>Photographiez le QR de l’affiche</span>
      </div>
    </div>

    <input
      ref={inputRef}
      type="file"
      accept="image/*"
      capture="environment"
      hidden
      onChange={e=>readImage(e.target.files?.[0])}
    />
    <div id="qretail-file-reader" style={{display:"none"}}/>
    <p className="scanMessage">{msg}</p>
  </main>
}
function Logo(){return <div className="logo darkLogo"><span>Q</span><span>R</span>etail</div>}
