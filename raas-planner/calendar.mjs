export const day=d=>Date.parse(`${d}T12:00:00Z`)/86400000;
export function week(d){const t=new Date(`${d}T12:00:00Z`);return day(d)-((t.getUTCDay()+6)%7);}
export function haversine(a,b){
 if(!a||!b||![a.lat,a.lon,b.lat,b.lon].every(Number.isFinite))return null;
 const r=Math.PI/180,v=Math.sin((b.lat-a.lat)*r/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin((b.lon-a.lon)*r/2)**2;
 return 3958.76*2*Math.atan2(Math.sqrt(Math.min(1,v)),Math.sqrt(Math.max(0,1-v)));
}
