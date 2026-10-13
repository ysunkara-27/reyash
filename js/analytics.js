(function(){
  if(location.hostname==='localhost'||location.hostname==='127.0.0.1')return;
  var API='https://hooraas-rides-api.sunkarayashaswi.workers.dev',key='ys-analytics-id',visitor;
  try{visitor=localStorage.getItem(key);if(!/^[a-zA-Z0-9_-]{8,160}$/.test(visitor||'')){visitor=crypto.randomUUID();localStorage.setItem(key,visitor);}}catch{visitor=crypto.randomUUID();}
  window.siteAnalyticsId=visitor;
  var first=location.pathname.split('/').filter(Boolean)[0]||'',site=location.hostname.includes('taskpup')?'taskpup':({dog:'taskpup',amma:'amma',atlas:'atlas',rides:'rides',bidpoints:'bidpoints',apgovelections:'apgovelections',kwatnoskiapgov:'apgovelections',pujarinet:'pujarinet',writings:'writings',savetheworld:'savetheworld',officehours:'officehours',blindspot:'blindspot'}[first]||'home');
  var body=JSON.stringify({site:site,path:location.pathname,visitor:visitor});
  if(navigator.sendBeacon){navigator.sendBeacon(API+'/analytics/event',new Blob([body],{type:'text/plain'}));}
  else fetch(API+'/analytics/event',{method:'POST',body:body,keepalive:true}).catch(function(){});
  // Article pages also report active reading time and scroll depth, flushed every 15s and when the tab is hidden.
  if(site!=='writings'||!/^\/writings\/[a-z0-9-]+\/?$/.test(location.pathname))return;
  var session=crypto.randomUUID(),active=0,depth=0,lastTick=Date.now(),lastInput=Date.now(),referrer='';
  try{referrer=document.referrer?new URL(document.referrer).origin:'';}catch{}
  function measure(){var height=document.documentElement.scrollHeight-innerHeight;depth=Math.max(depth,height>0?Math.round(Math.min(1,scrollY/height)*100):100);}
  function tick(){var now=Date.now();if(document.visibilityState==='visible'&&now-lastInput<120000)active+=Math.min(now-lastTick,15000);lastTick=now;}
  function flush(){tick();measure();var seconds=Math.round(active/1000);active-=seconds*1000;
    var data=JSON.stringify({site:site,path:location.pathname,visitor:visitor,session:session,title:document.title,seconds:seconds,depth:depth,referrer:referrer});
    if(navigator.sendBeacon)navigator.sendBeacon(API+'/analytics/read',new Blob([data],{type:'text/plain'}));
    else fetch(API+'/analytics/read',{method:'POST',body:data,keepalive:true}).catch(function(){});}
  ['scroll','pointerdown','pointermove','keydown','touchstart','wheel'].forEach(function(name){addEventListener(name,function(){lastInput=Date.now();},{passive:true});});
  addEventListener('scroll',measure,{passive:true});
  document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden')flush();else{lastTick=Date.now();lastInput=Date.now();}});
  addEventListener('pagehide',flush);
  flush();
  setInterval(function(){if(document.visibilityState==='visible')flush();},15000);
})();
