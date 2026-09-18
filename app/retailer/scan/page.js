"use client";
import {useEffect,useRef,useState} from "react";
import {useRouter} from "next/navigation";

function extractToken(raw){
  const value=(raw||"").trim();
  if(!value)return "";
  try{
    const u=new URL(value,window.location.origin);
    const parts=u.pathname.split("/").filter(Boolean);
    const i=Math.max(parts.lastIndexOf("q"),parts.lastIndexOf("r"),parts.lastIndexOf("configure"));
    return i>=0&&parts[i+1]?decodeURIComponent(parts[i+1]):"";
  }catch{
    const m=value.match(/(?:^|\/)(?:q|r|configure)\/([^?#/]+)/i);
    return m?.[1]?decodeURIComponent(m[1]):"";
  }
}

export default function Scan(){
 const router=useRouter(),scannerRef=useRef(null),handled=useRef(false);
 const[status,setStatus]=useState("Initialisation de la caméra…"),[error,setError]=useState("");

 useEffect(()=>{
   let cancelled=false;
   const success=async raw=>{
     if(handled.current)return;
     const token=extractToken(raw);
     if(!token){setStatus("QR détecté mais non reconnu par QRetail");return}
     handled.current=true; setStatus("QR reconnu · ouverture…");
     try{if(scannerRef.current?.isScanning)await scannerRef.current.stop()}catch{}
     router.replace("/retailer/configure/"+encodeURIComponent(token));
   };
   (async()=>{
     try{
       const {Html5Qrcode}=await import("html5-qrcode");
       if(cancelled)return;
       const scanner=new Html5Qrcode("qretail-live-reader",{verbose:false});
       scannerRef.current=scanner;
       const cameras=await Html5Qrcode.getCameras();
       if(cancelled)return;
       if(!cameras?.length)throw new Error("Aucune caméra détectée");
       const rear=cameras.find(c=>/back|rear|environment|arrière/i.test(c.label))||cameras[cameras.length-1];
       await scanner.start(
         rear.id,
         {fps:10,qrbox:{width:250,height:250},aspectRatio:1},
         success,
         ()=>{}
       );
       if(!cancelled)setStatus("Placez le QR dans le cadre");
     }catch(e){
       console.error("QRETAIL_CAMERA",e);
       if(!cancelled){
         setError("Impossible d’ouvrir le scanner. Vérifiez l’autorisation Caméra de Safari puis rechargez.");
         setStatus("");
       }
     }
   })();
   return()=>{cancelled=true;const s=scannerRef.current;if(s?.isScanning)Promise.resolve(s.stop()).catch(()=>{})};
 },[router]);

 return <main className="scanner retailerScanner">
   <header><button onClick={()=>router.back()} aria-label="Retour">←</button><Logo/><span/></header>
   <section className="scannerIntro"><span className="eyebrow">CONFIGURATION PLV</span><h1>Scannez le QR<br/>de l’affiche.</h1><p>Le scan commerçant reconnaît l’affiche et ouvre directement le choix du vélo.</p></section>
   <div className="camera liveCamera"><div id="qretail-live-reader"/></div>
   <p className={error?"scanMessage scanError":"scanMessage"}>{error||status}</p>
 </main>
}
function Logo(){return <div className="logo darkLogo"><span>Q</span><span>R</span>etail</div>}
