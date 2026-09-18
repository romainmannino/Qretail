import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
import * as XLSX from "xlsx";

const db=()=>createClient(process.env.NEXT_PUBLIC_SUPABASE_URL||"https://wujraajfzrfgpeeteerp.supabase.co",process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||"sb_publishable_CmL3epmuHsTjbTqMkmjsLw_IO9q3J2V");
const norm=(v:any)=>String(v??"").trim();
const key=(v:string)=>v.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g,"");
const pick=(row:any,names:string[])=>{const entries=Object.entries(row);for(const n of names){const target=key(n);const exact=entries.find(([k])=>key(k)===target);if(exact&&norm(exact[1]))return norm(exact[1]);const partial=entries.find(([k])=>key(k).includes(target));if(partial&&norm(partial[1]))return norm(partial[1]);}return ""};

export async function POST(req:Request){
 try{
  const form=await req.formData();
  const file=form.get("file") as File|null,brandId=norm(form.get("brandId")),year=Number(form.get("year")||new Date().getFullYear()),name=norm(form.get("name"))||("EPOS "+year);
  if(!file||!brandId)return NextResponse.json({error:"Fichier et marque obligatoires"},{status:400});

  const wb=XLSX.read(Buffer.from(await file.arrayBuffer()),{type:"buffer"});
  let rows:any[]=[];
  for(const sheetName of wb.SheetNames){
    const candidate=XLSX.utils.sheet_to_json(wb.Sheets[sheetName],{defval:""}) as any[];
    if(candidate.length>rows.length)rows=candidate;
  }
  if(!rows.length)return NextResponse.json({error:"Le fichier ne contient aucune ligne exploitable."},{status:400});

  const client=db();
  let {data:cat,error:findErr}=await client.from("catalogs").select("*").eq("brand_id",brandId).eq("year",year).eq("name",name).maybeSingle();
  if(findErr)throw findErr;
  if(!cat){
    const created=await client.from("catalogs").insert({brand_id:brandId,year,name,source_url:"upload:"+file.name}).select().single();
    if(created.error)throw created.error; cat=created.data;
  }else{
    const cleared=await client.from("products").delete().eq("catalog_id",cat.id);
    if(cleared.error)throw cleared.error;
    await client.from("catalogs").update({source_url:"upload:"+file.name}).eq("id",cat.id);
  }

  const products=rows.map((r:any)=>{
    const productName=pick(r,["Orbea Spain Product Name","Full EN Product Name","Full EN Product Name (Summarised Colour)","product name","model name","description","designation","modele","model","name","produit"]);
    const model=pick(r,["model","modele","family","famille"]);
    const sku=pick(r,["Product Code","sku","reference","ref","code article","article"]);
    const color=pick(r,["Colour Code","color code","colour code","color","couleur"]);
    const url=pick(r,["product url","url","link","lien"]);
    const image=pick(r,["Image SIDE","SIDE2","Image FRONT","image url","image","photo"]);
    const finalName=productName||model||sku;
    if(!finalName)return null;
    return {brand_id:brandId,catalog_id:cat.id,name:finalName,model:model||null,color_code:color||null,product_url:url||"",image_url:image||null,description:null,specs:{sku:sku||null,source_row:r}};
  }).filter(Boolean);

  if(!products.length){
    await client.from("catalogs").delete().eq("id",cat.id);
    return NextResponse.json({error:"Impossible d’identifier les produits du fichier.",columns:Object.keys(rows[0]||{})},{status:422});
  }
  for(let i=0;i<products.length;i+=500){
    const inserted=await client.from("products").insert(products.slice(i,i+500));
    if(inserted.error)throw inserted.error;
  }
  return NextResponse.json({ok:true,imported:products.length,totalRows:rows.length,file:file.name,catalogId:cat.id});
 }catch(e:any){
  console.error("EPOS_IMPORT",e);
  return NextResponse.json({error:e?.message||"Erreur import EPOS"},{status:500});
 }
}