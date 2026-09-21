import {HOME,WEB_MATCHES,isTaskPup,hostname,cleanSnapshot,cleanSettings,displayState} from './model.mjs';
const SCRIPT='taskpup-companion';
let queue=Promise.resolve();
const serial=work=>{const result=queue.then(work);queue=result.catch(()=>{});return result;};
const ready=chrome.storage.local.setAccessLevel({accessLevel:'TRUSTED_CONTEXTS'});
async function data(){await ready;return chrome.storage.local.get(['settings','snapshot','updatedAt','acceptSync']);}
async function broadcast(){const stored=await data();for(const tab of await chrome.tabs.query({})){if(!tab.id)continue;chrome.tabs.sendMessage(tab.id,{type:'STATE',state:displayState(stored,hostname(tab.url))}).catch(()=>{});}}
async function register(){
 const allowed=await chrome.permissions.contains({origins:WEB_MATCHES});
 const existing=(await chrome.scripting.getRegisteredContentScripts()).some(s=>s.id===SCRIPT);
 if(allowed&&!existing)await chrome.scripting.registerContentScripts([{id:SCRIPT,matches:WEB_MATCHES,js:['content.js'],runAt:'document_idle',allFrames:false,persistAcrossSessions:true}]);
 if(!allowed&&existing)await chrome.scripting.unregisterContentScripts({ids:[SCRIPT]});
 return allowed;
}
async function openHome(){
 const tabs=await chrome.tabs.query({url:['https://taskpup.lol/*','https://www.taskpup.lol/*']});
 // Only reuse the planner, not a legal/settings page on the same origin.
 const tab=tabs.find(t=>{if(!isTaskPup(t.url))return false;const path=new URL(t.url).pathname;return path==='/'||path==='/dog/';});
 if(tab){await chrome.tabs.update(tab.id,{active:true});await chrome.windows.update(tab.windowId,{focused:true});}
 else await chrome.tabs.create({url:HOME});
}
export async function handle(message,sender){
 if(sender.id!==chrome.runtime.id)throw new Error('Untrusted sender');
 const popup=sender.url===chrome.runtime.getURL('popup.html');
 if(!message||typeof message.type!=='string')throw new Error('Invalid message');
 if(message.type==='SYNC'){
  if(sender.frameId!==0||!sender.tab||!isTaskPup(sender.url))throw new Error('Only Task Pup can sync a companion');
  const snapshot=cleanSnapshot(message.snapshot);if((await data()).acceptSync===false)return {ok:true};await chrome.storage.local.set({snapshot,updatedAt:Date.now()});await broadcast();return {ok:true};
 }
 if(message.type==='GET'){const stored=await data();return {...displayState(stored,hostname(sender.url)),allowed:await chrome.permissions.contains({origins:WEB_MATCHES})};}
 if(message.type==='OPEN'){await openHome();return {ok:true};}
 if(message.type==='MUTE'){
  const host=hostname(sender.url);if(!sender.tab||sender.frameId!==0||!host)throw new Error('No website to hide');
  const stored=await data(),settings=cleanSettings(stored.settings);settings.mutedHosts=[...new Set([...settings.mutedHosts,host])].slice(-200);await chrome.storage.local.set({settings});await broadcast();return {ok:true};
 }
 if(!popup)throw new Error('This control belongs to the extension popup');
 if(message.type==='CONNECT'){await chrome.storage.local.set({acceptSync:true});await openHome();for(const tab of await chrome.tabs.query({url:['https://taskpup.lol/*','https://www.taskpup.lol/*']}))if(tab.id)chrome.tabs.sendMessage(tab.id,{type:'REQUEST_SYNC'}).catch(()=>{});return {ok:true};}
 if(message.type==='SETTINGS'){
  const current=(await data()).settings;const patch=message.patch||{};
  const settings=cleanSettings({...current,...patch});await chrome.storage.local.set({settings});await broadcast();return {ok:true};
 }
 if(message.type==='ENABLE_SITES'){
  const allowed=await register();if(!allowed)throw new Error('Website permission was not granted');
  for(const tab of await chrome.tabs.query({url:WEB_MATCHES})){if(!tab.id)continue;chrome.scripting.executeScript({target:{tabId:tab.id},files:['content.js']}).catch(()=>{});}
  await broadcast();return {ok:true};
 }
 if(message.type==='DISCONNECT'){await chrome.storage.local.set({acceptSync:false});await chrome.storage.local.remove(['snapshot','updatedAt']);await broadcast();return {ok:true};}
 throw new Error('Unknown control');
}
chrome.runtime.onMessage.addListener((message,sender,respond)=>{serial(async()=>{await ready;return handle(message,sender);}).then(respond,error=>respond({error:error.message}));return true;});
chrome.permissions.onAdded.addListener(()=>serial(register).catch(()=>{}));
chrome.permissions.onRemoved.addListener(()=>serial(async()=>{const allowed=await register();if(!allowed){for(const tab of await chrome.tabs.query({}))if(tab.id)chrome.tabs.sendMessage(tab.id,{type:'REMOVE'}).catch(()=>{});}}).catch(()=>{}));
chrome.runtime.onInstalled.addListener(()=>serial(register).catch(()=>{}));
chrome.runtime.onStartup.addListener(()=>serial(register).catch(()=>{}));
