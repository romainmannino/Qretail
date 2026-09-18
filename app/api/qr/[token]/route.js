import QRCode from "qrcode";
export async function GET(req,{params}){const {token}=await params;const base=new URL(req.url).origin;const png=await QRCode.toBuffer(base+"/q/"+token,{width:900,margin:3,errorCorrectionLevel:"H"});return new Response(png,{headers:{"Content-Type":"image/png","Cache-Control":"public, max-age=31536000, immutable"}})}
