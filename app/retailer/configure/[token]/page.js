"use client";
import {useEffect,useMemo,useState} from "react";
import {getTag,getProducts,configureTag} from "../../../../lib/db";

export default function Configure(){
  const [token,setToken]=useState("");
  const [tag,setTag]=useState(null);
  const [products,setProducts]=useState([]);
  const [q,setQ]=useState("");
  const [selected,setSelected]=useState(null);
  const [done,setDone]=useState(false);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");

  useEffect(()=>{
    const parts=window.location.pathname.split("/").filter(Boolean);
    const raw=parts[parts.length-1]||"";
    let t="";
    try{t=decodeURIComponent(raw)}catch{t=raw}
    setToken(t);
    if(!t){setError("QR invalide.");setLoading(false);return}
    let alive=true;
    (async()=>{
      try{
        const qr=await getTag(t);
        if(!alive)return;
        setTag(qr);
        if(!qr){setError("Ce QR n’appartient pas au parc QRetail.");return}
        const p=await getProducts();
        if(alive)setProducts(Array.isArray(p)?p:[]);
      }catch(e){
        console.error("Configure load failed",e);
        if(alive)setError("QR reconnu, mais les données n’ont pas pu être chargées.");
      }finally{if(alive)setLoading(false)}
    })();
    return()=>{alive=false};
  },[]);

  const list=useMemo(()=>products.filter(p=>{
    const brand=p?.brands?.name||"";
    return ((p?.name||"")+" "+(p?.model||"")+" "+brand).toLowerCase().includes(q.toLowerCase());
  }).slice(0,30),[products,q]);

  async function save(){
    if(!selected||!token)return;
    setError("");
    try{
      const ok=await configureTag(token,selected.id);
      if(!ok){setError("L’association n’a pas pu être enregistrée.");return}
      setDone(true);
    }catch(e){setError("L’association n’a pas pu être enregistrée.")}
  }

  if(loading)return <main className="retailerApp"><div className="retailerBody"><Logo/><p>Lecture du QR…</p></div></main>;
  if(!tag)return <main className="retailerApp"><div className="retailerBody"><Logo/><h2>QR inconnu</h2><p>{error||"Ce QR n’appartient pas au parc QRetail."}</p><a className="secondary full linkButton" href="/retailer/scan">Scanner à nouveau</a></div></main>;
  if(done)return <main className="retailerApp"><header className="retailerHead"><Logo/><span>Affiche configurée</span></header><section className="retailerBody done"><div className="doneMark">✓</div><span className="eyebrow">AFFICHE CONFIGURÉE</span><h2>{selected?.name}</h2><p>Le prochain scan avec l’appareil photo du client ouvrira la fiche de ce produit.</p><a className="scanBtn simple" href={"/q/"+encodeURIComponent(token)}><b>Tester la fiche consommateur</b></a><a className="secondary full linkButton" href="/retailer/scan">Configurer une autre affiche</a></section></main>;

  return <main className="retailerApp"><header className="retailerHead"><Logo/><span>Affiche · {tag.label||token}</span></header><section className="retailerBody"><span className="eyebrow">QR IDENTIFIÉ</span><h2>{tag.product_id?"Changer le vélo associé":"Quel vélo est devant vous ?"}</h2><p>QR reconnu. Choisissez maintenant le produit à afficher aux clients.</p>{tag.product_id&&<div className="current">Actuellement : <b>{tag.products?.name||"Produit associé"}</b></div>}<label>Rechercher dans le catalogue</label><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Ex. Orca M30"/><div className="productList">{list.map(p=><button type="button" key={p.id} className={selected?.id===p.id?"productChoice selected":"productChoice"} onClick={()=>setSelected(p)}><span><b>{p.name}</b><small>{p.brands?.name||"Orbea"} · {p.model||p.color_code||"Catalogue"}</small></span><i>{selected?.id===p.id?"✓":"›"}</i></button>)}</div>{!list.length&&!error&&<p>Aucun produit disponible dans l’EPOS importé.</p>}{error&&<p className="scanError">{error}</p>}{selected&&<button type="button" className="primary full stickySave" onClick={save}>Associer {selected.name} à cette affiche</button>}</section></main>
}
function Logo(){return <div className="logo darkLogo"><span>Q</span><span>R</span>etail</div>}
