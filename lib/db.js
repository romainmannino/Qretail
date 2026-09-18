const URL=process.env.NEXT_PUBLIC_SUPABASE_URL||"https://wujraajfzrfgpeeteerp.supabase.co";
const KEY=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||"sb_publishable_CmL3epmuHsTjbTqMkmjsLw_IO9q3J2V";
const headers={apikey:KEY,Authorization:"Bearer "+KEY,"Content-Type":"application/json"};

export async function getTag(token){
  const r=await fetch(URL+"/rest/v1/qr_tags?token=eq."+encodeURIComponent(token)+"&select=*,products(*,brands(*))",{headers,cache:"no-store"});
  if(!r.ok)throw new Error("getTag "+r.status+" "+await r.text());
  const d=await r.json();
  return Array.isArray(d)?(d[0]||null):null;
}
export async function getProducts(search=""){
  const term=String(search||"").trim();
  let url=URL+"/rest/v1/products?select=*,brands(*)&order=name.asc&limit=200";
  if(term){
    const safe=term.replace(/[,*()]/g," ").trim();
    url+="&or="+encodeURIComponent("(name.ilike.*"+safe+"*,model.ilike.*"+safe+"*)");
  }
  const r=await fetch(url,{headers,cache:"no-store"});
  if(!r.ok)throw new Error("getProducts "+r.status+" "+await r.text());
  const d=await r.json();
  return Array.isArray(d)?d:[];
}
export async function getModelVariants(model){
  const m=String(model||"").trim();
  if(!m)return [];
  const url=URL+"/rest/v1/products?select=*,brands(*)&model=eq."+encodeURIComponent(m)+"&order=name.asc&limit=500";
  const r=await fetch(url,{headers,cache:"no-store"});
  if(!r.ok)throw new Error("getModelVariants "+r.status+" "+await r.text());
  const d=await r.json();
  return Array.isArray(d)?d:[];
}
export async function getModelColorVariants(model){
  const rows=await getModelVariants(model);
  const seen=new Set();
  return rows.filter(p=>{
    const s=p.specs?.source_row||{},color=s["Summarised Colour (EN)"]||s["Orbea Colour (EN)"]||p.color_code||"";
    const key=color+"|"+(p.image_url||"");
    if(!p.image_url||seen.has(key))return false;
    seen.add(key);return true;
  });
}
export async function configureTag(token,productId){const r=await fetch(URL+"/rest/v1/rpc/configure_qr",{method:"POST",headers,body:JSON.stringify({p_token:token,p_product_id:productId})});return r.ok?await r.json():false}
export async function track(tag){return fetch(URL+"/rest/v1/scan_events",{method:"POST",headers:{...headers,Prefer:"return=minimal"},body:JSON.stringify({qr_tag_id:tag.id,product_id:tag.product_id,event_type:"scan"})})}
export async function lead(data){return fetch(URL+"/rest/v1/leads",{method:"POST",headers:{...headers,Prefer:"return=minimal"},body:JSON.stringify(data)})}
export async function dashboard(){const r=await fetch(URL+"/rest/v1/rpc/mvp_dashboard",{method:"POST",headers,body:"{}"});const d=await r.json();try{const lr=await fetch(URL+"/rest/v1/leads?select=id,first_name,last_name,phone,email,consent,created_at,products(name,model,brands(name)),qr_tags(label,token)&order=created_at.desc&limit=200",{headers,cache:"no-store"});if(lr.ok)d.leadRows=await lr.json()}catch{}return d}
export async function createQr(label){const r=await fetch(URL+"/rest/v1/rpc/mvp_create_qr",{method:"POST",headers,body:JSON.stringify({p_label:label})});return r.json()}

export async function createBrand(name,website){const r=await fetch(URL+"/rest/v1/rpc/mvp_create_brand",{method:"POST",headers,body:JSON.stringify({p_name:name,p_website:website||null})});if(!r.ok)throw new Error(await r.text());return r.json()}
export async function createCatalog(brandId,year,name,sourceUrl){const r=await fetch(URL+"/rest/v1/rpc/mvp_create_catalog",{method:"POST",headers,body:JSON.stringify({p_brand_id:brandId,p_year:Number(year),p_name:name,p_source_url:sourceUrl||null})});if(!r.ok)throw new Error(await r.text());return r.json()}

export async function resetQr(token){const r=await fetch(URL+"/rest/v1/rpc/reset_qr",{method:"POST",headers,body:JSON.stringify({p_token:token})});if(!r.ok)throw new Error(await r.text());return r.json()}
