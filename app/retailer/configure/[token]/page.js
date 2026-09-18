"use client";
import {useEffect,useMemo,useState} from "react";
import {useParams} from "next/navigation";
import {getTag,getProducts,configureTag} from "../../../../lib/db";

export default function Configure(){
  const params=useParams();
  const token=Array.isArray(params?.token)?params.token[0]:params?.token;
  const [tag,setTag]=useState(null);
  const [products,setProducts]=useState([]);
  const [q,setQ]=useState("");
  const [selected,setSelected]=useState(null);
  const [done,setDone]=useState(false);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");

  useEffect(()=>{
    if(!token)return;
    let alive=true;
    (async()=>{
      try{
        const [t,p]=await Promise.all([getTag(token),getProducts()]);
        if(!alive)return;
        setTag(t);
        setProducts(Array.isArray(p)?p:[]);
      }catch(e){
        if(alive)setError("Impossible de charger ce QR pour le moment.");
      }finally{
        if(alive)setLoading(false);
      }
    })();
    return()=>{alive=false};
  },[token]);

  const list=useMemo(()=>products.filter(p=>{
    const brand=p?.brands?.name||"";
    return ((p?.name||"")+" "+(p?.model||"")+" "+brand).toLowerCase().includes(q.toLowerCase());
  }).slice(0,12),[products,q]);

  async function save(){
    if(!selected||!token)return;
    setError("");
    try{
      const ok=await configureTag(token,selected.id);
      if(!ok){setError("L’association n’a pas pu être enregistrée.");return}
      setTag(await getTag(token));
      setDone(true);
    }catch(e){setError("L’association n’a pas pu être enregistrée.")}
  }

  if(loading)return <main className="retailerApp"><div className="retailerBody"><Logo/><p>Lecture du QR…</p></div></main>;
  if(error&&!tag)return <main className="retailerApp"><div className="retailerBody"><Logo/><h2>QR non disponible</h2><p>{error}</p><a className="secondary full linkButton" href="/retailer/scan">Scanner à nouveau</a></div></main>;
  if(!tag)return <main className="retailerApp"><div className="retailerBody"><Logo/><h2>QR inconnu</h2><p>Ce QR n’appartient pas au parc QRetail.</p><a className="secondary full linkButton" href="/retailer/scan">Scanner à nouveau</a></div></main>;

  if(done)return <main className="retailerApp">
    <header className="retailerHead"><Logo/><span>Affiche configurée</span></header>
    <section className="retailerBody done">
      <div className="doneMark">✓</div><span className="eyebrow">AFFICHE CONFIGURÉE</span>
      <h2>{selected?.name}</h2>
      <p>Le prochain scan avec l’appareil photo du client ouvrira la fiche de ce produit.</p>
      <a className="scanBtn simple" href={"/q/"+encodeURIComponent(token)}><b>Tester la fiche consommateur</b></a>
      <a className="secondary full linkButton" href="/retailer/scan">Configurer une autre affiche</a>
    </section>
  </main>;

  return <main className="retailerApp">
    <header className="retailerHead"><Logo/><span>Affiche · {tag.label||token}</span></header>
    <section className="retailerBody">
      <span className="eyebrow">QR IDENTIFIÉ</span>
      <h2>{tag.product_id?"Changer le vélo associé":"Quel vélo est devant vous ?"}</h2>
      <p>QR reconnu. Choisissez maintenant le produit à afficher aux clients.</p>
      {tag.product_id&&<div className="current">Actuellement : <b>{tag.products?.name||"Produit associé"}</b></div>}
      <label>Rechercher dans le catalogue</label>
      <input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="Ex. Orca M30"/>
      <div className="productList">
        {list.map(p=><button type="button" key={p.id} className={selected?.id===p.id?"productChoice selected":"productChoice"} onClick={()=>setSelected(p)}>
          <span><b>{p.name}</b><small>{p.brands?.name||"Marque"} · {p.color_code?"Coloris "+p.color_code:"Catalogue"}</small></span>
          <i>{selected?.id===p.id?"✓":"›"}</i>
        </button>)}
      </div>
      {!list.length&&<p>Aucun produit correspondant dans l’EPOS importé.</p>}
      {error&&<p>{error}</p>}
      {selected&&<button type="button" className="primary full stickySave" onClick={save}>Associer {selected.name} à cette affiche</button>}
    </section>
  </main>
}
function Logo(){return <div className="logo darkLogo"><span>Q</span><span>R</span>etail</div>}
