import {describe,it,expect} from 'vitest';
import {newGame,applyAction,applyEffects,newRoom,primaryBoard,candidateIds,states,cards,cardById,months,party,activeCandidate,roundDone,eligiblePlatforms,nomineeChoices,totals,type Actor,type Game,type Action} from '../classroom/engine';
import {ClassroomService,type Storage,type Session,type View} from '../classroom/service';
import {calculatePrimaryForState} from '../lib/rules/primaryRules';
const teacher:Actor={role:'teacher',id:'teacher'};
const student=(id:string,gameId='1'):Actor=>({role:'student',id,gameId});
function ready(index=0){let g=newGame(index);for(const id of candidateIds)g=applyAction(g,{type:'claim',candidate:id,name:id},student(id,g.id));return applyAction(g,{type:'start'},teacher);}
const doAction=(g:Game,a:Action)=>applyAction(g,a,student(activeCandidate(g),g.id));
function turn(g:Game){g=doAction(g,{type:'draw'});const id=activeCandidate(g);const chosen=g.hands[id].find(c=>!['skip','choose'].includes(cardById[c].special||''))!;const c=cardById[chosen];g=doAction(g,{type:'play',card:chosen,target:g.phase==='general'?(party(id)==='blue'?'red':'blue'):candidateIds.find(x=>x!==id)});g=doAction(g,{type:'discard',card:g.hands[id][0]});return doAction(g,{type:'end'});}
describe('classroom material fidelity',()=>{
 it('has 51 original states, 198 original cards, and 538 EV',()=>{expect(states).toHaveLength(51);expect(cards).toHaveLength(198);expect(new Set(cards.map(c=>c.id)).size).toBe(198);expect(states.reduce((n,s)=>n+s.electoralVotes,0)).toBe(538);for(const s of states)expect(s.voterGroups.reduce((n,v)=>n+v.percentage,0)).toBe(100);expect(cardById['card-1'].effects).toEqual([{voterGroupId:'labor-unions',delta:1},{voterGroupId:'corporate-executives',delta:-2}]);});
 it('uses exactly the printed group allocations and records corrections',()=>{const az=states.find(s=>s.id==='AZ')!;expect(az.voterGroups).toHaveLength(7);expect(az.voterGroups[0].percentage).toBe(22);expect(states.find(s=>s.id==='AL')!.printedTotal).toBe(104);expect(states.find(s=>s.id==='NH')!.electoralVotes).toBe(4);});
});
describe('classroom rules and complete campaigns',()=>{
 it('populates every primary once in the required monthly counts',()=>{const g=newGame(0);expect(g.schedule.map(m=>m.length)).toEqual([3,14,9,9,8,8]);expect(new Set(g.schedule.flat()).size).toBe(51);expect(g.schedule[0]).toEqual(['IA','NH','SC']);});
 it('fills empty spaces then replaces chosen rivals without ever exceeding five',()=>{const g=newGame(0);g.board['youth-voters']=['blueA','blueA','redB','redB'];const b=applyEffects(g.board,'blueA',[{voterGroupId:'youth-voters',delta:2}],{'youth-voters':'redB'});expect(b['youth-voters'].filter(x=>x==='blueA')).toHaveLength(4);expect(b['youth-voters']).toHaveLength(5);const full=applyEffects(b,'blueA',[{voterGroupId:'youth-voters',delta:20}]);expect(full['youth-voters']).toEqual(Array(5).fill('blueA'));expect(applyEffects(full,'blueA',[{voterGroupId:'youth-voters',delta:-20}])['youth-voters']).toEqual([]);});
 it('a tie within one party does not erase the other party’s closed-primary award',()=>{const g=newGame(0);g.board['youth-voters']=['blueA','blueB','redA'];const s={...states[0],primaryType:'closed' as const,voterGroups:[{voterGroupId:'youth-voters' as const,percentage:100}]};const r=calculatePrimaryForState(s,primaryBoard(g));expect(r.delegateTotals.redA).toBe(100);expect(r.delegateTotals.blueA).toBe(0);});
 it('blocks premature advances, wrong turns, forged cards, and duplicate draws',()=>{let g=ready();const active=activeCandidate(g);expect(()=>applyAction(g,{type:'advance'},teacher)).toThrow('Every candidate');expect(()=>applyAction(g,{type:'draw'},student(candidateIds.find(id=>id!==active)!))).toThrow('Wait');expect(()=>doAction(g,{type:'end'})).toThrow('Draw three');g=doAction(g,{type:'draw'});expect(()=>doAction(g,{type:'draw'})).toThrow('already drawn');const absent=cards.find(c=>!g.hands[active].includes(c.id))!;expect(()=>doAction(g,{type:'play',card:absent.id})).toThrow('not in your hand');});
 it('enforces server-side pauses and teacher-only controls',()=>{let g=ready();expect(()=>applyAction(g,{type:'pause'},student(activeCandidate(g)))).toThrow('teacher');g=applyAction(g,{type:'pause',value:true},teacher);expect(()=>doAction(g,{type:'draw'})).toThrow('paused');expect(()=>applyAction(g,{type:'draw'},{role:'monitor',id:'screen'})).toThrow('read-only');});
 it('runs all five tables from January through Election Day independently',()=>{
  const games=Array.from({length:5},(_,i)=>ready(i));
  for(let index=0;index<games.length;index++){
   let g=games[index];let safety=0;let octoberTurns=0;
   while(g.phase!=='complete'&&safety++<120){
    if(g.phase==='convention'){
     for(const p of ['blue','red'] as const){if(!g.nominees[p])g=applyAction(g,{type:'nominate',party:p,candidate:nomineeChoices(g,p)[0]},teacher);g=applyAction(g,{type:'platform',party:p,cards:eligiblePlatforms(g,p).slice(0,5)},teacher);}
     g=applyAction(g,{type:'general'},teacher);expect(g.month).toBe(7);expect(Object.values(g.board).flat().every(x=>x==='blue'||x==='red')).toBe(true);
    }else if(roundDone(g)){const old=g.month;g=applyAction(g,{type:'advance'},teacher);expect(g.month).toBe(old+1);}
    else {if(g.month===10)octoberTurns++;g=turn(g);}
    for(const slots of Object.values(g.board))expect(slots.length).toBeLessThanOrEqual(5);
   }
   expect(g.phase).toBe('complete');expect(g.primaryResults).toHaveLength(51);expect(g.counted).toEqual([0,1,2,3,4,5]);expect(g.results).toHaveLength(51);expect(totals(g).blue+totals(g).red).toBe(538);expect(octoberTurns).toBe(12);expect(()=>applyAction(g,{type:'advance'},teacher)).toThrow();games[index]=g;
   if(index<4)expect(games[index+1].month).toBe(0);
  }
 },20000);
 it('Cover-Up blocks a scandal, and special cards have defined effects',()=>{let g=ready();const id=activeCandidate(g);g.drawn=true;g.hands[id]=['card-185','card-120','card-159','card-1','card-184'];g=doAction(g,{type:'play',card:'card-185'});expect(g.shields).toContain(id);g.played=0;g.shields.push(candidateIds.find(c=>c!==id)!);const target=candidateIds.find(c=>c!==id)!;const before=structuredClone(g.board);g=doAction(g,{type:'play',card:'card-120',target});expect(g.board).toEqual(before);expect(g.shields).not.toContain(target);g.played=0;g=doAction(g,{type:'play',card:'card-159'});expect(g.double).toContain(id);g.played=0;g=doAction(g,{type:'play',card:'card-1'});expect(g.double).not.toContain(id);g.played=0;expect(()=>doAction(g,{type:'play',card:'card-184',choices:['youth-voters','youth-voters']})).toThrow('four different');});
});
class Memory implements Storage{data=new Map<string,unknown>();async get<T>(k:string){return structuredClone(this.data.get(k)) as T|undefined;}async put<T>(k:string,v:T){this.data.set(k,structuredClone(v));}}
describe('classroom service permissions and retry safety',()=>{
 it('scopes students, hides hands/deck, rejects stale writes, and deduplicates retries',async()=>{
  const service=new ClassroomService(new Memory());
  const call=async(route:string,body?:unknown,token?:string)=>{const r=await service.fetch(new Request('https://test/api/classes/ABC234/'+route,{method:body?'POST':'GET',headers:token?{Authorization:'Bearer '+token}:{},body:body?JSON.stringify(body):undefined}));return {status:r.status,data:await r.json()};};
  const t=(await call('create',{code:'ABC234',name:'Test',count:5})).data as Session;
  const students:Session[]=[];for(const id of candidateIds){const s=(await call('join',{gameId:'1'})).data as Session;students.push(s);let v=(await call('state',undefined,s.token)).data as View;const res=await call('action',{gameId:'1',revision:v.games[0].revision,requestId:id,action:{type:'claim',candidate:id,name:id}},s.token);expect(res.status).toBe(200);}
  const s=students[0];let v=(await call('state',undefined,s.token)).data as View;expect(v.games).toHaveLength(1);
  expect((await call('action',{gameId:'2',revision:0,requestId:'bad',action:{type:'start'}},s.token)).status).toBe(403);
  expect((await call('action',{revision:v.revision,requestId:'pause-forged',action:{type:'pauseAll',value:true}},s.token)).status).toBe(403);
  let tv=(await call('state',undefined,t.token)).data as View;
  await call('action',{gameId:'1',revision:tv.games[0].revision,requestId:'start',action:{type:'start'}},t.token);
  v=(await call('state',undefined,s.token)).data as View;const current=students[candidateIds.indexOf(activeCandidate(v.games[0]))];const job={gameId:'1',revision:v.games[0].revision,requestId:'draw-once',action:{type:'draw'}};
  const draw=await call('action',job,current.token);expect(draw.status).toBe(200);expect(draw.data.games[0].hands[activeCandidate(v.games[0])]).toHaveLength(3);
  const retry=await call('action',job,current.token);expect(retry.status).toBe(200);expect(retry.data.games[0].revision).toBe(draw.data.games[0].revision);
  expect((await call('action',{...job,requestId:'draw-twice'},current.token)).status).toBe(409);
  const monitor=(await call('monitor')).data as View;expect(monitor.games).toHaveLength(5);expect(monitor.games[0].deck).toEqual([]);expect(Object.values(monitor.games[0].hands).flat()).toEqual([]);expect(JSON.stringify(monitor)).not.toContain(current.token);
  tv=(await call('state',undefined,t.token)).data as View;expect(Object.values(tv.games[0].hands).flat()).toEqual([]);
  await call('action',{revision:tv.revision,requestId:'pause',action:{type:'pauseAll',value:true}},t.token);
  const paused=(await call('state',undefined,current.token)).data as View;
  expect((await call('action',{gameId:'1',revision:paused.games[0].revision,requestId:'end-paused',action:{type:'end'}},current.token)).status).toBe(400);
 });
});
