import {mountFeatureLog} from './feature-log.mjs';
import {plan,participants,destinations,today,pinned,recommendCars,applyCarPreset,removePerson} from './model.mjs';
import {mountGame} from './game-endless.mjs';
const API=location.hostname==='localhost'||location.hostname==='127.0.0.1'?(location.port==='8094'?'http://127.0.0.1:8790':'http://127.0.0.1:8787'):'https://hooraas-rides-api.sunkarayashaswi.workers.dev';
mountFeatureLog({site:'rides',api:API,host:document.querySelector('footer')});
const $=id=>document.getElementById(id),esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let data,revision,admin=null,selected=new URLSearchParams(location.search).get('event'),token=localStorage.getItem('rides-admin-token')||localStorage.getItem('hooraas-token')||'',busy=false,map,marker;
function notice(message){$('notice').textContent=message;$('notice').classList.add('show');setTimeout(()=>$('notice').classList.remove('show'),5000)}
async function api(path,body){const response=await fetch(API+'/v2/'+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(body?{body:JSON.stringify(body)}:{})});const result=await response.json();if(!response.ok)throw new Error(result.error||'Could not load rides');return result}
function receive(result){data=result.data;revision=result.revision;admin=result.admin;const sorted=[...data.events].sort((a,b)=>a.date.localeCompare(b.date));if(!data.events.some(e=>e.id===selected))selected=(sorted.find(e=>e.date>=today())||sorted.at(-1))?.id;render()}
async function load(){try{receive(await api('state'))}catch(error){if(!data)$('app').innerHTML='<p class="error">Could not load rides. Please refresh to try again.</p>';notice(error.message)}}
async function save(next,verifyId){if(busy)throw new Error('Please wait for the current save.');busy=true;document.querySelectorAll('button').forEach(b=>b.disabled=true);try{const response=await fetch(API+'/v2/state',{method:'PUT',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({data:next,revision,verifyId})});const result=await response.json();if(!response.ok)throw new Error(result.error);receive(result);notice(verifyId?'Verified. Everyone can see the checked plan.':'Draft saved. Verify & post when ready.');return true}finally{busy=false;document.querySelectorAll('button').forEach(b=>b.disabled=false)}}
const event=()=>data.events.find(e=>e.id===selected);
const option=(id,label,value)=>`<option value="${esc(id)}" ${id===value?'selected':''}>${esc(label)}</option>`;
const placeOptions=(value,blank='Choose pickup')=>option('',blank,value)+data.locations.map(l=>option(l.id,l.name,value)).join('');
function destination(e){return data.locations.find(l=>l.id===e.destinationId)||destinations[e.location]}
function routeLink(car,e){const end=destination(e);const point=l=>pinned(l)?l.lat+','+l.lng:l.name+', Charlottesville VA';const stops=car.stops.filter(s=>s.location.id!==car.driver.locationId);const chunks=[];let origin=point(car.driver.point||{name:car.driver.name+' pickup'});for(let i=0;i<stops.length||i===0;i+=3){const part=stops.slice(i,i+3);const final=i+3>=stops.length;const dest=final?(end.address||point(end)):point(part.at(-1).location);const via=final?part:part.slice(0,-1);const q=new URLSearchParams({api:'1',origin,destination:dest,travelmode:'driving'});if(via.length)q.set('waypoints',via.map(s=>point(s.location)).join('|'));chunks.push(`<a target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?${esc(q)}">${chunks.length||!final?'Route part '+(chunks.length+1):'Directions'} ↗</a>`);origin=dest}return chunks.join(' · ')}
function render(){
 const adminOpen=document.getElementById('adminPanel')?.open;
 document.getElementById('adminContent')?.replaceChildren();
 document.getElementById('locationsContent')?.replaceChildren();
 $('access').textContent=admin?'Sign out · '+admin:'Admin access';if(!data)return;
 const e=event();if(!e){$('app').innerHTML='<p>No events scheduled.</p>';return}const result=admin?plan(data,e):(e.publicPlan||{cars:[],pending:[],excluded:[],warnings:[]});const end=destination(e);
 const dates=[...data.events].sort((a,b)=>a.date.localeCompare(b.date));
 const heading=new Date(e.date+'T12:00:00').toLocaleDateString('en-US',{weekday:'long',month:'short',day:'numeric'});
 $('app').innerHTML=`<div class="toolbar"><select id="eventPicker" aria-label="Choose event">${dates.map(x=>option(x.id,x.date+' · '+x.title+' · '+(data.locations.find(l=>l.id===x.destinationId)?.name||destinations[x.location].name),selected)).join('')}</select><button id="copy">Copy rides</button></div><h1>${esc(heading)}</h1><p>${esc(e.title)} · ${esc(end.name)} · ${esc(e.time)}</p><span class="badge ${e.verified?'verified':''}">${e.verified?'Verified by '+esc(e.verified.by):'Admin draft · not posted'}</span>${e.note?'<p>'+esc(e.note)+'</p>':''}
 ${result.pending.length?'<div class="warning"><strong>Still needs a ride</strong>'+result.pending.map(x=>'<div>'+esc(x.person.name)+' — '+esc(x.reason)+'</div>').join('')+'</div>':''}
 ${result.cars.map(c=>`<section class="car"><div class="carhead"><h2>${esc(c.driver.name)} drives</h2><small>${c.people.length} / ${c.driver.capacity} passengers</small></div><ol><li><strong>${esc(c.driver.point?.name||'Driver pickup missing')}</strong><span>${esc(c.driver.name)}${c.stops.filter(s=>s.location.id===c.driver.locationId).flatMap(s=>s.people).map(p=>', '+esc(p.name)).join('')}</span></li>${c.stops.filter(s=>s.location.id!==c.driver.locationId).map(s=>`<li><strong>${esc(s.location.name)}</strong><span>${s.people.map(p=>esc(p.name)).join(', ')}</span></li>`).join('')}<li>${esc(end.name)}</li></ol>${c.driver.point?routeLink(c,e):''}</section>`).join('')||'<p>No drivers available for this event.</p>'}
 <p class="muted">${result.excluded.length?'No ride: '+result.excluded.map(p=>esc(p.name)).join(', ')+'. ':''}Changes? Message an admin.</p>
 ${admin?`<section><div class="toolbar"><h2>Admin</h2><button id="verify" class="primary">Verify rides</button></div><p class="muted">Edits stay private until verified again. Other car assignments stay fixed.</p>${result.warnings.length?'<details><summary>'+result.warnings.length+' pickup pins need checking</summary>'+result.warnings.map(w=>'<div>'+esc(w)+'</div>').join('')+'</details>':''}<div class="toolbar"><button id="editEvent">Edit event</button><button id="newEvent">New event</button><button id="addPerson">Add person</button></div><h3>Attendance for this event</h3>${participants(data,e).map(p=>`<div class="adminrow"><div><strong>${esc(p.name)}</strong><small>${esc(p.point?.name||'Pickup needed')}</small></div><select aria-label="Ride status for ${esc(p.name)}" data-status="${p.id}">${option('no','No ride',!p.needsRide?'no':p.driver?'drive':'ride')+option('ride','Needs ride',!p.needsRide?'no':p.driver?'drive':'ride')+option('drive','Driving',!p.needsRide?'no':p.driver?'drive':'ride')}</select><select class="assignment" aria-label="Car for ${esc(p.name)}" data-car="${p.id}" ${!p.needsRide||p.driver?'disabled':''}>${option('','Unassigned',e.overrides[p.id]?.carId||'')+result.cars.map(c=>option(c.driver.id,c.driver.name,e.overrides[p.id]?.carId)).join('')}</select><button data-person="${p.id}">Edit</button></div>`).join('')}<details><summary>Roster defaults & inactive people</summary>${data.roster.map(p=>`<div class="pinrow"><span>${esc(p.name)}${p.active?'':' (inactive)'}</span><button data-person="${p.id}">Edit</button></div>`).join('')}</details><details><summary>Saved pickup pins</summary><p>Set each pickup once. Pins suggest shorter routes using geographic distance; check driving directions for road access.</p>${data.locations.map(l=>`<div class="pinrow"><span>${esc(l.name)}${pinned(l)?'':' · pin needed'}</span><button data-location="${l.id}">Set pin</button></div>`).join('')}<button id="addLocation">Add location</button></details></section>`:''}`;
 compactView(result,e,adminOpen);
 const badge=$('app').querySelector('.badge');badge.textContent=e.verified?'✓ Verified by admin · '+e.verified.by:'Admin draft · not posted';
 if(admin){$('verify').textContent='Verify & post rides';const help=$('adminContent').querySelector('p.muted');if(help)help.textContent='Edits stay private until verified again. Manual edits keep other riders in their cars.'}
 if(!admin&&!e.verified){$('app').querySelectorAll('.cars,.car-count,.warning,p.muted').forEach(el=>el.remove());badge.remove();const empty=document.createElement('section');empty.className='not-posted';empty.innerHTML='<h2>Rides aren’t posted yet</h2><p>An admin is checking the plan. Check out the game or today’s raas set in the meantime.</p>';$('app').append(empty);$('copy').hidden=true;}
 mountGame($('app'),API);
 const featured=data.featuredSet||{url:'https://www.youtube.com/watch?v=-u7ThyX0Pus',updated:'2026-09-15'};
 const watch=document.createElement('footer');watch.className='raas-watch';watch.innerHTML=`<a href="${esc(featured.url)}" target="_blank" rel="noopener noreferrer">Watch this raas set today ↗</a><small>Updated ${Number(featured.updated.slice(5,7))}/${Number(featured.updated.slice(8,10))}</small>${admin==='Yashaswi'?'<button id="editFeaturedSet">Edit featured set</button>':''}`;$('app').append(watch);
 if($('editFeaturedSet'))$('editFeaturedSet').onclick=()=>{$('routeContent').innerHTML=`<h2>Edit featured raas set</h2><form id="featuredForm"><label>YouTube link<input name="url" type="url" required maxlength="1000" value="${esc(featured.url)}"></label><label>Updated date<input name="updated" type="date" required value="${today()}"></label><button class="primary">Save featured set</button></form>`;$('featuredForm').onsubmit=async ev=>{ev.preventDefault();const next=structuredClone(data),fields=new FormData(ev.target);next.featuredSet={url:fields.get('url').trim(),updated:fields.get('updated')};try{await save(next);$('routePanel').close()}catch(err){notice(err.message)}};$('routePanel').showModal()};
 $('eventPicker').onchange=ev=>{selected=ev.target.value;history.replaceState(null,'','?event='+encodeURIComponent(selected));render()};
 $('copy').onclick=async()=>{const text=[heading+' · '+e.title+' · '+end.name+' · '+e.time,e.verified?'Verified by '+e.verified.by:'UNVERIFIED',...result.cars.map(c=>c.driver.name+': '+c.stops.map(s=>s.location.name+' ('+s.people.map(p=>p.name).join(', ')+')').join(' → ')+' → '+end.name),...result.pending.map(x=>'NEEDS ASSIGNMENT: '+x.person.name+' — '+x.reason)].join('\n');try{await navigator.clipboard.writeText(text);notice('Copied rides.')}catch{notice('Copy failed. You can share this page’s URL.')}};
 if(!admin)return;
 $('verify').onclick=()=>save(structuredClone(data),selected).catch(err=>notice(err.message));
 $('addPerson').onclick=()=>editPerson();$('addLocation').onclick=()=>editLocation();$('newEvent').onclick=()=>editEvent();$('editEvent').onclick=()=>editEvent(e);
 document.querySelectorAll('[data-person]').forEach(b=>b.onclick=()=>editPerson(data.roster.find(p=>p.id===b.dataset.person)));
 document.querySelectorAll('[data-location]').forEach(b=>b.onclick=()=>editLocation(data.locations.find(l=>l.id===b.dataset.location)));
 document.querySelectorAll('[data-status],[data-car]').forEach(s=>s.onchange=async()=>{const next=structuredClone(data),ev=next.events.find(x=>x.id===selected),id=s.dataset.status||s.dataset.car;ev.overrides[id]??={};if(s.dataset.status){Object.assign(ev.overrides[id],{needsRide:s.value!=='no',driver:s.value==='drive'});delete ev.overrides[id].carId}else{ev.overrides[id].carId=s.value}try{await save(next)}catch(err){notice(err.message);render()}});
}
function compactView(result,e,adminOpen){
 const app=$('app');
 const grid=document.createElement('div');grid.className='cars';
 app.querySelectorAll('.car').forEach((card,i)=>{
   const car=result.cars[i];
   const details=card.querySelector('ol').outerHTML+Array.from(card.querySelectorAll('a')).map(a=>a.outerHTML).join(' · ');
   card.innerHTML=`<div class="carhead"><h2>${esc(car.driver.name)} <span>drives</span></h2><small>${car.people.length}/${car.driver.capacity} seats</small></div><p class="passengers">${car.people.map(p=>esc(p.name)).join(' · ')||'No passengers'}</p><button class="route-button" aria-label="Pickup route for ${esc(car.driver.name)}">Pickup route <span aria-hidden="true">↗</span></button>`;
   card.querySelector('button').onclick=()=>{ $('routeContent').innerHTML=`<h2>${esc(car.driver.name)}’s pickup route</h2>`+details; $('routePanel').showModal() };
   if(admin){
     const move=document.createElement('button');move.className='move-riders';move.textContent='Move riders';move.setAttribute('aria-label','Move riders from '+car.driver.name);move.disabled=!car.people.length;
     move.onclick=()=>{$('routeContent').innerHTML=`<h2>Move from ${esc(car.driver.name)}’s car</h2><p>Choose a rider, then choose their new driver.</p>`+car.people.map(p=>`<button class="move-person" data-move="${esc(p.id)}">${esc(p.name)} → Choose car</button>`).join('');$('routeContent').querySelectorAll('[data-move]').forEach(b=>b.onclick=()=>editRide(b.dataset.move));$('routePanel').showModal()};card.append(move);
     const names=card.querySelector('.passengers');
     names.innerHTML=car.people.map(p=>`<button class="rider-name" data-rider="${esc(p.id)}" aria-label="Change ride for ${esc(p.name)}">${esc(p.name)}</button>`).join(' · ')||'No passengers';
     names.querySelectorAll('[data-rider]').forEach(b=>b.onclick=()=>editRide(b.dataset.rider));
     const label=document.createElement('label');label.className='capacity-control';
     label.innerHTML=`Total people <select aria-label="Total car capacity for ${esc(car.driver.name)}">${[1,2,3,4,5].map(n=>option(n,String(n+1),car.driver.capacity)).join('')}</select><small>Includes driver · up to 6 total</small>`;
     const input=label.querySelector('select');
     input.onchange=async()=>{const next=structuredClone(data);next.roster.find(p=>p.id===car.driver.id).capacity=Number(input.value);input.disabled=true;try{await save(next)}catch(err){notice(err.message);render()}};
     card.append(label);
   }
   grid.append(card);
 });
 const warning=app.querySelector('.warning');
 if(warning){warning.innerHTML='<strong>Needs a ride</strong> '+result.pending.map(x=>admin?`<button class="rider-name" data-rider="${esc(x.person.id)}" aria-label="Choose ride for ${esc(x.person.name)}">${esc(x.person.name)}</button>`:esc(x.person.name)).join(' · ');warning.querySelectorAll('[data-rider]').forEach(b=>b.onclick=()=>editRide(b.dataset.rider))}
 const footer=app.querySelector('p.muted');
 if(footer){footer.classList.add('no-ride-list');footer.innerHTML='<strong>Walking / No Ride Needed</strong><span>'+ (result.excluded.length?result.excluded.map(p=>admin?`<button class="rider-name" data-no-ride="${esc(p.id)}" aria-label="Change ride for ${esc(p.name)}">${esc(p.name)}</button>`:esc(p.name)).join(' · '):'None for this event')+'</span><small>Changes? Message an admin.</small>';footer.querySelectorAll('[data-no-ride]').forEach(b=>b.onclick=()=>editRide(b.dataset.noRide));footer.before(grid)}else app.append(grid);
 const adminSection=app.querySelector(':scope > section');
 if(adminSection){
   const saved=$('addLocation').closest('details');
   saved.querySelector('summary').remove();
   const content=$('locationsContent');
   content.append($('addLocation'));
   while(saved.firstChild)content.append(saved.firstChild);
   saved.remove();
   content.querySelectorAll('[data-location]').forEach(button=>{button.textContent='Edit';button.setAttribute('aria-label','Edit location '+data.locations.find(l=>l.id===button.dataset.location).name)});
   $('adminContent').append(adminSection);
   const button=document.createElement('button');button.textContent='Edit rides';button.className='primary';button.onclick=()=>$('adminPanel').showModal();app.querySelector('.toolbar').append(button);
   const locationsButton=document.createElement('button');locationsButton.textContent='Locations';locationsButton.onclick=()=>$('locationsPanel').showModal();app.querySelector('.toolbar').append(locationsButton);
   const presetsButton=document.createElement('button');presetsButton.textContent='Car presets';presetsButton.onclick=editPresets;app.querySelector('.toolbar').append(presetsButton);
   const review=document.createElement('button');review.textContent='Review recommendations';review.onclick=reviewRecommendations;app.querySelector('.toolbar').append(review);
   const hint=document.createElement('p');hint.className='muted';hint.textContent='Tap a rider’s name to move them to another car.';grid.before(hint);
   if(adminOpen&&!$('adminPanel').open)$('adminPanel').showModal();
 }
 const cards=[...grid.children],count=cards.length;
 grid.style.setProperty('--car-columns',Math.max(1,Math.ceil(count/Math.ceil(Math.max(1,count)/5))));
 grid.classList.toggle('many-cars',count>4);
 const summary=document.createElement('p');summary.className='car-count';summary.textContent=count+' cars · all shown';grid.before(summary);
 cards.forEach((card,i)=>{const label=document.createElement('small');label.className='car-number';label.textContent='Car '+(i+1)+' of '+count;card.prepend(label)});
}
function reviewRecommendations(){
 const proposed=applyCarPreset(data,selected,{assignments:{}}).data;
 const before=plan(data,event()),after=plan(proposed,proposed.events.find(e=>e.id===selected));
 const driverFor=(result,id)=>result.cars.find(c=>c.people.some(p=>p.id===id))?.driver.name||'Unassigned';
 const changes=participants(data,event()).filter(p=>p.needsRide&&!p.driver).map(p=>({name:p.name,from:driverFor(before,p.id),to:driverFor(after,p.id)})).filter(p=>p.from!==p.to);
 const total=result=>result.cars.every(c=>c.distanceKm!==null)?result.cars.reduce((s,c)=>s+c.distanceKm,0):null;
 const a=total(before),b=total(after);
 $('routeContent').innerHTML=`<h2>Review recommendations</h2><p>This compares your current cars with automatic location-based assignments. Applying replaces manual car choices for this event only. Attendance, pickups and capacities stay unchanged.</p>${a!==null&&b!==null?`<p>Estimated geographic route distance: ${a.toFixed(1)} → ${b.toFixed(1)} km across all cars.</p>`:'<p>Confirm pickup pins to compare geographic route distance.</p>'}<p class="muted">Geographic suggestions, not road or traffic optimization. Check pickup directions before verifying.</p>${changes.length?changes.map(c=>`<div class="pinrow"><strong>${esc(c.name)}</strong><span>${esc(c.from)} → ${esc(c.to)}</span></div>`).join(''):'<p>No car changes recommended. Your current assignments match the automatic plan.</p>'}<p>${after.pending.length} unassigned · ${after.warnings.length} pickup warnings</p><div class="toolbar">${changes.length?'<button id="applyRecommendations" class="primary">Apply recommendations</button>':''}<button id="verifyCurrent">Verify current plan</button></div>`;
 if($('applyRecommendations'))$('applyRecommendations').onclick=async()=>{try{await save(proposed);reviewRecommendations()}catch(err){notice(err.message)}};
 $('verifyCurrent').onclick=async()=>{try{await save(structuredClone(data),selected);$('routePanel').close()}catch(err){notice(err.message)}};
 if(!$('routePanel').open)$('routePanel').showModal();
}
function editPresets(){
 const content=$('routeContent');
 content.innerHTML=`<h2>Car presets</h2><p>Save a lineup to reuse later. Only car assignments change; today’s attendance, pickups and capacities stay as they are. If a driver is absent or full, affected riders go back to automatic assignment.</p><form id="presetForm"><label>Save current cars as<input name="name" required maxlength="60" placeholder="e.g. Usual AFC cars"></label><button class="primary">Save preset</button></form><div id="presetList">${(data.carPresets||[]).map(p=>`<div class="pinrow"><span>${esc(p.name)}</span><button data-preset="${esc(p.id)}">Apply</button></div>`).join('')||'<p>No saved presets yet.</p>'}</div><button id="automaticCars">Reset this event to automatic cars</button>`;
 $('presetForm').onsubmit=async ev=>{ev.preventDefault();const next=structuredClone(data);next.carPresets??=[];const name=new FormData(ev.target).get('name').trim();if(next.carPresets.some(p=>p.name.toLowerCase()===name.toLowerCase())){notice('That preset name exists. Choose a different name.');return}const assignments={};for(const car of plan(data,event()).cars)for(const p of car.people)assignments[p.id]=car.driver.id;next.carPresets.push({id:crypto.randomUUID(),name,assignments});try{await save(next);editPresets();notice('Car preset saved.')}catch(err){notice(err.message)}};
 content.querySelectorAll('[data-preset]').forEach(b=>b.onclick=async()=>{const preset=data.carPresets.find(p=>p.id===b.dataset.preset),next=applyCarPreset(data,selected,preset);try{await save(next.data);$('routePanel').close();notice('Preset applied.'+(next.fallback?' '+next.fallback+' rider(s) returned to automatic assignment.':''))}catch(err){notice(err.message)}});
 $('automaticCars').onclick=async()=>{const next=structuredClone(data);const ev=next.events.find(e=>e.id===selected);ev.replan=true;ev.assignmentsLocked=false;for(const o of Object.values(ev.overrides))delete o.carId;try{await save(next);$('routePanel').close()}catch(err){notice(err.message)}};
 if(!$('routePanel').open)$('routePanel').showModal();
}
function editRide(id){
 const person=participants(data,event()).find(p=>p.id===id);
 const content=$('routeContent');
 content.innerHTML=`<h2>${esc(person.name)}</h2><form id="rideForm"><label>Pickup for this event<select name="locationId" required>${placeOptions(person.locationId)}</select></label><label>Driver<select name="carId"></select></label><p id="recommendation" class="muted"></p><div class="toolbar"><button class="primary">Save ride</button><button type="button" id="skipRide">No ride needed</button></div></form>`;
 const form=$('rideForm');
 const refresh=()=>{
   const locationId=form.elements.locationId.value;
   const rider={...person,locationId,point:data.locations.find(l=>l.id===locationId)};
   const ranked=recommendCars(data,event(),rider);
   const best=ranked.find(r=>r.available&&(r.same||r.extra!==null));
   form.elements.carId.innerHTML=option('','Choose driver',person.carId||'')+ranked.map(r=>`<option value="${esc(r.car.driver.id)}" ${r.car.driver.id===person.carId?'selected':''} ${!r.available?'disabled':''}>${esc(r.car.driver.name)}${r===best?' · Recommended':''}${!r.available?' · Full':''}</option>`).join('');
   $('recommendation').textContent=best?(best.same?'Recommended: '+best.car.driver.name+' already starts or stops at this pickup.':'Recommended: '+best.car.driver.name+' adds the least geographic distance to the current route. Not a traffic estimate.'):(rider.point?'No location-based recommendation available. Check pins and open seats.':'Choose a pickup to get a recommendation.');
 };
 refresh();form.elements.locationId.onchange=refresh;
 const current=plan(data,event()).cars.find(c=>c.people.some(p=>p.id===id));
 const currentText=document.createElement('p');currentText.textContent='Current car: '+(current?.driver.name||'Unassigned');content.querySelector('h2').after(currentText);
 const useRecommended=document.createElement('button');useRecommended.type='button';useRecommended.textContent='Choose recommended driver';useRecommended.onclick=()=>{const recommended=[...form.elements.carId.options].find(o=>o.textContent.includes('· Recommended'));if(recommended)form.elements.carId.value=recommended.value;else notice('No recommendation yet. Choose a pickup and check available seats.')};$('recommendation').after(useRecommended);
 const update=async(needsRide)=>{const next=structuredClone(data),ev=next.events.find(e=>e.id===selected);ev.overrides[id]={...ev.overrides[id],needsRide,driver:false,locationId:form.elements.locationId.value,carId:needsRide?form.elements.carId.value:''};try{await save(next);$('routePanel').close()}catch(err){notice(err.message)}};
 form.onsubmit=ev=>{ev.preventDefault();update(true)};
 $('skipRide').onclick=()=>update(false);
 $('routePanel').showModal();
}
for(const [id,title,content] of [['routePanel','Ride details','routeContent'],['adminPanel','Edit rides','adminContent'],['locationsPanel','Locations','locationsContent']]){const dialog=document.createElement('dialog');dialog.id=id;dialog.innerHTML=`<div class="heading"><strong>${title}</strong><button aria-label="Close ${title.toLowerCase()}">×</button></div><div id="${content}"></div>`;dialog.querySelector('button').onclick=()=>dialog.close();document.body.append(dialog)}
function editPerson(p){const f=$('personForm');f.reset();f.elements.id.value=p?.id||'';$('personTitle').textContent=p?'Edit '+p.name:'Add person';for(const k of ['name','capacity'])if(p)f.elements[k].value=p[k];for(const k of ['needsRide','driver','active'])if(p)f.elements[k].checked=p[k];f.querySelectorAll('[name=skip]').forEach(x=>x.checked=p?.skip.includes(x.value)||false);$('personLocations').innerHTML=placeOptions(p?.locationId||'');
 $('removePerson')?.remove();
 if(p&&admin){const remove=document.createElement('button');remove.id='removePerson';remove.type='button';remove.className='danger';remove.textContent='Remove person';remove.onclick=async()=>{
   if(!confirm('Remove '+p.name+' from the roster and all events/presets? Their car assignments will be cleared and rides recalculated. This cannot be undone. Saved locations and admin login access are not deleted. To pause rides instead, uncheck “On the active roster.”'))return;
   try{await save(removePerson(data,p.id));$('person').close();notice(p.name+' removed. Rides updated.')}catch(err){notice(err.message)}
 };f.append(remove)}
 $('person').showModal()}
