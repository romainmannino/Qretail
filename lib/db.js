const URL=process.env.NEXT_PUBLIC_SUPABASE_URL||"https://wujraajfzrfgpeeteerp.supabase.co";
const KEY=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||"sb_publishable_CmL3epmuHsTjbTqMkmjsLw_IO9q3J2V";
const headers={apikey:KEY,Authorization:"Bearer "+KEY,"Content-Type":"application/json"};
export async function getTag(token){const r=await fetch(URL+"/rest/v1/qr_tags?token=eq."+encodeURIComponent(token)+"&select=*,products(*,brands(*)),retailers(*)",{headers,cache:"no-store"});const d=await r.json();return d?.[0]||null}
export async function getProducts(){const r=await fetch(URL+"/rest/v1/products?select=*,brands(*)&order=name.asc",{headers,cache:"no-store"});const d=await r.json();return Array.isArray(d)?d:[]}
export async function configureTag(token,productId){const r=await fetch(URL+"/rest/v1/rpc/configure_qr",{method:"POST",headers,body:JSON.stringify({p_token:token,p_product_id:productId})});return r.ok?await r.json():false}
export async function track(tag){return fetch(URL+"/rest/v1/scan_events",{method:"POST",headers:{...headers,Prefer:"return=minimal"},body:JSON.stringify({qr_tag_id:tag.id,product_id:tag.product_id,event_type:"scan"})})}
export async function lead(data){return fetch(URL+"/rest/v1/leads",{method:"POST",headers:{...headers,Prefer:"return=minimal"},body:JSON.stringify(data)})}
export async function dashboard(){const r=await fetch(URL+"/rest/v1/rpc/mvp_dashboard",{method:"POST",headers,body:"{}"});return r.json()}
export async function createQr(label){const r=await fetch(URL+"/rest/v1/rpc/mvp_create_qr",{method:"POST",headers,body:JSON.stringify({p_label:label})});return r.json()}
