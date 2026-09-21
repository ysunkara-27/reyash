export const HOME='https://www.taskpup.lol/';
export const ORIGINS=['https://taskpup.lol','https://www.taskpup.lol'];
export const WEB_MATCHES=['https://*/*','http://*/*'];
export const DEFAULTS={enabled:true,size:52,corner:'right',motion:'still',snoozeUntil:0,mutedHosts:[]};
export function isTaskPup(url){try{return ORIGINS.includes(new URL(url).origin);}catch{return false;}}
export function hostname(url){try{const u=new URL(url);return ['http:','https:'].includes(u.protocol)?u.hostname:'';}catch{return '';}}
export function cleanSnapshot(raw){
 if(!raw||raw.version!==1||typeof raw.connected!=='boolean')throw new Error('Invalid companion snapshot');
 if(!raw.connected)return {version:1,connected:false};
 const {pet,care}=raw;
 if(!pet||typeof pet.name!=='string'||!pet.name.trim()||pet.name.length>24||!['honey','cream','cocoa','cloud'].includes(pet.coat)||!['sage','berry','blue'].includes(pet.collar)||typeof pet.roaming!=='boolean'||(pet.species!==undefined&&!['dog','cat'].includes(pet.species))||!care||!Number.isInteger(care.used)||care.used<0||care.used>7||!Number.isInteger(care.unlocked)||care.unlocked<0||care.unlocked>3||typeof raw.focused!=='boolean')throw new Error('Invalid companion snapshot');
 return {version:1,connected:true,pet:{name:pet.name.trim(),coat:pet.coat,collar:pet.collar,roaming:pet.roaming,species:pet.species||'dog'},care:{used:care.used,unlocked:care.unlocked},focused:raw.focused};
}
export function cleanSettings(raw={}){
 return {enabled:raw.enabled!==false,size:[44,52,64].includes(raw.size)?raw.size:52,corner:['left','right'].includes(raw.corner)?raw.corner:'right',motion:raw.motion==='gentle'?'gentle':'still',snoozeUntil:Number.isFinite(raw.snoozeUntil)?Math.max(0,raw.snoozeUntil):0,mutedHosts:Array.isArray(raw.mutedHosts)?[...new Set(raw.mutedHosts.filter(h=>typeof h==='string'&&/^[a-z0-9.-]+$/.test(h)&&h.length<=253))].slice(0,200):[]};
}
export function displayState(stored={},host='',now=Date.now()){
 const settings=cleanSettings(stored.settings),snapshot=stored.snapshot;
 return {settings,snapshot:snapshot||null,updatedAt:stored.updatedAt||0,show:!!snapshot?.connected&&settings.enabled&&settings.snoozeUntil<=now&&!settings.mutedHosts.includes(host)};
}
export function resting(snapshot,now=Date.now(),updatedAt=0){return !!snapshot?.focused&&now-updatedAt<120000||snapshot?.care?.used===7;}
