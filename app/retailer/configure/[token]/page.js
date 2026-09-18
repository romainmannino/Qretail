"use client";
import {useEffect,useMemo,useState} from "react";
import {getTag,getProducts,getModelVariants,configureTag} from "../../../../lib/db";

export default function Configure(){
 const [token,setToken]=useState("");
 const [tag,setTag]=useState(null);
 const [products,setProducts]=useState([]);
 const [q,setQ]=useState("");
 const [selected,setSelected]=useState(null);
 const [done,setDone]=useState(false);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const [modelChoice,setModelChoice]=useState(null),[size,setSize]=useState(""),[color,setColor]=useState("");

 useEffect(()=>{
   const raw=window.location.pathname.split("/").filter(Boolean).pop()||"";
   let t=raw; try{t=decodeURIComponent(raw)}catch{}
   setToken(t);
   if(!t){setError("QR invalide.");setLoading(false);return}
   let alive=true;
   (async()=>{
     try{
       const qr=await getTag(t);
       if(!alive)return;
       setTag(qr);
       if(!qr){setError("Ce QR n’appartient pas au parc QRetail.");return}
       if(alive)setProducts([]);
     }catch(e){
       console.error("CONFIGURE_LOAD",e);
       if(alive)setError("Impossible de charger les données de configuration.");
     }finally{if(alive)setLoading(false)}
   })();
   return()=>{alive=false};
 },[]);

 useEffect(()=>{
   const term=q.trim();
   if(term.length<2){setProducts([]);return}
   let alive=true;
   const timer=setTimeout(async()=>{
     try{const p=await getProducts(term);if(alive)setProducts(Array.isArray(p)?p:[])}
     catch(e){console.error("PRODUCT_SEARCH",e);if(alive)setProducts([])}
   },250);
   return()=>{alive=false;clearTimeout(timer)}
 },[q]);

 const list=useMemo(()=>{const term=q.trim().toLowerCase();if(term.length<2)return [];const seen=new Set();return products.filter(p=>((p?.name||"")+" "+(p?.model||"")+" "+(p?.brands?.name||"")+" "+(p?.specs?.family||"")).toLowerCase().includes(term)).filter(p=>{const m=p?.model||p?.name;if(seen.has(m))return false;seen.add(m);return true}).slice(0,30)},[products,q]);
 const variants=useMemo(()=>modelChoice?products.filter(p=>p.model===modelChoice):[],[products,modelChoice]);
 const sizes=useMemo(()=>[...new Set(variants.map(p=>p?.specs?.size).filter(Boolean))],[variants]);
 const colors=useMemo(()=>[...new Map(variants.map(p=>[p?.color_code,{code:p?.color_code,label:p?.specs?.source_row?.["Summarised Colour (EN)"]||p?.specs?.source_row?.["Orbea Colour (EN)"]||p?.color_code}]).filter(x=>x[0])).values()],[variants]);
 useEffect(()=>{if(!modelChoice)return;const match=variants.find(p=>(!size||p?.specs?.size===size)&&(!color||p?.color_code===color))||variants[0]||null;setSelected(match)},[modelChoice,size,color,variants]);

 async function save(){
   if(!selected||!token)return;
   setError("");
   try{
     const ok=await configureTag(token,selected.id);
     if(!ok){setError("L’association n’a pas pu être enregistrée.");return}
     setDone(true);
   }catch(e){console.error("CONFIGURE_SAVE",e);setError("L’association n’a pas pu être enregistrée.")}
 }

 if(loading)return <main className="retailerApp"><div className="retailerBody"><Logo/><p>Lecture du QR…</p></div></main>;
 if(!tag)return <main className="retailerApp"><div className="retailerBody"><Logo/><h2>QR inconnu</h2><p>{error||"Ce QR n’appartient pas au parc QRetail."}</p><a className="secondary full linkButton" href="/retailer/scan">Scanner à nouveau</a></div></main>;
 if(done)return <main className="retailerApp"><header className="retailerHead"><Logo/><span>Affiche configurée</span></header><section className="retailerBody done"><div className="doneMark">✓</div><span className="eyebrow">AFFICHE CONFIGURÉE</span><h2>{selected?.name||"Produit"}</h2><p>Le prochain scan avec l’appareil photo du client ouvrira la fiche de ce produit.</p><a className="scanBtn simple" href={"/q/"+encodeURIComponent(token)}><b>Tester la fiche consommateur</b></a><a className="secondary full linkButton" href="/retailer/scan">Configurer une autre affiche</a></section></main>;

 return <main className="retailerApp"><header className="retailerHead"><Logo/><span>Affiche · {tag?.label||token}</span></header><section className="retailerBody"><span className="eyebrow">QR IDENTIFIÉ</span><h2>{tag?.product_id?"Changer le vélo associé":"Quel vélo est devant vous ?"}</h2><p>QR reconnu. Choisissez maintenant le produit à afficher aux clients.</p>{tag?.product_id?<div className="current">Un produit est actuellement associé à cette affiche.</div>:null}<label>Rechercher dans le catalogue</label><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Ex. Orca M30"/><div className="productList">{!modelChoice&&list.map(p=><button type="button" key={p.id} className="productChoice" onClick={async()=>{const m=p.model||p.name;setModelChoice(m);setSize("");setColor("");try{const all=await getModelVariants(m);setProducts(all)}catch(e){console.error("VARIANT_LOAD",e)}}}><span><b>{p?.model||p?.name||"Produit"}</b><small>{p?.brands?.name||"Orbea"} · {p?.specs?.family||"Catalogue"}</small></span><i>›</i></button>)}</div>{modelChoice?<div className="variantPicker"><button type="button" className="backModel" onClick={()=>{setModelChoice(null);setSelected(null);setSize("");setColor("")}}>← Changer de modèle</button><h3>{modelChoice}</h3><label>Taille <small>facultatif</small></label><div className="optionChips"><button type="button" className={!size?"active":""} onClick={()=>setSize("")}>Toutes</button>{sizes.map(v=><button type="button" key={v} className={size===v?"active":""} onClick={()=>setSize(v)}>{v}</button>)}</div><label>Coloris <small>facultatif</small></label><div className="optionChips"><button type="button" className={!color?"active":""} onClick={()=>setColor("")}>Tous</button>{colors.map(v=><button type="button" key={v.code} className={color===v.code?"active":""} onClick={()=>setColor(v.code)}>{v.label}</button>)}</div></div>:null}{q.trim().length>=2&&!modelChoice&&!list.length&&!error?<p>Aucun modèle trouvé.</p>:null}{error?<p className="scanError">{error}</p>:null}{selected?<button type="button" className="primary full stickySave" onClick={save}>Associer {selected?.name||"ce produit"} à cette affiche</button>:null}</section></main>;
}
function Logo(){return <div className="logo darkLogo"><span>Q</span><span>R</span>etail</div>}
