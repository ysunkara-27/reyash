import {test} from 'node:test';
import assert from 'node:assert/strict';
import {migrate,plan,stabilizeAssignments,publicState} from '../model.mjs';
import {handle} from '../api/src/v2.mjs';
function fixture(){const d=migrate({roster:[{name:'A',driver:true,address:'One'},{name:'B',driver:true,address:'Two'},{name:'Rider1',address:'One'},{name:'Rider2',address:'One'},{name:'Rider3',address:'Two'}]});d.locations.forEach((l,i)=>Object.assign(l,{lat:38+i*.001,lng:-78.5}));return d}
test('manual move fixes all other cars; attendance and pickup edits do not reshuffle',()=>{const old=fixture(),next=structuredClone(old),e=next.events[0];e.overrides['person-2']={carId:'person-1'};stabilizeAssignments(old,next);const p=plan(next,e);assert(p.cars[1].people.some(p=>p.id==='person-2'));assert(p.cars[0].people.some(p=>p.id==='person-3'));assert(p.cars[1].people.some(p=>p.id==='person-4'));const changed=structuredClone(next);changed.events[0].overrides['person-2'].needsRide=false;changed.events[0].overrides['person-3'].locationId='loc-1';stabilizeAssignments(next,changed);assert(plan(changed,changed.events[0]).cars[0].people.some(p=>p.id==='person-3'))});
test('no driver or fewer seats leaves riders pending, never reassigns them silently',()=>{const old=fixture(),next=structuredClone(old);next.events[0].overrides['person-0']={needsRide:false};stabilizeAssignments(old,next);const p=plan(next,next.events[0]);assert.equal(p.pending.length,2);assert.equal(p.cars[0].people.length,1)});
test('public payload excludes draft riders, pickups, presets and overrides',()=>{const d=fixture();d.carPresets=[{id:'private',name:'Private',assignments:{}}];const view=publicState(d);assert.deepEqual(view.roster,[]);assert.deepEqual(view.locations,[]);assert(!JSON.stringify(view).includes('Rider1'));assert(!('carPresets' in view));d.events[1].verified={by:'Meera',at:new Date().toISOString()};const published=publicState(d);assert(published.events[1].publicPlan.cars.length===2);assert(!published.events[0].publicPlan)});
test('server publishes only verified plans and unpublishes on edit',async()=>{
 let stored=fixture(),revision=0;const env={DB:{prepare(sql){return {
 args:[],bind(...args){this.args=args;return this},
 async first(){return sql.includes('SELECT name')?{name:'Meera'}:{data:JSON.stringify(stored),revision}},
 async run(){stored=JSON.parse(this.args[0]);revision++;return {meta:{changes:1}}}
 }}}};
 const h={headers:{},json:(d,s=200)=>Response.json(d,{status:s}),userFrom:async req=>req.headers.has('Authorization')?{name:'Meera'}:null};
 const get=async()=> (await handle(new Request('https://test/v2/state'),env,h)).json();
 const save=async(data,verifyId)=>{const r=await handle(new Request('https://test/v2/state',{method:'PUT',headers:{Authorization:'test'},body:JSON.stringify({data,revision,verifyId})}),env,h);assert.equal(r.status,200);return r.json()};
 assert(!(await get()).data.events[0].publicPlan);await save(structuredClone(stored),stored.events[0].id);assert((await get()).data.events[0].publicPlan);const next=structuredClone(stored);next.events[0].overrides['person-2'].needsRide=false;await save(next);assert(!(await get()).data.events[0].publicPlan);
});
