import {writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {teamLocations,competitionLocations} from '../locations.mjs';
const locations={};
for (const [city,state] of [...Object.values(teamLocations),...Object.values(competitionLocations)]) {
 const key=`${city}, ${state}`; if(locations[key]) continue;
 const url=`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=100&countryCode=US`;
 const result=JSON.parse(execFileSync('curl',['-fsS','--max-time','20',url],{encoding:'utf8'}));
 const candidates=result.results?.filter(x=>x.admin1===state) || [];
 const place=candidates.sort((a,b)=>(b.population||0)-(a.population||0))[0];
 if(!place) throw Error(`No state-matched geocode: ${key}`);
 locations[key]={lat:place.latitude,lon:place.longitude,source:url,retrievedAt:new Date().toISOString()};
}
await writeFile(new URL('../geography.json',import.meta.url),JSON.stringify(locations,null,2));
console.log(`Verified ${Object.keys(locations).length} US city coordinates against state-filtered Open-Meteo / GeoNames results.`);
