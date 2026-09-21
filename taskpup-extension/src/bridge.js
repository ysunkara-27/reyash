// Runs only on Task Pup in an isolated world. No auth or localStorage access.
(() => {
 if(window.top!==window)return;
 let last='',lastSent=0,stopped=false;
 function send(event){
  if(stopped||typeof event.detail!=='string'||event.detail.length>1024)return;
  let snapshot;try{snapshot=JSON.parse(event.detail);}catch{return;}
  const now=Date.now();if(event.detail===last&&now-lastSent<45000)return;
  last=event.detail;lastSent=now;
  chrome.runtime.sendMessage({type:'SYNC',snapshot}).catch(()=>{stopped=true;clearInterval(timer);document.removeEventListener('taskpup:companion-state',send);});
 }
 function request(){if(!stopped)document.dispatchEvent(new Event('taskpup:companion-request'));}
 document.addEventListener('taskpup:companion-state',send);
 document.addEventListener('visibilitychange',request);
 chrome.runtime.onMessage.addListener(message=>{if(message.type==='REQUEST_SYNC'){last='';request();}});
 const timer=setInterval(request,60000);
 request();
})();
