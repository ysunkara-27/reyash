// Built inside a private IIFE alongside the bundled Task Pup SVG renderer.
if(window.top!==window||globalThis.__taskpupCompanion)return;
globalThis.__taskpupCompanion=true;
// The planner already has the real pet and all its care controls.
if(document.getElementById('pet-wanderer'))return;
let state=null,menuOpen=false,localCorner=null,drag=null,dragged=false,wakeTimer,poseTimer,lastActivity=Date.now(),lastStroll=0,disposed=false;
const host=document.createElement('taskpup-companion');
host.style.cssText='all:initial!important;position:fixed!important;bottom:16px!important;right:16px!important;left:auto!important;width:52px!important;height:58px!important;z-index:2147483646!important;display:none!important;pointer-events:none!important;contain:layout style!important;';
const shadow=host.attachShadow({mode:'closed'});
const sheet=new CSSStyleSheet();sheet.replaceSync(COMPANION_CSS);shadow.adoptedStyleSheets=[sheet];
const petButton=document.createElement('button');petButton.className='pet';petButton.type='button';petButton.setAttribute('aria-label','Task Pup companion');petButton.setAttribute('aria-expanded','false');
const menu=document.createElement('div');menu.className='menu';menu.hidden=true;menu.setAttribute('role','group');menu.setAttribute('aria-label','Companion controls');
const title=document.createElement('strong'),hint=document.createElement('p');menu.append(title,hint);
for(const [label,action] of [['Care in Task Pup','open'],['Move to other corner','move'],['Hide on this website','mute'],['Close','close']]){const button=document.createElement('button');button.type='button';button.textContent=label;button.dataset.action=action;menu.append(button);}
shadow.append(petButton,menu);document.documentElement.append(host);
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const editing=()=>{const el=document.activeElement;return !!el&&(el.matches('input,textarea,select,[contenteditable=""],[contenteditable="true"],[role="textbox"]')||el.isContentEditable);};
async function send(message){try{const result=await chrome.runtime.sendMessage(message);if(result?.error)throw new Error(result.error);return result;}catch{dispose();return null;}}
function setMenu(open){menuOpen=open;menu.hidden=!open;petButton.setAttribute('aria-expanded',String(open));if(open)menu.querySelector('button').focus();render();}
function render(){
 if(disposed||!state)return;
 clearTimeout(wakeTimer);
 const {snapshot,settings}=state,now=Date.now();
 const show=!!snapshot?.connected&&settings.enabled&&settings.snoozeUntil<=now&&!settings.mutedHosts.includes(location.hostname)&&!document.hidden&&!document.fullscreenElement;
 host.style.setProperty('display',show?'block':'none','important');
 if(settings.snoozeUntil>now)wakeTimer=setTimeout(render,Math.min(2147483647,settings.snoozeUntil-now+50));
 if(!show){petButton.getAnimations().forEach(animation=>animation.cancel());menuOpen=false;menu.hidden=true;petButton.setAttribute('aria-expanded','false');return;}
 const corner=localCorner||settings.corner;
 host.style.setProperty('width',settings.size+'px','important');host.style.setProperty('height',(settings.size+6)+'px','important');
 host.style.setProperty('left',corner==='left'?'16px':'auto','important');host.style.setProperty('right',corner==='right'?'16px':'auto','important');
 menu.dataset.corner=corner;
 const key=JSON.stringify(snapshot.pet);if(petButton.dataset.profile!==key){petButton.innerHTML=puppySVG(snapshot.pet);petButton.dataset.profile=key;}
 petButton.setAttribute('aria-label',`${snapshot.pet.name}, your Task Pup companion. Open controls.`);
 const focused=!!snapshot.focused&&now-state.updatedAt<120000;
 petButton.dataset.rest=String(focused||editing()||snapshot.care.used===7);
 petButton.dataset.motion=settings.motion==='gentle'&&!reduced.matches&&snapshot.pet.roaming&&!focused&&!editing()&&!menuOpen?'gentle':'still';
 if(petButton.dataset.motion==='still')petButton.getAnimations().forEach(animation=>animation.cancel());
 title.textContent=snapshot.pet.name;
 hint.textContent=focused?'Resting while you focus.':snapshot.care.used===7?'Fed, exercised, and cozy.':now-state.updatedAt>120000?'Showing your last synced companion. Open Task Pup to refresh.':'A little company. Meals and play live in Task Pup.';
}
function receive(next){if(state?.settings.corner!==next.settings.corner)localCorner=null;state=next;render();}
petButton.addEventListener('click',event=>{event.stopPropagation();if(dragged){dragged=false;return;}setMenu(!menuOpen);});
petButton.addEventListener('pointerenter',()=>petButton.getAnimations().forEach(animation=>animation.cancel()));
petButton.addEventListener('pointerdown',event=>{if(event.button!==0)return;petButton.getAnimations().forEach(animation=>animation.cancel());drag={x:event.clientX,y:event.clientY};dragged=false;petButton.setPointerCapture(event.pointerId);});
petButton.addEventListener('pointermove',event=>{if(!drag)return;if(Math.hypot(event.clientX-drag.x,event.clientY-drag.y)>8){dragged=true;host.style.setProperty('left',Math.max(8,Math.min(innerWidth-state.settings.size-8,event.clientX-state.settings.size/2))+'px','important');host.style.setProperty('right','auto','important');}});
function drop(event){if(!drag)return;drag=null;if(dragged){localCorner=event.clientX<innerWidth/2?'left':'right';render();}}
petButton.addEventListener('pointerup',drop);petButton.addEventListener('pointercancel',()=>{drag=null;render();});
menu.addEventListener('click',async event=>{
 const action=event.target.closest('button')?.dataset.action;if(!action)return;
 if(action==='open')await send({type:'OPEN'});
 if(action==='mute')await send({type:'MUTE'});
 if(action==='move')localCorner=(localCorner||state.settings.corner)==='left'?'right':'left';
 setMenu(false);if(action==='close')petButton.focus();
});
function keyboard(event){if(event.key==='Escape'&&menuOpen){setMenu(false);petButton.focus();}}
function outside(event){if(menuOpen&&!event.composedPath().includes(host))setMenu(false);}
function activity(){lastActivity=Date.now();render();}
function onState(message){if(message.type==='STATE')receive(message.state);if(message.type==='REMOVE')dispose();}
function dispose(){
 if(disposed)return;disposed=true;clearTimeout(wakeTimer);clearInterval(poseTimer);host.remove();
 chrome.runtime.onMessage.removeListener(onState);
 document.removeEventListener('visibilitychange',activity);document.removeEventListener('fullscreenchange',activity);document.removeEventListener('focusin',activity);document.removeEventListener('focusout',activity);document.removeEventListener('keydown',keyboard);document.removeEventListener('pointerdown',outside);reduced.removeEventListener('change',render);globalThis.__taskpupCompanion=false;
}
chrome.runtime.onMessage.addListener(onState);
document.addEventListener('visibilitychange',activity);document.addEventListener('fullscreenchange',activity);document.addEventListener('focusin',activity);document.addEventListener('focusout',activity);document.addEventListener('keydown',keyboard);document.addEventListener('pointerdown',outside,{passive:true});reduced.addEventListener('change',render);
// No animation-frame loop, whole-page observer, scrolling handler, or page scan.
// A short edge stroll is opt-in and only happens after two quiet minutes.
poseTimer=setInterval(()=>{render();if(!document.hidden&&!menuOpen&&!editing()&&Date.now()-lastActivity>120000&&Date.now()-lastStroll>120000&&petButton.dataset.motion==='gentle'){lastStroll=Date.now();const distance=(localCorner||state.settings.corner)==='right'?-24:24;petButton.animate([{transform:'translateX(0)'},{transform:`translateX(${distance}px)`,offset:.5},{transform:'translateX(0)'}],{duration:6000,easing:'ease-in-out'});}},60000);
send({type:'GET'}).then(initial=>{if(initial?.allowed)receive(initial);});
