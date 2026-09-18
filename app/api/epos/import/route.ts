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
  const ws=wb.Sheets[wb.SheetNames[0]];
  const rows=XLSX.utils.sheet_to_json(ws,{range:1,defval:"",raw:false}) as any[];
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
    const productCode=norm(r["Product Code"]);
    const productName=norm(r["Orbea Spain Product Name"])||norm(r["Full EN Product Name"])||norm(r["Full EN Product Name (Summarised Colour)"])||norm(r["Model"]);
    if(!productCode||!productName)return null;
    return {
      brand_id:brandId,catalog_id:cat.id,name:productName,
      model:norm(r["Model"])||norm(r["Model ID"])||null,
      color_code:norm(r["Colour Code"])||null,
      product_url:"",image_url:norm(r["Image SIDE"])||norm(r["SIDE2"])||norm(r["Image FRONT"])||null,
      description:null,
      specs:{product_code:productCode,model_id:norm(r["Model ID"])||null,family:norm(r["Family"])||null,size:norm(r["Size"])||null,fr_rrp:norm(r["FR RRP"])||null,ean:norm(r["EAN"])||null,source_row:r}
    };
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