import source from './materials.json';
import { candidateIds, candidateById, partyCandidateIds } from '../data/candidates';
import { voterGroups } from '../data/voterGroups';
import { calculatePrimaryForState, emptyDelegateTotals } from '../lib/rules/primaryRules';
import { calculateStateWinner } from '../lib/rules/generalElectionRules';
import type { CandidateId, Party, VoterGroupId, Effect, CandidateTokenBoard, PartyTokenBoard, StateData, DelegateTotals, ElectionStateResult } from '../types';

export { candidateIds, candidateById, partyCandidateIds, voterGroups };
export type Owner = CandidateId | Party;
export type Board = Record<VoterGroupId, Owner[]>;
export type Card = Omit<(typeof source.cards)[number], 'effects'> & { effects: Effect[] };
export const cards = source.cards as Card[];
export const cardById = Object.fromEntries(cards.map(c => [c.id, c])) as Record<string, Card>;
export const states = source.states as Array<Omit<StateData, 'voterGroups'> & { printedTotal: number; printedElectoralVotes: number; image: string; page: number; voterGroups: Array<{ voterGroupId: VoterGroupId; percentage: number; printedPercentage: number }> }>;
export const months = ['January','February','March','April','May','June','Convention','July','August','September','October','November','Election Day'];
export type Seat = { id: CandidateId; name: string; controller: string | null };
export type Phase = 'setup' | 'primary' | 'convention' | 'general' | 'complete';
export interface Game {
 id: string; name: string; revision: number; paused: boolean; phase: Phase; month: number;
 seats: Seat[]; incumbent: CandidateId; board: Board; schedule: string[][];
 order: CandidateId[]; turn: number; drawn: boolean; played: number; discarded: number;
 deck: string[]; discard: string[]; hands: Record<CandidateId,string[]>; playedBy: Record<CandidateId,string[]>;
 delegates: DelegateTotals; primaryResults: ReturnType<typeof calculatePrimaryForState>[]; counted: number[];
 nominees: Record<Party, CandidateId | null>; platforms: Record<Party,string[]>; ready: Record<Party,boolean>;
 shields: Owner[]; skip: CandidateId[]; double: CandidateId[];
 results: ElectionStateResult[]; coinFlips: string[];
 log: Array<{ at: string; message: string }>; updatedAt: string;
}
export interface Actor { role: 'teacher' | 'student' | 'monitor'; id: string; gameId?: string }
export interface Room { code: string; name: string; revision: number; paused: boolean; games: Game[]; createdAt: string }
export type Action = { type: string; [key: string]: unknown };
export const party = (id: Owner): Party => id.startsWith('blue') ? 'blue' : 'red';
export function shuffle<T>(values:T[], random= Math.random):T[] { const a=[...values]; for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; }
const emptyBoard = ():Board => Object.fromEntries(voterGroups.map(g=>[g.id,[] as Owner[]])) as Board;
const seatMap = ():Record<CandidateId,string[]> => Object.fromEntries(candidateIds.map(id=>[id,[] as string[]])) as Record<CandidateId,string[]>;
function fail(condition: unknown, message: string): asserts condition { if(!condition) throw new Error(message); }
function log(g:Game,message:string){g.log.push({at:new Date().toISOString(),message});g.log=g.log.slice(-220);}
export function newGame(index:number,random=Math.random):Game {
 const remaining=shuffle(states.map(s=>s.id).filter(id=>!['IA','NH','SC'].includes(id)),random);
 let offset=0; const schedule=[['IA','NH','SC'],...[14,9,9,8,8].map(n=>{const ids=remaining.slice(offset,offset+n);offset+=n;return ids;})];
 return {id:String(index+1),name:`Table ${index+1}`,revision:0,paused:false,phase:'setup',month:0,seats:candidateIds.map(id=>({id,name:'',controller:null})),incumbent:shuffle(candidateIds,random)[0],board:emptyBoard(),schedule,order:[],turn:0,drawn:false,played:0,discarded:0,deck:shuffle(cards.map(c=>c.id),random),discard:[],hands:seatMap(),playedBy:seatMap(),delegates:emptyDelegateTotals(),primaryResults:[],counted:[],nominees:{blue:null,red:null},platforms:{blue:[],red:[]},ready:{blue:false,red:false},shields:[],skip:[],double:[],results:[],coinFlips:[],log:[],updatedAt:new Date().toISOString()};
}
export function newRoom(code:string,name:string,count:number,random=Math.random):Room {
 fail(Number.isInteger(count)&&count>=1&&count<=12,'Choose between 1 and 12 tables.');
 return {code,name:name.trim().slice(0,80)||'AP Government',revision:0,paused:false,games:Array.from({length:count},(_,i)=>newGame(i,random)),createdAt:new Date().toISOString()};
}
export function activeCandidate(g:Game){return g.order[g.turn];}
export function roundDone(g:Game){return g.order.length>0 && g.turn>=g.order.length;}
export function canAct(g:Game,a:Actor){return a.role==='teacher'||g.seats.find(s=>s.id===activeCandidate(g))?.controller===a.id;}
export function primaryBoard(g:Game):CandidateTokenBoard {return Object.fromEntries(voterGroups.map(v=>[v.id,Object.fromEntries(candidateIds.map(id=>[id,g.board[v.id].filter(x=>x===id).length]))])) as CandidateTokenBoard;}
export function generalBoard(g:Game):PartyTokenBoard {return Object.fromEntries(voterGroups.map(v=>[v.id,{blue:g.board[v.id].filter(x=>party(x)==='blue').length,red:g.board[v.id].filter(x=>party(x)==='red').length}])) as PartyTokenBoard;}
export function controller(slots:Owner[]):Owner|null {const ids=[...new Set(slots)];return ids.find(id=>slots.filter(x=>x===id).length>=3)??null;}
export function displacementOptions(slots:Owner[],target:Owner):Owner[]{return [...new Set(slots.filter(x=>x!==target))].sort((a,b)=>Number(party(a)===party(target))-Number(party(b)===party(target)) || slots.filter(x=>x===b).length-slots.filter(x=>x===a).length || a.localeCompare(b));}
// Five shared spaces. Empty spaces are used first, then the selected rival is replaced.
export function applyEffects(board:Board,target:Owner,effects:Effect[],replace:Partial<Record<VoterGroupId,Owner>>={}):Board {
 const next=structuredClone(board);
 for(const effect of effects){
  const slots=next[effect.voterGroupId]; fail(slots&&Number.isInteger(effect.delta),'Invalid card effect.');
  if(effect.delta<0){for(let n=0;n<-effect.delta;n++){const i=slots.indexOf(target);if(i>=0)slots.splice(i,1);}}
  else for(let n=0;n<effect.delta;n++){
   if(slots.length<5)slots.push(target);
   else {const options=displacementOptions(slots,target);if(!options.length)break;const selected=replace[effect.voterGroupId];const remove=selected&&options.includes(selected)?selected:options[0];slots[slots.indexOf(remove)]=target;}
  }
 }
 return next;
}
function monthStart(g:Game,random:()=>number){ const order=shuffle(candidateIds,random);g.order=g.month===10?[...order,...order]:order;g.turn=0;g.drawn=false;g.played=0;g.discarded=0;skipTurns(g); }
function skipTurns(g:Game){while(!roundDone(g)&&g.skip.includes(activeCandidate(g))){const id=activeCandidate(g);g.skip.splice(g.skip.indexOf(id),1);log(g,`${candidateById[id].name} skips this turn after Debate Walk-Off.`);g.turn++;}}
export function eligiblePlatforms(g:Game,p:Party){return [...new Set(partyCandidateIds[p].flatMap(id=>[...g.playedBy[id],...g.hands[id]]))].filter(id=>cardById[id]?.type==='Platform Idea');}
export function nomineeChoices(g:Game,p:Party){const max=Math.max(...partyCandidateIds[p].map(id=>g.delegates[id]));return partyCandidateIds[p].filter(id=>g.delegates[id]===max);}
export function previewEffects(g:Game,card:Card,target:Owner,choices:string[]=[]):Effect[]{
 if(card.special==='choose'){
  fail(choices.length===4&&new Set(choices).size===4&&choices.every(id=>voterGroups.some(v=>v.id===id)),'Choose four different voter groups: one gains 4, three lose 1.');
  return choices.map((id,i)=>({voterGroupId:id as VoterGroupId,delta:i===0?4:-1}));
 }
 return card.effects.map(e=>({...e,delta:e.delta>0&&g.double.includes(activeCandidate(g))?e.delta*2:e.delta}));
}
export function applyAction(original:Game,action:Action,actor:Actor,random=Math.random):Game {
 const g=structuredClone(original);const teacher=actor.role==='teacher';
 fail(actor.role!=='monitor','The projector is read-only.');
 fail(teacher||actor.gameId===g.id,'You can only change your own table.');
 const type=action.type;
 if(type==='pause'){fail(teacher,'Only the teacher can pause games.');g.paused=Boolean(action.value);}
 else if(type==='reassign'){fail(teacher,'Only the teacher can reassign candidates.');const seat=g.seats.find(s=>s.id===action.candidate);const owner=g.seats.find(s=>s.controller===action.controller&&s.controller);fail(seat&&owner,'Choose a candidate and a joined student.');seat.controller=owner.controller;seat.name=owner.name;log(g,`Teacher handed ${candidateById[seat.id].name} to ${owner.name}.`);}
 else if(type==='release'){fail(teacher,'Only the teacher can release a seat.');const seat=g.seats.find(s=>s.id===action.candidate);fail(seat,'Unknown candidate.');seat.controller=null;seat.name='';log(g,`${candidateById[seat.id].name} is available to rejoin.`);}
 else {
 fail(!g.paused,'Your teacher has paused this table.');
 if(type==='claim'){
  fail(actor.role==='student','Join as a student to claim a candidate.');
  const seat=g.seats.find(s=>s.id===action.candidate);fail(seat,'Choose a candidate.');
  fail(!seat.controller||seat.controller===actor.id,'That candidate is already taken.');
  fail(!g.seats.some(s=>s.controller===actor.id)||seat.controller===actor.id,'You already have a candidate.');
  const name=String(action.name??'').trim().slice(0,40);fail(name,'Enter your first name or nickname.');seat.name=name;seat.controller=actor.id;log(g,`${name} joined as ${candidateById[seat.id].name}.`);
 } else if(type==='assignRemaining'){
  fail(teacher&&g.phase==='setup','Only the teacher can assign remaining candidates during setup.');
  const occupied=g.seats.filter(s=>s.controller);fail(occupied.length>0,'At least one student must join first.');
  g.seats.filter(s=>!s.controller).forEach((s,i)=>{s.controller=occupied[i%occupied.length].controller;s.name=occupied[i%occupied.length].name;});log(g,'Teacher assigned remaining candidates to joined students.');
 } else if(type==='start'){
  fail(teacher&&g.phase==='setup','Only the teacher can start a table once.');fail(g.seats.every(s=>s.controller),'Fill all six candidates, or assign remaining candidates to joined students.');
  g.phase='primary';g.board=emptyBoard();const p=party(g.incumbent);
  voterGroups.forEach(v=>{g.board[v.id]=Array(source.base[v.id][p]).fill(g.incumbent);});monthStart(g,random);
  log(g,`January begins. ${candidateById[g.incumbent].name} is the incumbent and receives their party’s shaded spaces. Order is shuffled each month.`);
 } else if(type==='nominate'){
  fail(g.phase==='convention','Nominations happen at the convention.');const p=action.party as Party;fail(p==='blue'||p==='red','Choose a party.');
  fail(teacher||g.seats.some(s=>s.controller===actor.id&&party(s.id)===p),'Choose only your own party’s nominee.');
  fail(!g.ready[p],'Your party platform is already confirmed.');fail(nomineeChoices(g,p).includes(action.candidate as CandidateId),'The nominee must have the most delegates in their party. Resolve tied leaders together.');g.nominees[p]=action.candidate as CandidateId;log(g,`${p} nominated ${candidateById[g.nominees[p]!].name}.`);
 } else if(type==='platform'){
  fail(g.phase==='convention','Platforms are chosen at the convention.');const p=action.party as Party;fail(p==='blue'||p==='red','Choose a party.');fail(g.nominees[p],'Choose a nominee first.');
  fail(teacher||g.seats.find(s=>s.id===g.nominees[p])?.controller===actor.id,'Your nominee chooses the party platform.');
  const selected=action.cards as string[];const eligible=eligiblePlatforms(g,p);const count=Math.min(5,eligible.length);
  fail(Array.isArray(selected)&&selected.length===count&&new Set(selected).size===count&&selected.every(id=>eligible.includes(id)),`Choose ${count} available platform cards.`);
  g.platforms[p]=selected;g.ready[p]=true;log(g,`${p} confirmed ${count} platform cards${count<5?' (all available cards)':''}.`);
 } else if(type==='general'){
  fail(g.phase==='convention'&&g.ready.blue&&g.ready.red,'Both parties must confirm their platforms first.');fail(teacher||g.seats.some(s=>s.controller===actor.id),'Join a candidate to continue.');
  g.board=emptyBoard();voterGroups.forEach(v=>{g.board[v.id]=[...Array(source.base[v.id].blue).fill('blue'),...Array(source.base[v.id].red).fill('red')];});
  // Alternating parties avoids applying all five blue cards before any red cards.
  const first=shuffle<Party>(['blue','red'],random);for(let i=0;i<5;i++)for(const p of first){const id=g.platforms[p][i];if(id)g.board=applyEffects(g.board,p,cardById[id].effects);}
  for(const p of first)g.board=applyEffects(g.board,p,candidateById[g.nominees[p]!].effects);
  g.phase='general';g.month=7;g.shields=[];g.skip=[];g.double=[];monthStart(g,random);
  log(g,`July: primary tiles cleared; exact printed shaded spaces restored; platforms applied in alternating ${first.join('/')} order, then nominee effects. All six players now support their party.`);
 } else if(type==='advance'){
  fail(g.phase==='primary'||g.phase==='general','Finish the current phase first.');fail(roundDone(g),'Every candidate must finish their turns before the month ends.');
  fail(teacher||g.seats.some(s=>s.controller===actor.id),'Join a candidate first.');
  if(g.phase==='primary'){
   fail(!g.counted.includes(g.month),'This month has already been counted.');
   const board=primaryBoard(g);for(const id of g.schedule[g.month]){const state=states.find(s=>s.id===id)!;const result=calculatePrimaryForState(state,board);g.primaryResults.push(result);for(const c of candidateIds)g.delegates[c]+=result.delegateTotals[c];}g.counted.push(g.month);
   log(g,`${months[g.month]} counted once: ${g.schedule[g.month].join(', ')}. Each state uses 100 classroom delegate points; unclaimed groups award none.`);
  }
  g.month++;
  if(g.month===6){g.phase='convention';for(const p of ['blue','red'] as Party[]){const choices=nomineeChoices(g,p);g.nominees[p]=choices.length===1?choices[0]:null;}log(g,'June is complete. Time for the party conventions.');}
  else if(g.month===12){
   const board=generalBoard(g);g.results=states.map(s=>{const result=calculateStateWinner(s,board);if(result.winner==='tie'){const p=random()<.5?'blue':'red';g.coinFlips.push(s.id);return {...calculateStateWinner(s,board,p),explanation:`Tied at ${result.bluePercentage}% each. A recorded coin flip awarded ${s.name} to ${p}.`};}return result;});g.phase='complete';log(g,'Election Day: every state counted. Tied states use recorded coin flips.');
  } else monthStart(g,random);
 } else {
  fail(g.phase==='primary'||g.phase==='general','Wait for the teacher to start, or finish the convention.');fail(!roundDone(g),'This month’s turns are finished. Count or advance the month.');fail(canAct(g,actor),'Wait for your turn.');
  const id=activeCandidate(g);const target=g.phase==='general'?party(id):id;
  if(type==='draw'){
   fail(!g.drawn,'You have already drawn this turn.');
   for(let i=0;i<3;i++){if(!g.deck.length){g.deck=shuffle(g.discard,random);g.discard=[];}if(g.deck.length)g.hands[id].push(g.deck.pop()!);}
   g.drawn=true;log(g,`${candidateById[id].name} drew three cards.`);
  } else if(type==='play'){
   fail(g.drawn,'Draw three cards first.');fail(g.played<2,'Play at most two cards per turn; discard at least one.');const card=cardById[String(action.card)];fail(card&&g.hands[id].includes(card.id),'That card is not in your hand.');
   let to:Owner=target;
   if(card.type==='Scandal'){to=action.target as Owner;fail(g.phase==='primary'?candidateIds.includes(to as CandidateId)&&to!==id:(to==='blue'||to==='red')&&to!==target,'Choose another candidate (primaries) or the other party (general).');}
   if(card.special==='cover'){if(!g.shields.includes(target))g.shields.push(target);log(g,`${candidateById[id].name} armed a Cover-Up: blocks the next scandal targeting ${target}.`);}
   else if(card.type==='Scandal'&&g.shields.includes(to)){g.shields.splice(g.shields.indexOf(to),1);log(g,`${card.title} was blocked by ${to}’s Cover-Up.`);}
   else if(card.special==='skip'){g.skip.push(id);log(g,`${candidateById[id].name} will skip their next turn.`);}
   else if(card.special==='double'){if(!g.double.includes(id))g.double.push(id);log(g,`${candidateById[id].name} will double gains on their next numeric card.`);}
   else {const effects=previewEffects(g,card,to,Array.isArray(action.choices)?action.choices as string[]:[]);g.board=applyEffects(g.board,to,effects,(action.replace??{}) as Partial<Record<VoterGroupId,Owner>>);g.double=g.double.filter(c=>c!==id);log(g,`${candidateById[id].name} played ${card.title} on ${to}.`);}
   g.hands[id].splice(g.hands[id].indexOf(card.id),1);g.playedBy[id].push(card.id);g.played++;
  } else if(type==='discard'){
   fail(g.drawn,'Draw three cards first.');const card=String(action.card);fail(g.hands[id].includes(card),'That card is not in your hand.');fail(g.played>0||g.hands[id].length>1,'Keep a card to play this turn.');g.hands[id].splice(g.hands[id].indexOf(card),1);g.discard.push(card);g.discarded++;
  } else if(type==='end'){
   fail(g.drawn&&g.played>=1&&g.discarded>=1,'Draw three, play at least one, and discard at least one before ending your turn.');g.turn++;g.drawn=false;g.played=0;g.discarded=0;skipTurns(g);log(g,roundDone(g)?`${months[g.month]} turns complete.`:`Turn passed to ${candidateById[activeCandidate(g)].name}.`);
  } else throw new Error('Unknown action.');
 }
 }
 g.revision++;g.updatedAt=new Date().toISOString();return g;
}
export function totals(g:Game){return {blue:g.results.reduce((n,s)=>n+(s.winner==='blue'?s.electoralVotes:0),0),red:g.results.reduce((n,s)=>n+(s.winner==='red'?s.electoralVotes:0),0)};}
