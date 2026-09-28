import {defaults,typicalCount} from './model.mjs';
import {teamLocations,competitionLocations} from './locations.mjs';
export function freshScenario(data,geo){
 const settings=structuredClone(defaults),teams={};
 for(const t of new Set([...data.teams,...data.competitions.flatMap(c=>c.hosts)])){
  const [city,region,airport]=teamLocations[t]||['','',''];
  teams[t]={city,region,airport,...geo[`${city}, ${region}`],target:typicalCount(data,t,settings),budget:0,unavailable:[],strictRest:false};
 }
 const competitions=data.competitions.map(c=>{const [city,region,airport]=competitionLocations[c.id];return {...c,region,airport,...geo[`${city}, ${region}`],locationSource:geo[`${city}, ${region}`]?.source};});
 return {version:1,settings,teams,competitions,routes:{}};
}
