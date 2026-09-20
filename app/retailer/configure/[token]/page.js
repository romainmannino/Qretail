"use client";
import {useEffect,useMemo,useState} from "react";
import {getTag,getProducts,getModelVariants,configureTag,configureTagUrl} from "../../../../lib/db";

export default function Configure(){
 const [token,setToken]=useState("");
 const [tag,setTag]=useState(null);
 const [products,setProducts]=useState([]);
 const [q,setQ]=useState("");
 const [selected,setSelected]=useState(null);
 const [done,setDone]=useState(false);\n const [destination,setDestination]=useState(""),[url,setUrl]=useState("");
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const [modelChoice,setModelChoice]=useState(null),[catalogChoice,setCatalogChoice]=useState(""),[size,setSize]=useState(""),[color,setColor]=useState("");

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

 const list=useMemo(()=>{const term=q.trim().toLowerCase();if(term.length<2)return [];const seen=new Set();return products.filter(p=>((p?.name||"")+" "+(p?.model||"")+" "+(p?.brands?.name||"")+" "+(p?.specs?.family||"")).toLowerCase().includes(term)).filter(p=>{const m=(p?.model||p?.name)+"|"+(p?.catalog_id||"");if(seen.has(m))return false;seen.add(m);return true}).slice(0,30)},[products,q]);
 const variants=useMemo(()=>modelChoice?products.filter(p=>p.model===modelChoice&&(!catalogChoice||p.catalog_id===catalogChoice)):[],[products,modelChoice,catalogChoice]);
 const sizes=useMemo(()=>[...new Set(variants.map(p=>p?.specs?.size).filter(Boolean))],[variants]);
 const colors=useMemo(()=>[...new Map(variants.map(p=>[p?.color_code,{code:p?.color_code,label:p?.specs?.source_row?.["Summarised Colour (EN)"]||p?.specs?.source_row?.["Orbea Colour (EN)"]||p?.color_code}]).filter(x=>x[0])).values()],[variants]);
 useEffect(()=>{if(!modelChoice)return;const match=variants.find(p=>(!size||p?.specs?.size===size)&&(!color||p?.color_code===color))||variants[0]||null;setSelected(match)},[modelChoice,size,color,variants]);

 async function saveUrl(){\n   let target=url.trim();if(!/^https?:\\/\\//i.test(target)){setError("L’URL doit commencer par https:// ou http://");return}\n   setError("");try{const ok=await configureTagUrl(token,target);if(!ok){setError("La redirection n’a pas pu être enregistrée.");return}setDone(true)}catch(e){console.error("CONFIGURE_URL_SAVE",e);setError("La redirection n’a pas pu être enregistrée.")}\n }\n\n async function save(){
   if(!selected||!token)return;
   setError("");
   try{
     const ok=await configureTag(token,selected.id);
     if(!ok){setError("L’association n’a pas pu être enregistrée.");return}
     setDone(true);
   }catch(e){console.error("CONFIGURE_SAVE",e);setError("L’association n’a pas pu être enregistrée.")}
 }

 if(loading)return <main className="retailerApp"><div className="retailerBody"><p>Lecture du QR…</p></div></main>;
 if(!tag)return <main className="retailerApp"><div className="retailerBody"><h2>QR inconnu</h2><p>{error||"Ce QR n’appartient pas au parc QRetail."}</p><a className="secondary full linkButton" href="/retailer/scan">Scanner à nouveau</a></div></main>;
 if(done)return <main className="retailerApp"><header className="retailerHead"><span>Affiche configurée</span></header><section className="retailerBody done"><div className="doneMark">✓</div><span className="eyebrow">AFFICHE CONFIGURÉE</span><h2>{destination==="url"?"Redirection web":(selected?.name||"Produit")}</h2><p>{destination==="url"?"Le prochain scan du client ouvrira directement l’adresse web choisie.":"Le prochain scan avec l’appareil photo du client ouvrira la fiche de ce produit."}</p><a className="scanBtn simple" href={"/q/"+encodeURIComponent(token)}><b>{destination==="url"?"Tester la redirection":"Tester la fiche consommateur"}</b></a><a className="secondary full linkButton" href="/retailer/scan">Configurer une autre affiche</a></section></main>;

 return <main className="retailerApp"><header className="retailerHead"><span>Affiche · {tag?.label||token}</span></header><section className="retailerBody"><span className="eyebrow">QR IDENTIFIÉ</span><h2>Que doit ouvrir ce QR ?</h2><p>Le QR reste le même. Vous pouvez modifier sa destination à tout moment.</p><div className="destinationChoices"><button type="button" className={destination==="product"?"active":""} onClick={()=>{setDestination("product");setError("")}}><b>Fiche produit QRetail</b><span>Créer la fiche à partir du catalogue / ePOS.</span></button><button type="button" className={destination==="url"?"active":""} onClick={()=>{setDestination("url");setError("")}}><b>Redirection vers un site</b><span>Ouvrir directement une URL externe.</span></button></div>{tag?.destination_type==="url"&&tag?.destination_url?<div className="current">Destination actuelle : URL externe</div>:tag?.product_id?<div className="current">Destination actuelle : fiche produit QRetail.</div>:null>{destination==="url"?<div className="urlDestination"><label>Adresse du site</label><input value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://www.monsite.fr/fiche-produit"/><p className="urlHint">Le QR physique ne change pas : seule cette destination sera mise à jour.</p><button type="button" className="primary full stickySave" disabled={!url.trim()} onClick={saveUrl}>Associer cette URL à l’affiche</button></div>:destination==="product"?<><label>Rechercher dans le catalogue</label><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Ex. Orca M30"/><div className="productList">{!modelChoice&&list.map(p=><button type="button" key={p.id} className="productChoice" onClick={async()=>{const m=p.model||p.name;setModelChoice(m);setCatalogChoice(p.catalog_id||"");setSize("");setColor("");try{const all=await getModelVariants(m,p.catalog_id||"");setProducts(all)}catch(e){console.error("VARIANT_LOAD",e)}}}><span><b>{p?.model||p?.name||"Produit"}</b><small>{p?.brands?.name||"Orbea"} · MY{p?.catalogs?.year||"—"} · {p?.specs?.family||"Catalogue"}</small></span><i>›</i></button>)}</div>{modelChoice?<div className="variantPicker"><button type="button" className="backModel" onClick={()=>{setModelChoice(null);setCatalogChoice("");setSelected(null);setSize("");setColor("")}}>← Changer de modèle</button><h3>{modelChoice} <small>· MY{variants[0]?.catalogs?.year||"—"}</small></h3><label>Taille <small>facultatif</small></label><div className="optionChips"><button type="button" className={!size?"active":""} onClick={()=>setSize("")}>Toutes</button>{sizes.map(v=><button type="button" key={v} className={size===v?"active":""} onClick={()=>setSize(v)}>{v}</button>)}</div><label>Coloris <small>facultatif</small></label><div className="optionChips"><button type="button" className={!color?"active":""} onClick={()=>setColor("")}>Tous</button>{colors.map(v=><button type="button" key={v.code} className={color===v.code?"active":""} onClick={()=>setColor(v.code)}>{v.label}</button>)}</div></div>:null}{q.trim().length>=2&&!modelChoice&&!list.length&&!error?<p>Aucun modèle trouvé.</p>:null}{error?<p className="scanError">{error}</p>:null}{selected?<button type="button" className="primary full stickySave" onClick={save}>Associer {selected?.name||"ce produit"} à cette affiche</button>:null}</>:null}</section></main>;
}
function Logo(){return <div className="logo darkLogo"><span>Q</span><span>R</span>etail</div>}
