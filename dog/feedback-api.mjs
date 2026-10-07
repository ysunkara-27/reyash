// Blindspot feedback: a short public form for radiologists who tried the trainer.
// POST /feedback/submit stores one row; the private stats report summarises them.
const ROLES=new Set(['radiologist','resident','medical_student','other_clinician','other']);
const YEARS=new Set(['<5','5-15','>15','']);
const REAL_PRODUCT=new Set(['yes','maybe','no']);
const RATINGS=['ease','teaching','accuracy','recommend'];
const MAX_BODY=4096,MAX_MISSING=600,MAX_CONTACT=200,MAX_UA=300,PER_HOUR=5,HOUR=3600000;
const hex=buffer=>Array.from(new Uint8Array(buffer),byte=>byte.toString(16).padStart(2,'0')).join('');

export async function ensureFeedbackTable(env){
 await env.DB.prepare('CREATE TABLE IF NOT EXISTS blindspot_feedback (id TEXT PRIMARY KEY, created INTEGER NOT NULL, role TEXT, years TEXT, ease INTEGER, teaching INTEGER, accuracy INTEGER, recommend INTEGER, real_product TEXT, missing TEXT, contact TEXT, ua TEXT)').run();
 await env.DB.prepare('CREATE INDEX IF NOT EXISTS blindspot_feedback_created ON blindspot_feedback(created)').run();
 await env.DB.prepare('CREATE TABLE IF NOT EXISTS blindspot_feedback_limits (ip_hash TEXT NOT NULL, created INTEGER NOT NULL)').run();
 await env.DB.prepare('CREATE INDEX IF NOT EXISTS blindspot_feedback_limits_ip ON blindspot_feedback_limits(ip_hash,created)').run();
}

async function readBody(request){
 const reader=request.body?.getReader();
 if(!reader)return {error:'Send the form as JSON.'};
 let size=0;const chunks=[];
 while(true){
  const {done,value}=await reader.read();if(done)break;
  size+=value.length;if(size>MAX_BODY){await reader.cancel();return {error:'Please keep your answers shorter.',status:413};}
  chunks.push(value);
 }
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
 try{const body=JSON.parse(new TextDecoder().decode(bytes));return body&&typeof body==='object'&&!Array.isArray(body)?{body}:{error:'Invalid request.'};}
 catch{return {error:'Invalid request.'};}
}

const text=(value,max)=>{if(value===undefined||value===null)return '';if(typeof value!=='string')return null;const trimmed=value.trim();return trimmed.length<=max?trimmed:null;};

// Returns {row} or {error}. Pure, so the tests can cover every branch without a database.
export function validateFeedback(body){
 if(!ROLES.has(body.role))return {error:'Choose a role.'};
 const years=body.years===undefined||body.years===null?'':body.years;
 if(!YEARS.has(years))return {error:'Choose years in practice from the options given.'};
 const ratings={};
 for(const key of RATINGS){
  const value=body[key];
  if(!Number.isInteger(value)||value<1||value>5)return {error:`Rate "${key}" from 1 to 5.`};
  ratings[key]=value;
 }
 if(!REAL_PRODUCT.has(body.real_product))return {error:'Answer whether this could become a real tool.'};
 const missing=text(body.missing,MAX_MISSING);if(missing===null)return {error:`Keep "what's missing" under ${MAX_MISSING} characters.`};
 const contact=text(body.contact,MAX_CONTACT);if(contact===null)return {error:`Keep contact details under ${MAX_CONTACT} characters.`};
 return {row:{role:body.role,years,...ratings,real_product:body.real_product,missing,contact}};
}

export async function handleFeedback(request,env,headers={}){
 const reply=(data,status=200)=>Response.json(data,{status,headers:{...headers,'cache-control':'no-store'}});
 const path=new URL(request.url).pathname;
 if(path!=='/feedback/submit')return reply({error:'Not found.'},404);
 if(request.method!=='POST')return reply({error:'Method not allowed.'},405);
 try{
  await ensureFeedbackTable(env);
  const {body,error,status}=await readBody(request);
  if(error)return reply({error},status||400);
  const checked=validateFeedback(body);
  if(checked.error)return reply({error:checked.error},400);
  const row=checked.row;
  const ip=request.headers.get('CF-Connecting-IP')||'local';
  const ipHash=hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(ip)));
  const ua=(request.headers.get('user-agent')||'').slice(0,MAX_UA);
  const now=Date.now(),id=crypto.randomUUID();
  // The per-IP limit lives in a small side table so the feedback schema stays plain.
  // The guard sits inside the insert, so concurrent submissions cannot slip past it.
  await env.DB.prepare('DELETE FROM blindspot_feedback_limits WHERE created<?').bind(now-HOUR).run();
  const allowed=await env.DB.prepare('INSERT INTO blindspot_feedback_limits(ip_hash,created) SELECT ?,? WHERE (SELECT COUNT(*) FROM blindspot_feedback_limits WHERE ip_hash=? AND created>?)<?').bind(ipHash,now,ipHash,now-HOUR,PER_HOUR).run();
  if(!allowed.meta.changes)return reply({error:'Thanks — that is plenty for one hour. Try again later.'},429);
  await env.DB.prepare('INSERT INTO blindspot_feedback(id,created,role,years,ease,teaching,accuracy,recommend,real_product,missing,contact,ua) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)')
   .bind(id,now,row.role,row.years,row.ease,row.teaching,row.accuracy,row.recommend,row.real_product,row.missing,row.contact,ua).run();
  return reply({ok:true,id});
 }catch(error){console.error('Feedback request failed',error);return reply({error:'Feedback is unavailable right now. Please try again.'},503);}
}

// Summary for the private stats report: counts, averages, verdicts and the latest rows.
export async function feedbackReport(env){
 await ensureFeedbackTable(env);
 const summary=(await env.DB.prepare(`SELECT COUNT(*) AS n,AVG(ease) AS ease,AVG(teaching) AS teaching,AVG(accuracy) AS accuracy,AVG(recommend) AS recommend,
  SUM(CASE WHEN real_product='yes' THEN 1 ELSE 0 END) AS yes,SUM(CASE WHEN real_product='maybe' THEN 1 ELSE 0 END) AS maybe,SUM(CASE WHEN real_product='no' THEN 1 ELSE 0 END) AS no
  FROM blindspot_feedback`).first())||{};
 const recent=(await env.DB.prepare('SELECT id,created,role,years,ease,teaching,accuracy,recommend,real_product,missing,contact FROM blindspot_feedback ORDER BY created DESC,id LIMIT 50').all()).results;
 const average=value=>value===null||value===undefined?null:Math.round(Number(value)*100)/100;
 return {
  n:Number(summary.n||0),
  averages:{ease:average(summary.ease),teaching:average(summary.teaching),accuracy:average(summary.accuracy),recommend:average(summary.recommend)},
  real_product:{yes:Number(summary.yes||0),maybe:Number(summary.maybe||0),no:Number(summary.no||0)},
  recent,
 };
}
