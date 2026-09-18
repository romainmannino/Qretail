export async function POST(req){
 try{
  const body=await req.json();
  if(!body?.email||!body?.url)return Response.json({error:"Données manquantes"},{status:400});
  const key=process.env.RESEND_API_KEY;
  if(!key)return Response.json({error:"RESEND_API_KEY absente"},{status:503});
  const esc=v=>String(v||"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
  const html=`<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#101114"><p style="font-size:14px;color:#377cf6;font-weight:700">${esc(body.brand)}</p><h1 style="font-size:32px;margin:8px 0">${esc(body.productName)}</h1>${body.price?`<p style="font-size:24px;font-weight:700">${esc(body.price)}</p>`:""}${body.imageUrl?`<img src="${esc(body.imageUrl)}" alt="" style="display:block;max-width:100%;max-height:330px;margin:25px auto;object-fit:contain"/>`:""}<p>Bonjour ${esc(body.firstName)},</p><p>Voici le vélo que vous avez consulté en magasin.</p><p style="margin:28px 0"><a href="${esc(body.url)}" style="background:#377cf6;color:white;text-decoration:none;padding:14px 22px;border-radius:8px;font-weight:700">Retrouver la fiche du vélo</a></p><p style="color:#747982;font-size:12px">Le lien vous permet de revenir à la fiche QRetail à tout moment.</p></div>`;
  const r=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+key},body:JSON.stringify({from:process.env.RESEND_FROM||"QRetail <onboarding@resend.dev>",to:[body.email],subject:"Votre fiche "+body.productName,html})});
  const data=await r.json().catch(()=>({}));
  if(!r.ok)return Response.json({error:data},{status:r.status});
  return Response.json({ok:true,id:data.id});
 }catch(e){return Response.json({error:e?.message||"Erreur envoi"},{status:500})}
}
