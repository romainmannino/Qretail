"use client";
import {useEffect,useState} from "react";
import {getTag,track,lead} from "../../../lib/db";

export default function Product(){
 const[token,setToken]=useState(""),[tag,setTag]=useState(null),[loading,setLoading]=useState(true),[error,setError]=useState(""),[saved,setSaved]=useState(false),[form,setForm]=useState(false),[sent,setSent]=useState(false);
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
 const components=[["Cadre",s.Frame],["Fourche",s.Fork],["Amortisseur",s.Shock],["Moteur",s.Motor],["Batterie",s.Battery],["Transmission",s["Rear Derailleur"]],["Cassette",s.Cassette],["Freins",s.Brakes],["Roues",s.Wheels],["Pneus",s.Tyres],["Tige de selle",s.Seatpost],["Selle",s.Saddle]].filter(x=>x[1]);
 async function submit(e){e.preventDefault();const f=new FormData(e.currentTarget);await lead({product_id:p.id,qr_tag_id:tag.id,first_name:f.get("first"),last_name:f.get("last"),phone:f.get("phone"),email:f.get("email"),consent:true});setSent(true)}
 return <main className="consumer"><header className="productTop"><Logo/><span>{tag.retailers?.name||"En magasin"}</span></header><section className="productHero"><div className="brand">{b.name||"Marque"}</div><h1>{p.model||p.name}</h1>{p.image_url&&<img className="productImage" src={p.image_url} alt={p.model||p.name}/>}<div className="meta">{p.color_code&&<span>Coloris {p.color_code}</span>}<span>Fiche officielle</span></div>{p.description&&<p>{p.description}</p>}{p.product_url&&<a className="primary full" href={p.product_url} target="_blank" rel="noreferrer">Voir la fiche {b.name||""}</a>}{components.length>0&&<div className="components"><h2>Équipement</h2>{components.map(([k,v])=><div className="componentRow" key={k}><span>{k}</span><b>{v}</b></div>)}</div>}<button className="save full" onClick={()=>setSaved(!saved)}>{saved?"✓ Produit conservé":"Conserver ce produit"}</button><button className="textBtn" onClick={()=>setForm(!form)}>Recevoir la fiche et être recontacté</button></section>
 {form&&<section className="lead">{sent?<div className="success"><b>C’est envoyé.</b><p>Vous pouvez revenir à la fiche produit.</p></div>:<form onSubmit={submit}><h2>Garder le contact</h2><p>Vos coordonnées sont transmises pour votre demande concernant ce produit.</p><div className="grid"><input name="first" placeholder="Prénom"/><input name="last" placeholder="Nom"/><input name="phone" placeholder="Téléphone"/><input name="email" type="email" placeholder="E-mail"/></div><label className="consent"><input type="checkbox" required/> J’accepte d’être recontacté au sujet de ce produit.</label><button className="primary full">Recevoir la fiche</button></form>}</section>}
 <footer><span>Propulsé par</span><Logo/></footer></main>
}
function Logo(){return <div className="logo"><span>Q</span><span>R</span>etail</div>}
