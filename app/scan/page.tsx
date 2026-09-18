"use client";
import {useEffect,useRef,useState} from "react";

export default function Scan(){
 const [e,setE]=useState("");
 const [found,setFound]=useState(false);
 const scannerRef=useRef<any>(null);
 const handledRef=useRef(false);

 useEffect(()=>{
   let mounted=true;
   import("html5-qrcode").then(({Html5QrcodeScanner})=>{
     if(!mounted)return;
     const scanner=new Html5QrcodeScanner("reader",{fps:10,qrbox:240},false);
     scannerRef.current=scanner;
     scanner.render(async(decodedText:string)=>{
       if(handledRef.current)return;
       try{
         const u=new URL(decodedText,window.location.origin);
         const parts=u.pathname.split("/").filter(Boolean);
         const token=u.searchParams.get("id")||u.searchParams.get("token")||parts[parts.length-1];
         if(!token)throw new Error("missing token");
         handledRef.current=true;
         setFound(true);
         try{await scanner.clear()}catch{}
         window.location.assign("/configure/"+encodeURIComponent(token));
       }catch{
         handledRef.current=false;
         setE("QR code non reconnu");
       }
     },()=>{});
   }).catch(()=>setE("Impossible de démarrer le scanner."));
   return()=>{mounted=false;scannerRef.current?.clear().catch(()=>{})};
 },[]);

 return <main className="wrap"><div className="brand"><b>QR</b>etail</div><div className="card" style={{marginTop:40}}>
   <div className="row"><span className="num">1</span><h2>Scanner une affiche</h2></div>
   <p className="muted">{found?"QR détecté — ouverture de la configuration…":"Autorisez l’appareil photo puis placez le QR code dans le cadre."}</p>
   <div id="reader"/>
   {e&&<p>{e}</p>}
 </div></main>
}