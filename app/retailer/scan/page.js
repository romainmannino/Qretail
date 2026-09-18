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
    if(!file)return;
    setBusy(true); setMsg("Lecture du QR…");
    try{
      const {Html5Qrcode}=await import("html5-qrcode");
      // scanFile() needs a real DOM element. It must NOT be display:none on iOS.
      let reader;
      try{
        reader=new Html5Qrcode("qretail-file-reader");
        const decoded=await reader.scanFile(file,true);
        const token=extractToken(decoded);
        if(!token)throw new Error("QRetail non reconnu");
        setMsg("QR reconnu. Ouverture…");
        window.location.href="/retailer/configure/"+encodeURIComponent(token);
      }finally{
        try{reader?.clear()}catch{}
      }
    }catch(e){
      console.error("QR file scan failed",e);
      setBusy(false);
      setMsg("QR non reconnu. Reprenez la photo en cadrant uniquement le QR.");
      if(inputRef.current) inputRef.current.value="";
    }
  }

  return <main className="scanner retailerScanner">
    <header><button onClick={()=>router.back()} aria-label="Retour">←</button><Logo/><span/></header>
    <section className="scannerIntro">
      <span className="eyebrow">CONFIGURATION PLV</span>
      <h1>Scannez le QR<br/>de l’affiche.</h1>
      <p>Le QR identifie l’affiche physique. Vous choisirez ensuite le vélo à lui associer.</p>
    </section>

    <button type="button" className="camera nativeCamera fileScanner" onClick={()=>inputRef.current?.click()} disabled={busy}>
      <div className="fileScanInner">
        <strong>{busy?"Lecture en cours…":"Ouvrir l’appareil photo"}</strong>
        <span>Photographiez le QR de l’affiche</span>
      </div>
    </button>

    <input ref={inputRef} type="file" accept="image/*" capture="environment"
      style={{position:"absolute",width:1,height:1,opacity:0,pointerEvents:"none"}}
      onChange={e=>readImage(e.target.files?.[0])}/>
    <div id="qretail-file-reader" style={{position:"fixed",left:"-10000px",top:0,width:"320px",height:"320px",overflow:"hidden"}}/>
    <p className="scanMessage">{msg}</p>
  </main>
}
function Logo(){return <div className="logo darkLogo"><span>Q</span><span>R</span>etail</div>}