function editLocation(l){const f=$('locationForm');f.reset();f.elements.id.value=l?.id||'';f.elements.name.value=l?.name||'';f.elements.lat.value=l?.lat??'';f.elements.lng.value=l?.lng??'';$('location').showModal();if(!globalThis.L){$('pinHelp').textContent='Map could not load. Enter coordinates or refresh to retry.';return}if(!map){map=L.map('pinMap').setView([38.041,-78.505],14);L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(map);map.on('click',ev=>setPin(ev.latlng.lat,ev.latlng.lng))}if(marker){map.removeLayer(marker);marker=null}map.invalidateSize();if(pinned(l)){setPin(l.lat,l.lng);map.setView([l.lat,l.lng],17)}else map.setView([38.041,-78.505],14)}
function setPin(lat,lng){const f=$('locationForm');f.elements.lat.value=lat.toFixed(6);f.elements.lng.value=lng.toFixed(6);if(!marker){marker=L.marker([lat,lng],{draggable:true}).addTo(map);marker.on('dragend',()=>{const p=marker.getLatLng();setPin(p.lat,p.lng)})}else marker.setLatLng([lat,lng])}
function editEvent(e){const f=$('eventForm');f.reset();f.elements.id.value=e?.id||'';f.elements.date.value=e?.date||today();for(const k of ['title','time','note','location'])if(e)f.elements[k].value=e[k]||'';$('eventLocations').innerHTML=placeOptions(e?.destinationId||'','Use destination above');$('event').showModal()}
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$(b.dataset.close).close());
$('access').onclick=()=>{if(admin){token='';admin=null;localStorage.removeItem('rides-admin-token');localStorage.removeItem('hooraas-token');load()}else $('login').showModal()};
$('loginForm').onsubmit=async ev=>{ev.preventDefault();try{const response=await api('login',Object.fromEntries(new FormData(ev.target)));token=response.token;localStorage.setItem('rides-admin-token',token);await load();$('login').close();ev.target.reset();$('loginError').textContent=''}catch(err){$('loginError').textContent=err.message}};
$('newLocation').onclick=()=>editLocation();
$('locationForm').onsubmit=async ev=>{ev.preventDefault();const f=new FormData(ev.target),next=structuredClone(data),id=f.get('id')||crypto.randomUUID(),l={id,name:f.get('name').trim(),lat:Number(f.get('lat')),lng:Number(f.get('lng'))};const i=next.locations.findIndex(x=>x.id===id);if(i>=0)next.locations[i]=l;else next.locations.push(l);try{await save(next);$('location').close();if($('person').open)$('personLocations').innerHTML=placeOptions(id)}catch(err){notice(err.message)}};
$('personForm').onsubmit=async ev=>{ev.preventDefault();const f=new FormData(ev.target),next=structuredClone(data),id=f.get('id')||crypto.randomUUID();const p={id,name:f.get('name').trim(),locationId:f.get('locationId'),capacity:Number(f.get('capacity')),needsRide:f.has('needsRide'),driver:f.has('driver'),active:f.has('active'),skip:f.getAll('skip')};const i=next.roster.findIndex(x=>x.id===id);if(i>=0&&f.get('pickupScope')==='event'){const current=next.events.find(e=>e.id===selected);current.overrides[id]??={};current.overrides[id].locationId=p.locationId;p.locationId=next.roster[i].locationId;}if(i>=0)next.roster[i]=p;else next.roster.push(p);try{await save(next);$('person').close()}catch(err){notice(err.message)}};
$('eventForm').onsubmit=async ev=>{ev.preventDefault();const f=new FormData(ev.target),next=structuredClone(data),id=f.get('id')||crypto.randomUUID(),old=next.events.find(e=>e.id===id);const e={...old,id,title:f.get('title').trim(),date:f.get('date'),time:f.get('time'),location:f.get('location'),destinationId:f.get('destinationId'),note:f.get('note'),overrides:old?.overrides||{},verified:null};if(old)next.events[next.events.indexOf(old)]=e;else next.events.push(e);try{await save(next);selected=id;render();$('event').close()}catch(err){notice(err.message)}};
load();setInterval(()=>{if(!admin&&!busy&&!document.querySelector('dialog[open]'))load()},60000);
