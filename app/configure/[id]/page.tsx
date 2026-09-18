"use client";
import {useEffect,useState} from "react";
import {useParams} from "next/navigation";
import {getProducts,configureTag} from "../../../lib/db";

export default function Configure(){
 const params=useParams();
 const id=Array.isArray(params?.id)?params.id[0]:String(params?.id||"");
 const [products,setProducts]=useState<any[]>([]);
 const [productId,setProductId]=useState("");
 const [loading,setLoading]=useState(true);
 const [msg,setMsg]=useState("");
 useEffect(()=>{getProducts().then(p=>{setProducts(p);setLoading(false)}).catch(()=>{setMsg("Impossible de charger le catalogue.");setLoading(false)})},[]);
 async function save(){
   if(!productId){setMsg("Choisissez d’abord un produit.");return}
   setMsg("Enregistrement…");
   try{const ok=await configureTag(id,productId);setMsg(ok?"Affiche configurée avec succès.":"Configuration impossible.");}
   catch{setMsg("Configuration impossible.");}
 }
 return <main className="consumer"><header className="productTop"><div className="logo"><span>Q</span><span>R</span>etail</div><span>Commerçant</span></header>
 <section className="productHero">
   <div className="meta"><span>QR {id}</span><span>Configuration magasin</span></div>
   <h1>Configurer l’affiche</h1>
   <p>Associez ce QR physique à un produit. Le consommateur qui le scannera avec l’appareil photo de son téléphone verra ensuite la fiche configurée.</p>
   <label>Produit</label>
   <select value={productId} onChange={e=>setProductId(e.target.value)} disabled={loading}>
     <option value="">{loading?"Chargement du catalogue…":"Choisir un vélo"}</option>
     {products.map((p:any)=><option key={p.id} value={p.id}>{p.brands?.name? p.brands.name+" · ":""}{p.name}</option>)}
   </select>
   <button className="primary full" onClick={save} disabled={loading}>Associer ce produit au QR</button>
   {msg&&<p>{msg}</p>}
 </section></main>
}