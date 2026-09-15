export const dailyKey=(now=new Date())=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
export function difficulty(seconds){const level=1+Math.floor(seconds/15);return {level,speed:Math.min(320,140+(level-1)*14),interval:Math.max(.65,1.3-(level-1)*.06)}}
export function newRun(day){let seed=2166136261;for(const c of day)seed=Math.imul(seed^c.charCodeAt(0),16777619);return {day,seed:seed>>>0,lane:0,elapsed:0,spawn:0,rows:[],skulls:0,combo:0,bonus:0,dead:false,feedback:'',flash:0}}
function random(run){let x=run.seed;x^=x<<13;x^=x>>>17;x^=x<<5;run.seed=x>>>0;return run.seed/4294967296}
export function score(run){return Math.floor(run.elapsed*10)+run.bonus}
export function switchLane(run,target=1-run.lane){if(run.dead||target===run.lane)return;for(const row of run.rows)if(row.lane===run.lane&&row.y>=155&&row.y<198&&!row.near)row.near=true;run.lane=target}
export function step(run,dt){
 if(run.dead)return;run.elapsed+=dt;run.flash=Math.max(0,run.flash-dt);const d=difficulty(run.elapsed);run.spawn+=dt;
 if(run.spawn>=d.interval){run.spawn-=d.interval;run.rows.push({lane:random(run)<.5?0:1,y:-25,skull:random(run)<.8,collected:false,near:false,passed:false})}
 for(const row of run.rows){row.y+=dt*d.speed;
   if(row.y>=198&&row.y<=271){if(row.lane===run.lane){run.dead=true;run.feedback='Pothole!';return}if(row.skull&&!row.collected){row.collected=true;run.skulls++;run.combo++;const multi=Math.min(5,1+Math.floor(run.combo/3));run.bonus+=25*multi;run.feedback='☠ ×'+multi;run.flash=.5}}
   if(row.y>271&&!row.passed){row.passed=true;if(row.skull&&!row.collected)run.combo=0;if(row.near){run.bonus+=30;run.feedback='Close call +30';run.flash=.6}}
 }run.rows=run.rows.filter(r=>r.y<320);
}
