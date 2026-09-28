export function validateSearch(input){
 if(!input||!['origin','destination'].every(k=>/^[A-Z]{3}$/.test(input[k]||'')))throw Error('Use three-letter airport codes.');
 if(input.origin===input.destination)throw Error('Choose different origin and destination airports, or use driving.');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(input.competitionDate||''))throw Error('A competition date is required.');
 const d=new Date(`${input.competitionDate}T12:00:00Z`);
 if(!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==input.competitionDate)throw Error('Invalid competition date.');
 const delta=d.getTime()-Date.now();if(delta<86400000||delta>365*86400000)throw Error('Search dates must be between tomorrow and one year from now.');
 return input;
}
const shift=(s,n)=>new Date(Date.parse(`${s}T12:00:00Z`)+n*86400000).toISOString().slice(0,10);
export function flightRequest(input){return {data:{slices:[{origin:input.origin,destination:input.destination,departure_date:shift(input.competitionDate,-1)},{origin:input.destination,destination:input.origin,departure_date:shift(input.competitionDate,1)}],passengers:[{type:'adult'}],cabin_class:'economy',max_connections:1}};}
export function parseOffers(payload,input){
 const offers=(payload.data?.offers||[]).filter(o=>o.total_currency==='USD'&&Number.isFinite(Number(o.total_amount))&&Number(o.total_amount)>0&&Date.parse(o.expires_at)>Date.now()&&o.live_mode===true).sort((a,b)=>Number(a.total_amount)-Number(b.total_amount));
 const o=offers[0];if(!o)return null;
 return {origin:input.origin,destination:input.destination,competitionDate:input.competitionDate,amount:Number(o.total_amount),currency:'USD',source:'Duffel live offer',retrievedAt:new Date().toISOString(),expiresAt:o.expires_at,departure:shift(input.competitionDate,-1),returnDate:shift(input.competitionDate,1),carriers:[...new Set(o.slices.flatMap(s=>s.segments.map(x=>x.operating_carrier.name)))],itineraries:o.slices.map(s=>s.segments.map(x=>({from:x.origin.iata_code,to:x.destination.iata_code,departs:x.departing_at,arrives:x.arriving_at,carrier:x.operating_carrier.name}))),note:'One adult, economy, Friday–Sunday, at most one connection each way. Group availability and baggage are not guaranteed.'};
}
export function serpParameters(input){return {engine:'google_flights',departure_id:input.origin,arrival_id:input.destination,outbound_date:shift(input.competitionDate,-1),return_date:shift(input.competitionDate,1),type:'1',currency:'USD',hl:'en',gl:'us',adults:'1',travel_class:'1',stops:'2'};}
export function parseSerpOffers(payload,input){
 if(payload.search_parameters?.currency!=='USD'||Number(payload.search_parameters?.type)!==1)return null;
 const params=payload.search_parameters;
 if(params.departure_id!==input.origin||params.arrival_id!==input.destination||params.outbound_date!==shift(input.competitionDate,-1)||params.return_date!==shift(input.competitionDate,1))return null;
 const choices=[...(payload.best_flights||[]),...(payload.other_flights||[])].filter(o=>o.type==='Round trip'&&typeof o.price==='number'&&o.price>0&&Array.isArray(o.flights)&&o.flights.length>0).sort((a,b)=>a.price-b.price);
 const o=choices[0];if(!o)return null;
 const fetched=Date.parse(payload.search_metadata?.processed_at||'');const stamp=Number.isFinite(fetched)?fetched:Date.now();
 return {origin:input.origin,destination:input.destination,competitionDate:input.competitionDate,amount:o.price,currency:'USD',source:'Google Flights via SerpApi',retrievedAt:new Date(stamp).toISOString(),expiresAt:new Date(stamp+6*3600000).toISOString(),departure:params.outbound_date,returnDate:params.return_date,carriers:[...new Set(o.flights.map(f=>f.airline).filter(Boolean))],outboundDurationHours:o.total_duration?o.total_duration/60:null,itineraries:[o.flights.map(f=>({from:f.departure_airport.id,to:f.arrival_airport.id,departs:f.departure_airport.time,arrives:f.arrival_airport.time,carrier:f.airline}))],note:'Round-trip search price. Only outbound itinerary fetched to save quota; return choice, group availability, and baggage must be checked. Refresh after 6 hours; this is an app freshness limit, not a fare guarantee.'};
}
export function publicFreeAccount(raw){
 if(raw.error||raw.account_status!=='Active')throw Error('SerpApi key is invalid or the account is inactive.');
 if(Number(raw.plan_monthly_price)!==0)throw Error('Use a SerpApi Free plan account for this connection. No plan change was made.');
 return {plan:'Free',remaining:Number(raw.total_searches_left)||0,limit:Number(raw.searches_per_month)||250,renewal:raw.plan_renewal_date||null};
}
