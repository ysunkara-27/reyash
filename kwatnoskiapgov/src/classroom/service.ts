import { applyAction, newRoom, eligiblePlatforms, type Room, type Actor, type Action, type Game } from './engine';
export interface Storage { get<T>(key:string):Promise<T|undefined>; put<T>(key:string,value:T):Promise<void> }
export interface Session { token:string; actor:Actor; code:string }
export type PublicGame = Game & { platformOptions: { blue:string[]; red:string[] }; deckCount:number; lastSeen:Record<string,number> };
export type View = Omit<Room,'games'> & { games:PublicGame[]; actor:Actor };
interface StoredRoom extends Omit<Room,'games'> { gameIds:string[] }
interface Auth { actor:Actor; expires:number }
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
export class ClassroomService {
 constructor(private storage:Storage){}
 async fetch(request:Request):Promise<Response>{
  try{
   const url=new URL(request.url);const route=url.pathname.split('/').filter(Boolean).at(-1);
   const raw=request.method==='POST'?await request.text():'';
   if(raw.length>20000)return json({error:'Request is too large.'},413);
   const body=raw?JSON.parse(raw):{};
   const stored=await this.storage.get<StoredRoom>('room');
   let room:Room|undefined=stored?{...stored,games:await Promise.all(stored.gameIds.map(async id=>(await this.storage.get<Game>(`game:${id}`))!))}:undefined;
   if(route==='create'&&request.method==='POST'){
    if(room)return json({error:'Class code already exists. Please try again.'},409);
    room=newRoom(String(body.code),String(body.name??''),Number(body.count));await this.save(room);
    return json(await this.session(room,{role:'teacher',id:crypto.randomUUID()}),201);
   }
   if(!room)return json({error:'Class not found. Check the six-letter class code.'},404);
   if(route==='lobby'&&request.method==='GET')return json({code:room.code,name:room.name,games:room.games.map(g=>({id:g.id,name:g.name,phase:g.phase,seats:g.seats.map(s=>({id:s.id,taken:!!s.controller}))}))});
   if(route==='join'&&request.method==='POST'){
    const game=room.games.find(g=>g.id===String(body.gameId));if(!game)return json({error:'Choose your table.'},400);
    // A join is a table-scoped credential, never a teacher credential.
    return json(await this.session(room,{role:'student',id:crypto.randomUUID(),gameId:game.id}),201);
   }
   if(route==='monitor'&&request.method==='GET')return json(await this.view(room,{role:'monitor',id:'projector'}));
   const token=request.headers.get('Authorization')?.replace(/^Bearer /,'')??'';
   const auth=await this.storage.get<Auth>(`auth:${token}`);
   if(!auth||auth.expires<Date.now())return json({error:'Session expired. Rejoin your class or restore your teacher key.'},401);
   const actor=auth.actor;
   if(route==='state'&&request.method==='GET'){
    await this.storage.put(`seen:${actor.id}`,Date.now());return json(await this.view(room,actor));
   }
   if(route!=='action'||request.method!=='POST')return json({error:'Not found.'},404);
   if(typeof body.requestId!=='string'||body.requestId.length>80)return json({error:'Missing request identifier.'},400);
   const dedupeKey=`requests:${actor.id}`;const requests=await this.storage.get<string[]>(dedupeKey)??[];
   if(requests.includes(body.requestId))return json(await this.view(room,actor));
   const action=body.action as Action;if(!action||typeof action.type!=='string')return json({error:'Missing action.'},400);
   if(['pauseAll','startAll'].includes(action.type)){
    if(actor.role!=='teacher')return json({error:'Only the teacher controls the class.'},403);
    if(action.type==='pauseAll'){room.paused=Boolean(action.value);}
    else {
     if(room.paused)throw new Error('Resume the class before starting.');
     const ready=room.games.filter(g=>g.phase==='setup'&&!g.paused&&g.seats.every(s=>s.controller));
     if(!ready.length)throw new Error('No tables are ready. Fill six candidates or assign remaining candidates first.');
     room.games=room.games.map(g=>ready.includes(g)?applyAction(g,{type:'start'},actor):g);
    }
   } else {
    const index=room.games.findIndex(g=>g.id===String(body.gameId));if(index<0)throw new Error('Unknown table.');
    const game=room.games[index];if(actor.role!=='teacher'&&actor.gameId!==game.id)return json({error:'You can only change your own table.'},403);
    if(body.revision!==game.revision)return json({error:'Someone just updated this table. Review the latest state and try again.',view:await this.view(room,actor)},409);
    if(room.paused&&!['claim','release','pause','reassign','undo'].includes(action.type))throw new Error('Your teacher has paused the whole class.');
    if(action.type==='undo'){
     if(actor.role!=='teacher')return json({error:'Only the teacher can undo a move.'},403);
     const previous=await this.storage.get<Game>(`undo:${game.id}`);if(!previous)throw new Error('No move to undo at this table.');
     room.games[index]={...previous,seats:game.seats,paused:game.paused,revision:game.revision+1,updatedAt:new Date().toISOString(),log:[...previous.log,{at:new Date().toISOString(),message:'Teacher undid the last game action.'}]};
     await this.storage.put(`undo:${game.id}`,null);
    }else{
     room.games[index]=applyAction(game,action,actor);
     if(!['claim','release','pause','assignRemaining'].includes(action.type))await this.storage.put(`undo:${game.id}`,game);
    }
   }
   room.revision++;await this.save(room);await this.storage.put(dedupeKey,[...requests.slice(-199),body.requestId]);
   await this.storage.put(`seen:${actor.id}`,Date.now());return json(await this.view(room,actor));
  }catch(error){return json({error:error instanceof Error?error.message:'Unable to process request.'},400);}
 }
 private async save(room:Room){
  const {games,...meta}=room;await this.storage.put('room',{...meta,gameIds:games.map(g=>g.id)});
  for(const g of games){const previous=await this.storage.get<Game>(`game:${g.id}`);if(!previous||previous.revision!==g.revision)await this.storage.put(`game:${g.id}`,g);}
 }
 private async session(room:Room,actor:Actor):Promise<Session>{const token=crypto.randomUUID()+crypto.randomUUID();await this.storage.put(`auth:${token}`,{actor,expires:Date.now()+1000*60*60*24*90});return {token,actor,code:room.code};}
 private async view(room:Room,actor:Actor):Promise<View>{
  const games=await Promise.all(room.games.filter(g=>actor.role!=='student'||g.id===actor.gameId).map(async g=>{
   const copy=structuredClone(g) as PublicGame;copy.platformOptions=g.phase==='convention'?{blue:eligiblePlatforms(g,'blue'),red:eligiblePlatforms(g,'red')}:{blue:[],red:[]};copy.deckCount=g.deck.length;copy.deck=[];copy.discard=[];
   // Teachers and the projector do not receive private hands. A student only receives owned hands.
   for(const s of copy.seats)if(s.controller!==actor.id)copy.hands[s.id]=[];
   copy.lastSeen=Object.fromEntries(await Promise.all(g.seats.map(async s=>[s.id,s.controller?await this.storage.get<number>(`seen:${s.controller}`)??0:0])));
   return copy;
  }));return {...room,games,actor};
 }
}
