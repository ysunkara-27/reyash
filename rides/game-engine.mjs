export const LANES=3,ROAD_HEIGHT=640,PLAYER_Y=530;
export const dailyKey=(now=new Date())=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
export function difficulty(seconds){const level=1+Math.floor(seconds/15);return {level,speed:Math.min(360,180+(level-1)*14),interval:Math.max(.95,1.65-(level-1)*.06)}}
export function newRun(day){let seed=2166136261;for(const c of day)seed=Math.imul(seed^c.charCodeAt(0),16777619);return {day,seed:seed>>>0,lane:1,elapsed:0,spawn:0,rows:[],skulls:0,combo:0,bonus:0,dead:false,feedback:'',flash:0}}
function random(run){let x=run.seed;x^=x<<13;x^=x>>>17;x^=x<<5;run.seed=x>>>0;return run.seed/4294967296}
export function score(run){return Math.floor(run.elapsed*10)+run.bonus}
export function switchLane(run,target=(run.lane+1)%LANES){
 if(run.dead||!Number.isInteger(target)||target<0||target>=LANES||target===run.lane)return;
 for(const row of run.rows)if(row.lane===run.lane&&row.y>=PLAYER_Y-135&&row.y<PLAYER_Y-62&&!row.near)row.near=true;
 run.lane=target;
}
export function step(run,dt){
 if(run.dead||!Number.isFinite(dt)||dt<=0)return;
 // Substeps prevent tunnelling through a car after a slow frame.
 if(dt>1/120){let left=Math.min(dt,.25);while(left>0&&!run.dead){const slice=Math.min(left,1/120);step(run,slice);left-=slice;}return;}
 run.elapsed+=dt;run.flash=Math.max(0,run.flash-dt);const d=difficulty(run.elapsed);run.spawn+=dt;
 if(run.spawn>=d.interval){
  run.spawn-=d.interval;const safeLane=Math.floor(random(run)*LANES),blocked=[0,1,2].filter(l=>l!==safeLane);
  const double=run.elapsed>20&&random(run)<.45;
  for(const lane of double?blocked:[blocked[Math.floor(random(run)*2)]])run.rows.push({lane,safeLane,y:-60,kind:['car','cones','pothole'][Math.floor(random(run)*3)],skull:false,collected:false,near:false,passed:false});
  run.rows.push({lane:safeLane,y:-60,kind:'star',skull:true,collected:false});
 }
 for(const row of run.rows){row.y+=dt*d.speed;
  const reach=row.kind==='car'?62:row.kind==='cones'?49:40;
  if(row.skull){if(!row.collected&&Math.abs(row.y-PLAYER_Y)<45&&row.lane===run.lane){row.collected=true;run.skulls++;run.combo++;const multi=Math.min(5,1+Math.floor(run.combo/3));run.bonus+=25*multi;run.feedback='Star chain ×'+multi;run.flash=.7;}if(row.y>PLAYER_Y+45&&!row.passed){row.passed=true;if(!row.collected)run.combo=0;}continue;}
  if(Math.abs(row.y-PLAYER_Y)<reach&&row.lane===run.lane){run.dead=true;run.feedback=row.kind==='car'?'Traffic collision':row.kind==='cones'?'Roadworks!':'Pothole!';return;}
  if(row.y>PLAYER_Y+reach&&!row.passed){row.passed=true;if(row.near){run.bonus+=30;run.feedback='Close call +30';run.flash=.6;}}
 }
 run.rows=run.rows.filter(r=>r.y<ROAD_HEIGHT+80);
}
