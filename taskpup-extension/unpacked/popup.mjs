import {WEB_MATCHES} from './model.mjs';
const $=id=>document.getElementById(id);let state;
async function send(message){const result=await chrome.runtime.sendMessage(message);if(result?.error)throw new Error(result.error);return result;}
async function refresh(){
 state=await send({type:'GET'});const {settings,snapshot}=state;
 $('status').textContent=snapshot?.connected?`${snapshot.pet.name} is with you. ${Date.now()-state.updatedAt>120000?'Open Task Pup for a fresh update.':'Synced from Task Pup.'}`:'Open Task Pup and sign in to bring your companion along.';
 $('allow').hidden=state.allowed;$('permission-note').hidden=state.allowed;
 for(const key of ['size','corner','motion'])$(key).value=settings[key];$('enabled').checked=settings.enabled;
 $('snooze').textContent=settings.snoozeUntil>Date.now()?'Wake up now':'Snooze for 1 hour';
 $('muted').replaceChildren();for(const host of settings.mutedHosts){const li=document.createElement('li'),name=document.createElement('span'),button=document.createElement('button');name.textContent=host;button.textContent='Show again';button.onclick=()=>change({mutedHosts:state.settings.mutedHosts.filter(h=>h!==host)});li.append(name,button);$('muted').append(li);}
}
async function action(work){try{await work();await refresh();}catch(error){$('status').textContent=error.message||'Could not update your companion. Try reopening this popup.';}}
async function change(patch){await action(()=>send({type:'SETTINGS',patch}));}
$('connect').onclick=()=>action(()=>send({type:'CONNECT'}));
$('allow').onclick=async()=>{
 // Request directly from the click handler; Chrome requires a user gesture.
 try{const granted=await chrome.permissions.request({origins:WEB_MATCHES});if(!granted){$('status').textContent='Website access was not enabled. You can try again whenever you like.';return;}await action(()=>send({type:'ENABLE_SITES'}));}catch(error){$('status').textContent=error.message;}
};
$('enabled').onchange=()=>change({enabled:$('enabled').checked});
for(const key of ['size','corner','motion'])$(key).onchange=()=>change({[key]:key==='size'?Number($(key).value):$(key).value});
$('snooze').onclick=()=>change({snoozeUntil:state.settings.snoozeUntil>Date.now()?0:Date.now()+3600000});
$('forget').onclick=()=>action(()=>send({type:'DISCONNECT'}));
refresh().catch(error=>$('status').textContent=error.message);
