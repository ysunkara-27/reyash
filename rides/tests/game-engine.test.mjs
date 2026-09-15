import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newRun,step,switchLane,score,difficulty,dailyKey} from '../game-engine.mjs';
function autopilot(run,seconds){for(let i=0;i<seconds*120;i++){const next=run.rows.find(r=>r.y>=160&&r.y<272);if(next)switchLane(run,1-next.lane);step(run,1/120);assert.equal(run.dead,false)}}
test('endless daily course is deterministic and remains dodgeable through 10 minutes',()=>{const a=newRun('2026-09-15'),b=newRun('2026-09-15');autopilot(a,600);autopilot(b,600);assert.deepEqual(a,b);assert(a.elapsed>599);assert(score(a)>2200);assert.equal(difficulty(a.elapsed).level,40);assert(difficulty(10000).interval>=.65);assert(difficulty(10000).speed<=320)});
test('collision ends run; late dodge bonus and combo are awarded',()=>{const a=newRun('day');a.rows=[{lane:0,y:197,skull:true,collected:false}];step(a,.02);assert(a.dead);const b=newRun('day');b.rows=[{lane:0,y:180,skull:true,collected:false}];switchLane(b);for(let i=0;i<100;i++)step(b,1/120);assert(!b.dead);assert.equal(b.skulls,1);assert.equal(b.bonus,55)});
test('day changes on Charlottesville midnight',()=>{assert.equal(dailyKey(new Date('2026-09-16T03:59:00Z')),'2026-09-15')});
