const API='https://hooraas-rides-api.sunkarayashaswi.workers.dev';
const $=id=>document.getElementById(id);
const form=$('feedback-form'),errorBox=$('form-error'),send=$('send');
const RATINGS=['ease','teaching','accuracy','recommend'];

for(const key of RATINGS){
 const input=$(key),output=$(key+'-value');
 const sync=()=>{output.value=input.value;input.style.setProperty('--fill',`${(input.value-1)/4*100}%`);};
 input.addEventListener('input',sync);sync();
}
$('missing').addEventListener('input',event=>{$('missing-count').textContent=`${event.target.value.length} / 600`;});

const picked=name=>form.querySelector(`input[name="${name}"]:checked`)?.value;
function collect(){
 const role=picked('role');
 if(!role)return {error:'Choose a role first.',focus:'role'};
 const real_product=picked('real_product');
 if(!real_product)return {error:'Say whether this could become a real tool.',focus:'real_product'};
 const body={role,years:picked('years')||'',real_product,missing:$('missing').value.trim().slice(0,600),contact:$('contact').value.trim().slice(0,200)};
 for(const key of RATINGS)body[key]=Number($(key).value);
 return {body};
}

form.addEventListener('submit',async event=>{
 event.preventDefault();
 errorBox.textContent='';
 const {body,error,focus}=collect();
 if(error){errorBox.textContent=error;form.querySelector(`input[name="${focus}"]`)?.focus();return;}
 send.disabled=true;send.textContent='Sending…';
 try{
  const response=await fetch(API+'/feedback/submit',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
  let data={};try{data=await response.json();}catch{}
  if(!response.ok)throw new Error(data.error||'Could not send feedback. Please try again.');
  form.hidden=true;$('done').hidden=false;$('done').scrollIntoView({block:'start'});
 }catch(err){
  errorBox.textContent=err.message==='Failed to fetch'?'No connection. Check your network and try again.':err.message;
 }finally{send.disabled=false;send.textContent='Send feedback';}
});
