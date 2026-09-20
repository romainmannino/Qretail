"use client";
import {useEffect,useState} from "react";
import {getTag,getModelColorVariants,track,lead} from "../../../lib/db";

export default function Product(){
 const[token,setToken]=useState(""),[tag,setTag]=useState(null),[loading,setLoading]=useState(true),[redirecting,setRedirecting]=useState(false),[error,setError]=useState(""),[showSpecs,setShowSpecs]=useState(false),[form,setForm]=useState(false),[sent,setSent]=useState(false),[colorVariants,setColorVariants]=useState([]);
 useEffect(()=>{
   const raw=window.location.pathname.split("/").filter(Boolean).pop()||"";
   let t=raw;try{t=decodeURIComponent(raw)}catch{}
   setToken(t);
   let alive=true;
   (async()=>{try{
     const data=await getTag(t);
     if(!alive)return;
     setTag(data);
     if(data?.destination_type==="url"&&data?.destination_url){setRedirecting(true);track(data).catch(()=>{});window.location.replace(data.destination_url);return}
     if(data?.product_id){track(data).catch(()=>{});const m=data?.products?.model;if(m)getModelColorVariants(m,data?.products?.catalog_id||"").then(v=>{if(alive)setColorVariants(v)}).catch(()=>{})}
   }catch(e){console.error("CONSUMER_LOAD",e);if(alive)setError("Impossible de charger la fiche pour le moment.")}finally{if(alive)setLoading(false)}})();
   return()=>{alive=false};
 },[]);
 if(loading||redirecting)return <main className="consumer"><div className="loading">Ouverture…</div></main>;
 if(error)return <main className="consumer"><div className="notfound"><h1>Fiche indisponible</h1><p>{error}</p></div></main>;
 if(!tag||!tag.product_id||!tag.products)return <main className="consumer"><div className="notfound"><h1>QR non configuré</h1><p>Ce QR n'est pas encore associé à un produit.</p></div></main>;
 const p=tag.products,b=p.brands||{},s=p.specs?.source_row||{};
 const allComponents={Cadre:s.Frame,Fourche:s.Fork,Amortisseur:s.Shock,Cintre:s.Handlebar,Transmission:s["Rear Derailleur"],Freins:s.Brakes,Roues:s.Wheels,Moteur:s.Motor,Batterie:s.Battery,Cassette:s.Cassette,Pneus:s.Tyres,"Tige de selle":s.Seatpost,Selle:s.Saddle};
 const category=((s["Category 1"]||"")+" "+(s["Category 2"]||"")+" "+(p.specs?.family||"")).toUpperCase();
 const isRoadGravel=/ROAD|GRAVEL|ALL ROAD/.test(category),isElectric=!!(s.Motor||s.Battery);
 const primaryKeys=isRoadGravel?["Cadre","Cintre","Transmission","Roues","Freins"]:["Cadre","Fourche","Amortisseur","Transmission","Freins","Roues"];
 if(isElectric)primaryKeys.push("Moteur","Batterie");
 const primaryComponents=primaryKeys.map(k=>[k,allComponents[k]]).filter(x=>x[1]);
 const secondaryComponents=Object.entries(allComponents).filter(([k,v])=>v&&!primaryKeys.includes(k));
 const modelYear=p.catalogs?.year||"";
 const price=Number(p.specs?.fr_rrp||s["FR RRP"]||0),size=p.specs?.size||s.Size||"",color=s["Summarised Colour (EN)"]||s["Orbea Colour (EN)"]||p.color_code||"";
 const euro=n=>new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(n);
 function printSheet(){window.print()}
 async function submit(e){e.preventDefault();const f=new FormData(e.currentTarget);const payload={product_id:p.id,qr_tag_id:tag.id,first_name:f.get("first"),last_name:f.get("last"),phone:f.get("phone"),email:f.get("email"),consent:true};const r=await lead(payload);if(!r.ok){alert("Impossible d’enregistrer votre demande.");return}try{const er=await fetch("/api/send-product",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:payload.email,firstName:payload.first_name,productName:p.model||p.name,brand:b.name||"",price:price>0?euro(price):"",imageUrl:p.image_url||"",url:window.location.href})});if(!er.ok)console.warn("EMAIL_NOT_SENT",await er.text())}catch(err){console.warn("EMAIL_NOT_SENT",err)}setSent(true)}
 return <main className="consumer"><header className="productTop"><span className="screenOnly">En magasin</span></header><section className="productHero"><div className="brand">{String(b.name||"").toLowerCase()==="orbea"?<img className="brandLogo" src="/brands/orbea-logo.svg" alt="Orbea"/>:(b.name||"Marque")}</div><h1>{p.model||p.name}</h1>{price>0&&<div className="productPrice">{euro(price)} <small>Prix public conseillé</small></div>}<div className="productVisuals">{p.image_url&&<img className="productImage" src={p.image_url} alt={p.model||p.name}/>}<div className="alternateColors">{colorVariants.filter(v=>v.image_url&&v.image_url!==p.image_url).slice(0,3).map(v=>{const vs=v.specs?.source_row||{},vc=vs["Summarised Colour (EN)"]||vs["Orbea Colour (EN)"]||v.color_code;return <div className="alternateColor" key={v.id}><img src={v.image_url} alt={vc}/><small>{vc}</small></div>})}</div></div><div className="meta">{modelYear&&<span>MY{modelYear}</span>}{size&&<span>Taille {size}</span>}{color&&<span>{color}</span>}{p.specs?.product_code&&<span className="printOnly">Réf. {p.specs.product_code}</span>}</div>{primaryComponents.length>0&&<div className="components"><h2>Équipement</h2><div className="primarySpecs">{primaryComponents.map(([k,v])=><div className="componentRow" key={k}><span>{k}</span><b>{v}</b></div>)}</div><div className="printSecondary">{secondaryComponents.map(([k,v])=><div className="componentRow" key={k}><span>{k}</span><b>{v}</b></div>)}</div>{showSpecs&&<div className="screenSecondary">{secondaryComponents.map(([k,v])=><div className="componentRow" key={k}><span>{k}</span><b>{v}</b></div>)}</div>}{secondaryComponents.length>0&&<button className="specToggle" onClick={()=>setShowSpecs(!showSpecs)}>{showSpecs?"Réduire":"Voir tous les composants"}</button>}</div>}<div className="sheetActions"><button className="primary full" onClick={printSheet}>Télécharger la fiche PDF</button><button className="save full" onClick={()=>setForm(!form)}>Recevoir cette fiche par e-mail</button></div>{p.product_url&&<a className="textBtn productLink" href={p.product_url} target="_blank" rel="noreferrer">Voir la fiche officielle {b.name||""}</a>}</section>
 {form&&<section className="lead">{sent?<div className="success"><b>Fiche enregistrée.</b><p>Votre demande concernant ce vélo a bien été transmise.</p></div>:<form onSubmit={submit}><h2>Recevoir cette fiche</h2><p>Indiquez vos coordonnées pour retrouver ce vélo et, si vous le souhaitez, être recontacté par le magasin.</p><div className="grid"><input name="first" placeholder="Prénom"/><input name="last" placeholder="Nom"/><input name="phone" placeholder="Téléphone"/><input name="email" type="email" placeholder="E-mail" required/></div><label className="consent"><input type="checkbox" required/> J’accepte que mes coordonnées soient transmises au magasin au sujet de ce produit.</label><button className="primary full">Envoyer ma demande</button></form>}</section>}
 </main>
}
function Logo(){return <div className="logo"><span>Q</span><span>R</span>etail</div>}
