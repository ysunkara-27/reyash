import { schedule } from './schedule.mjs';
export const destinations = {
  AFC: { name: 'AFC', address: '680 Alderman Road, Charlottesville VA', lat:38.0329194,lng:-78.5135101 },
  NRGC: { name: 'North Grounds', address: '510 Massie Road, Charlottesville VA',lat:38.0510209,lng:-78.5133354 },
  SRC: { name:'Slaughter',address:'505 Edgemont Road, Charlottesville VA',lat:38.0348449,lng:-78.5178336 }
};
export function today(now=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(now)}
export function migrate(old){
 const locations=[];
 const roster=old.roster.map((p,i)=>{
   const address=p.address || ({Anjali:'Carrollton',Rahil:'Upper JPA / Stadium'}[p.name]) || '';
   let location=locations.find(x=>x.name===address);
   if(address&&!location){location={id:'loc-'+locations.length,name:address,lat:null,lng:null};locations.push(location)}
   return {id:'person-'+i,name:p.name,locationId:location?.id||'',driver:!!p.driver,capacity:5,needsRide:!['Sarim','Anjali','Rahil'].includes(p.name),skip: p.name==='Yashaswi'?['AFC']:[],active:true};
 });
 const events=structuredClone(schedule);
 const prior=events.find(e=>e.date===old.date);
 if(prior){prior.location=old.location;prior.note=old.note||'';}
 return {roster,locations,events};
}
export function participants(data,event){return data.roster.filter(p=>p.active).map(p=>{
 const o=event.overrides?.[p.id]||{};
 return {...p,needsRide:p.needsRide&&(!!event.destinationId||!p.skip.includes(event.location)),...o,point:data.locations.find(l=>l.id===(o.locationId??p.locationId))};
})}
export function pinned(l){return l&&Number.isFinite(l.lat)&&Number.isFinite(l.lng)}
export function distance(a,b){const rad=Math.PI/180;const dy=(b.lat-a.lat)*rad,dx=(b.lng-a.lng)*rad;return 6371*2*Math.asin(Math.min(1,Math.sqrt(Math.sin(dy/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(dx/2)**2)))}
function bestOrder(car,destination){
 const stops=Object.values(car.people.reduce((o,p)=>{(o[p.locationId]??={location:p.point,people:[]}).people.push(p);return o},{}));
 const start=stops.find(s=>s.location.id===car.driver.locationId);
 const rest=stops.filter(s=>s!==start);let best=rest,score=Infinity;
 function walk(left,path,cost,last){if(!left.length){cost+=distance(last,destination);if(cost<score){score=cost;best=path}return}for(const s of left)walk(left.filter(x=>x!==s),[...path,s],cost+distance(last,s.location),s.location)}
 if(pinned(destination)&&pinned(car.driver.point)&&rest.every(s=>pinned(s.location)))walk(rest,[],0,car.driver.point);
 return {stops:[...(start?[start]:[]),...best],distanceKm:Number.isFinite(score)?score:null};
}
export function plan(data,event){
 const all=participants(data,event),warnings=[],pending=[];
 const cars=all.filter(p=>p.driver&&p.needsRide).sort((a,b)=>a.name.localeCompare(b.name)).map(driver=>({driver,people:[]}));
 const riders=all.filter(p=>p.needsRide&&!p.driver).sort((a,b)=>a.name.localeCompare(b.name));
 const missing=p=>!p.point;
 for(const c of cars)if(!pinned(c.driver.point))warnings.push(c.driver.name+': set driver pickup pin');
 const assign=(p,c)=>{if(c&&c.people.length<c.driver.capacity){c.people.push(p);return true}return false};
 const remaining=[];
 for(const p of riders){
   if(missing(p)){pending.push({person:p,reason:'Choose pickup location'});continue}
   if(!pinned(p.point))warnings.push(p.name+': confirm pickup pin');
   if(event.overrides?.[p.id]?.carId){if(!assign(p,cars.find(c=>c.driver.id===p.carId)))pending.push({person:p,reason:'Selected car unavailable or full'});continue}
   if(event.assignmentsLocked){pending.push({person:p,reason:'Choose a driver'});continue}
   remaining.push(p);
 }
 // Reserve home-cluster seats first, before any distant pickup fills a car.
 const away=[];
 for(const p of remaining){const local=cars.find(c=>c.driver.locationId===p.locationId&&c.people.length<c.driver.capacity);if(!assign(p,local))away.push(p)}
 const clusters=Object.values(away.reduce((o,p)=>{(o[p.locationId]??=[]).push(p);return o},{})).sort((a,b)=>b.length-a.length||a[0].locationId.localeCompare(b[0].locationId));
 for(const group of clusters)for(const p of group){
   const available=cars.filter(c=>c.people.length<c.driver.capacity);
   if(!available.length){pending.push({person:p,reason:'No available seat'});continue}
   const destination=data.locations.find(l=>l.id===event.destinationId)||destinations[event.location];
   const score=c=>{if(c.people.some(x=>x.locationId===p.locationId))return -1;if(!pinned(c.driver.point)||!pinned(p.point)||!pinned(destination)||c.people.some(x=>!pinned(x.point)))return 10000+c.people.length;return bestOrder({...c,people:[...c.people,p]},destination).distanceKm-bestOrder(c,destination).distanceKm};
   available.sort((a,b)=>score(a)-score(b)||a.driver.name.localeCompare(b.driver.name));assign(p,available[0]);
 }
 const destination=data.locations.find(l=>l.id===event.destinationId)||destinations[event.location];
 if(!pinned(destination))warnings.push('Set the destination pin');
 for(const car of cars)Object.assign(car,bestOrder(car,destination));
 return {cars,pending,warnings:[...new Set(warnings)],excluded:all.filter(p=>!p.needsRide)};
}
export function recommendCars(data,event,person,result=plan(data,event)){
 const end=data.locations.find(l=>l.id===event.destinationId)||destinations[event.location];
 return result.cars.map(car=>{
   const people=car.people.filter(p=>p.id!==person.id),available=people.length<car.driver.capacity;
   const same=!!person.point&&(car.driver.locationId===person.locationId||people.some(p=>p.locationId===person.locationId));
   const measurable=pinned(person.point)&&pinned(car.driver.point)&&pinned(end)&&people.every(p=>pinned(p.point));
   const extra=measurable?bestOrder({...car,people:[...people,person]},end).distanceKm-bestOrder({...car,people},end).distanceKm:null;
   return {car,available,same,extra,rank:!available?Infinity:same?-1:extra??10000};
 }).sort((a,b)=>a.rank-b.rank||a.car.driver.name.localeCompare(b.car.driver.name));
}
export function applyCarPreset(data,eventId,preset){
 const next=structuredClone(data),event=next.events.find(e=>e.id===eventId);
 if(!event)throw new Error('Event not found');
 event.assignmentsLocked=false;event.replan=true;
 for(const override of Object.values(event.overrides))delete override.carId;
 const people=participants(next,event),drivers=new Map(people.filter(p=>p.needsRide&&p.driver).map(p=>[p.id,p]));
 const used=new Map();let fallback=0;
 for(const [id,driverId] of Object.entries(preset.assignments)){
   const rider=people.find(p=>p.id===id);
   if(!rider?.needsRide||rider.driver)continue;
   const driver=drivers.get(driverId),count=used.get(driverId)||0;
   if(!driver||count>=driver.capacity){fallback++;continue}
   event.overrides[id]??={};event.overrides[id].carId=driverId;used.set(driverId,count+1);
 }
 return {data:next,fallback};
}
export function stabilizeAssignments(previous,next,verifyId){
 const rosterChanged=JSON.stringify(previous.roster)!==JSON.stringify(next.roster)||JSON.stringify(previous.locations)!==JSON.stringify(next.locations);
 for(const e of next.events){const old=previous.events.find(x=>x.id===e.id);if(!old)continue;
   const changed=rosterChanged||JSON.stringify({...e,verified:null})!==JSON.stringify({...old,verified:null});
   if(!changed&&e.id!==verifyId)continue;
   if(e.replan){delete e.replan;e.assignmentsLocked=false;const result=plan(next,e);for(const c of result.cars)for(const p of c.people){e.overrides[p.id]??={};e.overrides[p.id].carId=c.driver.id}}
   else {const result=plan(previous,old);for(const c of result.cars)for(const p of c.people){if(!next.roster.some(x=>x.id===p.id)||!next.roster.some(x=>x.id===c.driver.id))continue;const prior=old.overrides[p.id]?.carId||'',requested=e.overrides[p.id]?.carId||'';if(prior===requested){e.overrides[p.id]??={};e.overrides[p.id].carId=c.driver.id}}}
   e.assignmentsLocked=true;
 }
 return next;
}
export function publicState(data){
 const destinationIds=new Set(data.events.map(e=>e.destinationId).filter(Boolean));
 return {roster:[],locations:data.locations.filter(l=>destinationIds.has(l.id)),...(data.featuredSet?{featuredSet:data.featuredSet}:{}),events:data.events.map(e=>({id:e.id,date:e.date,title:e.title,location:e.location,time:e.time,destinationId:e.destinationId||'',verified:e.verified||null,overrides:{},...(e.verified?{note:e.note||'',publicPlan:plan(data,e)}:{})}))};
}
export function removePerson(data,id){
 if(!data.roster.some(p=>p.id===id))throw new Error('Person not found. Refresh and try again.');
 const next=structuredClone(data);next.roster=next.roster.filter(p=>p.id!==id);
 for(const event of next.events){delete event.overrides[id];for(const override of Object.values(event.overrides))if(override.carId===id)delete override.carId;event.verified=null}
 for(const preset of next.carPresets||[])for(const [rider,driver] of Object.entries(preset.assignments))if(rider===id||driver===id)delete preset.assignments[rider];
 return next;
}
export function validate(data){
 const fail=message=>{throw new Error(message)};
 const str=(s,max=140)=>typeof s==='string'&&s.length<=max;
 if(!data||!Array.isArray(data.roster)||!Array.isArray(data.locations)||!Array.isArray(data.events)||data.roster.length>200||data.locations.length>1000||data.events.length>500)fail('Invalid roster or events');
 if(data.featuredSet!==undefined){const set=data.featuredSet;let url;try{url=new URL(set?.url)}catch{fail('Enter a valid YouTube link')}if(url.protocol!=='https:'||!['youtube.com','www.youtube.com','youtu.be'].includes(url.hostname)||url.username||url.password||!str(set.url,1000)||!/^\d{4}-\d{2}-\d{2}$/.test(set.updated))fail('Use an HTTPS YouTube link and a valid update date');}
 for(const list of [data.roster,data.locations,data.events])if(new Set(list.map(x=>x.id)).size!==list.length||list.some(x=>!str(x.id,80)||!x.id))fail('Duplicate or invalid IDs');
 if(data.carPresets!==undefined){
   if(!Array.isArray(data.carPresets)||data.carPresets.length>30)fail('Keep at most 30 car presets');
   if(new Set(data.carPresets.map(p=>p.id)).size!==data.carPresets.length)fail('Duplicate presets');
   for(const p of data.carPresets)if(!str(p.id,80)||!p.id||!str(p.name,60)||!p.name.trim()||!p.assignments||typeof p.assignments!=='object'||Array.isArray(p.assignments)||Object.entries(p.assignments).some(([r,d])=>r===d||!data.roster.some(p=>p.id===r)||!data.roster.some(p=>p.id===d)))fail('Invalid car preset');
 }
 for(const l of data.locations)if(!str(l.name)||!l.name.trim()||!(l.lat===null&&l.lng===null)&&(!pinned(l)||Math.abs(l.lat)>85||Math.abs(l.lng)>180))fail('Invalid pickup pin');
 if(new Set(data.roster.map(p=>String(p.name).trim().toLowerCase())).size!==data.roster.length)fail('This name is already on the roster');
 for(const p of data.roster)if(!str(p.name,80)||!p.name.trim()||typeof p.active!=='boolean'||typeof p.needsRide!=='boolean'||typeof p.driver!=='boolean'||!Number.isInteger(p.capacity)||p.capacity<1||p.capacity>5||!Array.isArray(p.skip)||p.skip.some(s=>!destinations[s])||p.locationId&&!data.locations.some(l=>l.id===p.locationId))fail('Invalid person or capacity');
 for(const e of data.events){
  if(!str(e.title,100)||!str(e.time,50)||!/^\d{4}-\d{2}-\d{2}$/.test(e.date)||!destinations[e.location]||!e.overrides||typeof e.overrides!=='object'||Array.isArray(e.overrides)||e.destinationId&&!data.locations.some(l=>l.id===e.destinationId))fail('Invalid event');
  for(const [id,o] of Object.entries(e.overrides)){if(!data.roster.some(p=>p.id===id)||Object.keys(o).some(k=>!['needsRide','driver','locationId','carId'].includes(k))||['needsRide','driver'].some(k=>k in o&&typeof o[k]!=='boolean')||o.locationId&&!data.locations.some(l=>l.id===o.locationId)||o.carId&&!data.roster.some(p=>p.id===o.carId))fail('Invalid event change');}
 }
}
