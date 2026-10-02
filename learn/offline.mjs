const button=document.querySelector('#offline-open');
const panel=document.querySelector('#offline-panel');
const status=document.querySelector('#offline-status');
const prepare=document.querySelector('#offline-prepare');
const verify=document.querySelector('#offline-verify');
let registration,working=false;
function report(text){status.textContent=text;}
async function connect(){
 if(!('serviceWorker' in navigator)||!('caches' in window))throw Error('Offline saving is not supported in this browser. Use a recent Chrome, Edge, Firefox, or Safari browser.');
 registration=await navigator.serviceWorker.register('/learn/sw.js',{scope:'/learn',updateViaCache:'none'});
 await navigator.serviceWorker.ready;
 if(!navigator.serviceWorker.controller)await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Reload once, then open Offline access again.')),15000);navigator.serviceWorker.addEventListener('controllerchange',()=>{clearTimeout(timer);resolve()},{once:true});});
 return registration;
}
function message(type,onProgress=()=>{}){
 return new Promise((resolve,reject)=>{
  const channel=new MessageChannel();
  const timer=setTimeout(()=>{channel.port1.close();reject(Error('The download timed out. Reconnect and retry; completed files are kept.'));},600000);
  channel.port1.onmessage=({data})=>{if(!data.done){onProgress(data);return}clearTimeout(timer);channel.port1.close();data.error?reject(Error(data.error)):resolve(data);};
  navigator.serviceWorker.controller.postMessage({type},[channel.port2]);
 });
}
async function showStatus(){try{await connect();const s=await message('STATUS');button.textContent=s.ready?'Offline ready':'Offline access';report(s.ready?`Saved on this browser: all lessons and Python libraries (${Math.round(s.bytes/1048576)} MB). You can disconnect and reopen this page. Use “Test saved Python” to check execution.`:'Lessons save automatically. Download Python below to make coding, grading, plots, and mocks work without internet.');verify.disabled=!s.ready;}catch(e){report(e.message);}}
button.onclick=()=>{panel.showModal();if(!working)showStatus();};
document.querySelector('#offline-close').onclick=()=>panel.close();
prepare.onclick=async()=>{
 if(working)return;working=true;prepare.disabled=true;verify.disabled=true;
 try{
  await connect();
  if(!navigator.onLine){const saved=await message('STATUS');if(!saved.ready)throw Error('Reconnect to download the missing Python files.');}
  // Request durable storage when available; declining does not block offline use.
  try{await navigator.storage?.persist?.();}catch{}
  report('Preparing the complete offline download. Keep this page open…');
  const s=await message('PREPARE',p=>report(p.status));
  button.textContent='Offline ready';verify.disabled=false;
  report(`Offline ready · ${Math.round(s.bytes/1048576)} MB saved. Testing the saved Python installation…`);
  await testPython();
 }catch(e){report('Not fully ready: '+e.message+' Retry while online; completed downloads will be reused.');button.textContent='Offline access';}
 finally{working=false;prepare.disabled=false;}
};
async function testPython(){
 verify.disabled=true;
 const worker=new Worker('./worker.mjs',{type:'module'});
 try{
  const result=await new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>reject(Error('Python test timed out. Retry the test.')),180000);
   worker.onerror=e=>{clearTimeout(timer);reject(Error(e.message||'Python could not start.'));};
   worker.onmessage=({data})=>{if(data.status){report('Testing saved Python: '+data.status);return}if(data.done){clearTimeout(timer);resolve(data);}};
   worker.postMessage({setup:'import numpy as np\nimport pandas as pd\nimport sqlite3\nfrom sklearn.linear_model import LogisticRegression\nimport matplotlib.pyplot as plt',code:`con=sqlite3.connect(':memory:')
pd.DataFrame({'x':[1,2,3]}).to_sql('t',con,index=False)
assert pd.read_sql_query('SELECT SUM(x) AS total FROM t',con).iloc[0,0]==6
model=LogisticRegression().fit([[0],[1],[9],[10]],[0,0,1,1])
assert model.predict([[10]])[0]==1
fig,ax=plt.subplots()
ax.plot([1,2],[3,4])`,checks:['assert True']});
  });
  if(result.error||!result.checks?.every(Boolean))throw Error(result.error||'Python test failed.');
  report('Offline ready. Python, pandas, SQL, scikit-learn, and plotting passed. Disconnect, then reopen this same bookmarked page in this browser.');
 }finally{worker.terminate();verify.disabled=false;}
}
verify.onclick=async()=>{if(working)return;working=true;try{report('Testing saved Python…');await testPython();}catch(e){report('Python test failed: '+e.message);}finally{working=false;}};
// Register without downloading the large Python bundle until explicitly requested.
connect().then(()=>message('STATUS')).then(s=>{button.textContent=s.ready?'Offline ready':'Offline access';}).catch(()=>{});
window.addEventListener('offline',()=>{if(!working&&panel.open)showStatus();});
