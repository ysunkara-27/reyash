import {test,expect} from '@playwright/test';
import type {Game,Action,Owner,Card} from '../src/classroom/engine';
import {readFileSync} from 'node:fs';
const candidateIds=['blueA','blueB','blueC','redA','redB','redC'] as const;
const cardById=Object.fromEntries(JSON.parse(readFileSync(new URL('../src/classroom/materials.json',import.meta.url),'utf8')).cards.map((c:Card)=>[c.id,c])) as Record<string,Card>;
const activeCandidate=(g:Game)=>g.order[g.turn];
const roundDone=(g:Game)=>g.turn>=g.order.length;
const party=(id:string)=>id.startsWith('blue')?'blue':'red';
const nomineeChoices=(g:Game,p:string)=>{const ids=candidateIds.filter(id=>party(id)===p);const max=Math.max(...ids.map(id=>g.delegates[id]));return ids.filter(id=>g.delegates[id]===max);};
import type {Session,View,PublicGame} from '../src/classroom/service';
test('five full campaigns through real HTTP storage with candidate authorization',async({request,baseURL})=>{
 const code=Array.from(crypto.getRandomValues(new Uint8Array(6)),n=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[n%32]).join('');
 const origin=new URL(baseURL!).origin;
 const call=async(route:string,body?:unknown,s?:Session)=>{const r=await request.fetch(`${origin}/api/classes/${code}/${route}`,{method:body?'POST':'GET',headers:s?{Authorization:'Bearer '+s.token}:{},data:body});const data=await r.json();expect(r.ok(),JSON.stringify(data)).toBe(true);return data;};
 const teacher:Session=await call('create',{name:'Full lifecycle verification',count:5});
 const students:Record<string,Record<string,Session>>={};
 for(let table=1;table<=5;table++){
  const id=String(table);students[id]={};
  for(const c of candidateIds){const s:Session=await call('join',{gameId:id});students[id][c]=s;const v:View=await call('state',undefined,s);await call('action',{gameId:id,revision:v.games[0].revision,requestId:crypto.randomUUID(),action:{type:'claim',candidate:c,name:`Student ${c}`}},s);}
 }
 const before:View=await call('state',undefined,teacher);await call('action',{revision:before.revision,requestId:crypto.randomUUID(),action:{type:'startAll'}},teacher);
 await Promise.all(Object.entries(students).map(async([gameId,sessions])=>{
  let view:View=await call('state',undefined,sessions.blueA);let g=view.games[0];let turns=0;let october=0;
  const move=async(action:Action,s:Session)=>{view=await call('action',{gameId,revision:g.revision,requestId:crypto.randomUUID(),action},s);g=view.games[0];};
  while(g.phase!=='complete'&&turns<100){
   if(g.phase==='convention'){
    for(const p of ['blue','red'] as const){if(!g.nominees[p])await move({type:'nominate',party:p,candidate:nomineeChoices(g,p)[0]},sessions[`${p}A`]);await move({type:'platform',party:p,cards:g.platformOptions[p].slice(0,5)},sessions[g.nominees[p]!]);}
    await move({type:'general'},sessions.blueA);expect(g.month).toBe(7);
   }else if(roundDone(g))await move({type:'advance'},sessions.blueA);
   else {
    const id=activeCandidate(g);const s=sessions[id];await move({type:'draw'},s);
    const card=g.hands[id].map(id=>cardById[id]).find(c=>!['choose','skip'].includes(c.special||''))||cardById[g.hands[id][0]];
    await move({type:'play',card:card.id,target:g.phase==='general'?(party(id)==='blue'?'red':'blue'):candidateIds.find(c=>c!==id),choices:['asian-americans','youth-voters','labor-unions','gun-owners']},s);
    await move({type:'discard',card:g.hands[id][0]},s);if(g.month===10)october++;await move({type:'end'},s);turns++;
   }
  }
  expect(g.phase).toBe('complete');expect(g.primaryResults.length).toBe(51);expect(g.results.length).toBe(51);expect(g.results.reduce((n,r)=>n+r.electoralVotes,0)).toBe(538);expect(october).toBeLessThanOrEqual(12);expect(october).toBeGreaterThanOrEqual(11);
  const persisted:View=await call('state',undefined,sessions.redC);expect(persisted.games[0].results).toEqual(g.results);
 }));
 const final:View=await call('state',undefined,teacher);expect(final.games.every(g=>g.phase==='complete')).toBe(true);expect(final.games.map(g=>g.id)).toEqual(['1','2','3','4','5']);
});
