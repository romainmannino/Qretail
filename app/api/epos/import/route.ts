import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
import * as XLSX from "xlsx";
const db=()=>createClient(process.env.NEXT_PUBLIC_SUPABASE_URL||"https://wujraajfzrfgpeeteerp.supabase.co",process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||"sb_publishable_CmL3epmuHsTjbTqMkmjsLw_IO9q3J2V");
const norm=(v:any)=>String(v??"").trim();
const pick=(row:any,names:string[])=>{const keys=Object.keys(row);for(const n of names){const k=keys.find(x=>x.toLowerCase().replace(/[^a-z0-9]/g,"").includes(n));if(k&&norm(row[k]))return norm(row[k]);}return ""};
export async function POST(req:Request){try{
 const form=await req.formData(),file=form.get("file") as File|null,brandId=norm(form.get("brandId")),year=Number(form.get("year")||new Date().getFullYear()),name=norm(form.get("name"))||("EPOS "+year);
 if(!file||!brandId)return NextResponse.json({error:"Fichier et marque obligatoires"},{status:400});
 const wb=XLSX.read(Buffer.from(await file.arrayBuffer()),{type:"buffer"}),ws=wb.Sheets[wb.SheetNames[0]],rows=XLSX.utils.sheet_to_json(ws,{defval:""}) as any[];
 if(!rows.length)return NextResponse.json({error:"Le fichier ne contient aucune ligne exploitable."},{status:400});
 const {data:cat,error:ce}=await db().from("catalogs").insert({brand_id:brandId,year,name,source_url:"upload:"+file.name}).select().single();if(ce)throw ce;
 const products=rows.map((r:any)=>{const productName=pick(r,["productname","modelname","description","designation","modele","model","name","produit"]),model=pick(r,["model","modele","family","famille"]),sku=pick(r,["sku","reference","ref","codearticle","article"]),color=pick(r,["colorcode","colourcode","color","couleur"]),url=pick(r,["producturl","url","link","lien"]);return{brand_id:brandId,catalog_id:cat.id,name:productName||model||sku,model:model||null,sku:sku||null,color_code:color||null,product_url:url||null}}).filter((x:any)=>x.name);
 if(!products.length)return NextResponse.json({error:"Impossible d’identifier une colonne produit/modèle.",columns:Object.keys(rows[0])},{status:422});
 const {error:pe}=await db().from("products").insert(products);if(pe)throw pe;
 return NextResponse.json({ok:true,imported:products.length,totalRows:rows.length,file:file.name});
}catch(e:any){return NextResponse.json({error:e?.message||"Erreur import EPOS"},{status:500})}}