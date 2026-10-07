import type { Session, View } from './service';
import type { Action } from './engine';
// Local Vite proxies /api to the local Worker. Production uses the isolated classroom Worker.
export const API=import.meta.env.VITE_CLASSROOM_API||'';
export const sessionKey='apgov-classroom-session-v1';
export function readSession():Session|null{try{return JSON.parse(localStorage.getItem(sessionKey)||'null');}catch{return null;}}
export function savedSessions():Session[]{try{return JSON.parse(localStorage.getItem('apgov-recent-sessions')||'[]');}catch{return [];}}
export function saveSession(session:Session){localStorage.setItem(sessionKey,JSON.stringify(session));localStorage.setItem('apgov-recent-sessions',JSON.stringify([session,...savedSessions().filter(s=>s.code!==session.code)].slice(0,8)));}
export async function request<T>(code:string,route:string,body?:unknown,token?:string):Promise<T>{
 const res=await fetch(`${API}/api/classes/${code}/${route}`,{method:body===undefined?'GET':'POST',headers:{...(body===undefined?{}:{'Content-Type':'application/json'}),...(token?{Authorization:`Bearer ${token}`}:{})},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(12000)});
 const data=await res.json();if(!res.ok)throw Object.assign(new Error(data.error||'Request failed.'),{view:data.view,status:res.status});return data as T;
}
export function sendAction(session:Session,view:View,gameId:string,action:Action,requestId:string){return request<View>(session.code,'action',{gameId,action,revision:['pauseAll','startAll'].includes(action.type)?view.revision:view.games.find(g=>g.id===gameId)?.revision,requestId},session.token);}
export function newCode(){const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';return Array.from(crypto.getRandomValues(new Uint8Array(6)),n=>alphabet[n%alphabet.length]).join('');}
