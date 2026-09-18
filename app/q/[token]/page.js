"use client";
import {useEffect,useState} from "react";
import {getTag,track,lead} from "../../../lib/db";

export default function Product(){
 const[token,setToken]=useState(""),[tag,setTag]=useState(null),[loading,setLoading]=useState(true),[error,setError]=useState(""),[showSpecs,setShowSpecs]=useState(false),[form,setForm]=useState(false),[sent,setSent]=useState(false);
 useEffect(()=>{
   const raw=window.location.pathname.split("/").filter(Boolean).pop()||"";
   let t=raw;try{t=decodeURIComponent(raw)}catch{}
   setToken(t);
   let alive=true;
   (async()=>{try{
     const data=await getTag(t);
     if(!alive)return;
     setTag(data);
     if(data?.product_id)track(data).catch(()=>{});
   }catch(e){console.error("CONSUMER_LOAD",e);if(alive)setError("Impossible de charger la fiche pour le moment.")}finally{if(alive)setLoading(false)}})();
   return()=>{alive=false};
 },[]);
 if(loading)return <main className="consumer"><div className="loading">QRetail</div></main>;
 if(error)return <main className="consumer"><div className="notfound"><Logo/><h1>Fiche indisponible</h1><p>{error}</p></div></main>;
 if(!tag||!tag.product_id||!tag.products)return <main className="consumer"><div className="notfound"><Logo/><h1>QR non configuré</h1><p>Ce QR n'est pas encore associé à un produit.</p></div></main>;
 const p=tag.products,b=p.brands||{},s=p.specs?.source_row||{};
 const allComponents={Cadre:s.Frame,Fourche:s.Fork,Amortisseur:s.Shock,Cintre:s.Handlebar,Transmission:s["Rear Derailleur"],Freins:s.Brakes,Roues:s.Wheels,Moteur:s.Motor,Batterie:s.Battery,Cassette:s.Cassette,Pneus:s.Tyres,"Tige de selle":s.Seatpost,Selle:s.Saddle};
 const category=((s["Category 1"]||"")+" "+(s["Category 2"]||"")+" "+(p.specs?.family||"")).toUpperCase();
 const isRoadGravel=/ROAD|GRAVEL|ALL ROAD/.test(category),isElectric=!!(s.Motor||s.Battery);
 const primaryKeys=isRoadGravel?["Cadre","Cintre","Transmission","Roues","Freins"]:["Cadre","Fourche","Amortisseur","Transmission","Freins","Roues"];
 if(isElectric)primaryKeys.push("Moteur","Batterie");
 const primaryComponents=primaryKeys.map(k=>[k,allComponents[k]]).filter(x=>x[1]);
 const secondaryComponents=Object.entries(allComponents).filter(([k,v])=>v&&!primaryKeys.includes(k));
 const price=Number(p.specs?.fr_rrp||s["FR RRP"]||0),size=p.specs?.size||s.Size||"",color=s["Summarised Colour (EN)"]||s["Orbea Colour (EN)"]||p.color_code||"";
 const euro=n=>new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(n);
 function printSheet(){window.print()}
 async function submit(e){e.preventDefault();const f=new FormData(e.currentTarget);await lead({product_id:p.id,qr_tag_id:tag.id,first_name:f.get("first"),last_name:f.get("last"),phone:f.get("phone"),email:f.get("email"),consent:true});setSent(true)}
 return <main className="consumer"><header className="productTop"><Logo/><span>{tag.retailers?.name||"En magasin"}</span></header><section className="productHero"><div className="brand">{b.name||"Marque"}</div><h1>{p.model||p.name}</h1>{price>0&&<div className="productPrice">{euro(price)} <small>Prix public conseillé</small></div>}{p.image_url&&<img className="productImage" src={p.image_url} alt={p.model||p.name}/>}<div className="meta">{size&&<span>Taille {size}</span>}{color&&<span>{color}</span>}</div>{primaryComponents.length>0&&<div className="components"><h2>Équipement</h2>{primaryComponents.map(([k,v])=><div className="componentRow" key={k}><span>{k}</span><b>{v}</b></div>)}{showSpecs&&secondaryComponents.map(([k,v])=><div className="componentRow" key={k}><span>{k}</span><b>{v}</b></div>)}{secondaryComponents.length>0&&<button className="specToggle" onClick={()=>setShowSpecs(!showSpecs)}>{showSpecs?"Réduire":"Voir tous les composants"}</button>}</div>}<div className="sheetActions"><button className="primary full" onClick={printSheet}>Télécharger la fiche PDF</button><button className="save full" onClick={()=>setForm(!form)}>Recevoir cette fiche par e-mail</button></div>{p.product_url&&<a className="textBtn productLink" href={p.product_url} target="_blank" rel="noreferrer">Voir la fiche officielle {b.name||""}</a>}</section>
 {form&&<section className="lead">{sent?<div className="success"><b>Fiche enregistrée.</b><p>Votre demande concernant ce vélo a bien été transmise.</p></div>:<form onSubmit={submit}><h2>Recevoir cette fiche</h2><p>Indiquez vos coordonnées pour retrouver ce vélo et, si vous le souhaitez, être recontacté par le magasin.</p><div className="grid"><input name="first" placeholder="Prénom"/><input name="last" placeholder="Nom"/><input name="phone" placeholder="Téléphone"/><input name="email" type="email" placeholder="E-mail" required/></div><label className="consent"><input type="checkbox" required/> J’accepte que mes coordonnées soient transmises au magasin au sujet de ce produit.</label><button className="primary full">Envoyer ma demande</button></form>}</section>}
 <footer><span>Propulsé par</span><Logo/></footer></main>
}
function Logo(){return <div className="logo"><span>Q</span><span>R</span>etail</div>}
