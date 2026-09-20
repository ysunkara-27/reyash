const API='https://hooraas-rides-api.sunkarayashaswi.workers.dev',TOKEN_KEY='ys-stats-token';
const $=id=>document.getElementById(id),escape=value=>String(value??'').replace(/[&<>"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[char]));
const labels={taskpup:'Taskpup',home:'ysunkara.com',amma:'Amma',rides:'Rides',bidpoints:'Bidpoints',apgovelections:'AP Gov Elections',pujarinet:'PujariNet',writings:'Writings',savetheworld:'Save the World',officehours:'Office Hours',other:'Other'};
let token=sessionStorage.getItem(TOKEN_KEY)||'',timer;
const number=value=>Number(value||0).toLocaleString();
const ago=value=>{if(!value)return'No activity';const minutes=Math.max(0,Math.round((Date.now()-value)/60000));return minutes<1?'just now':minutes<60?`${minutes}m ago`:minutes<1440?`${Math.round(minutes/60)}h ago`:`${Math.round(minutes/1440)}d ago`;};
function lock(){token='';sessionStorage.removeItem(TOKEN_KEY);clearInterval(timer);$('dashboard').hidden=true;$('lock').hidden=false;$('password').focus();}
async function fetchData(){const response=await fetch(API+'/stats/data',{headers:{authorization:'Bearer '+token},cache:'no-store'});if(response.status===401){lock();throw new Error('Session expired.');}const data=await response.json();if(!response.ok)throw new Error(data.error||'Could not load analytics.');return data;}
function metrics(data){return [['Live now',data.totals.live],['Past 24 hours',data.totals.day],['Past 7 days',data.totals.week],['Views · 24h',data.totals.hits_day],['Views · 7d',data.totals.hits_week]].map(([label,value])=>`<article class="metric"><strong>${number(value)}</strong><span>${label}</span></article>`).join('');}
function bars(rows,label){const max=Math.max(1,...rows.map(row=>Number(row.users)));return rows.length?rows.map(row=>`<i class="bar" style="--height:${Math.max(2,Math.round(Number(row.users)/max*100))}%" data-tip="${escape(label(row))} · ${number(row.users)} users · ${number(row.hits)} views"></i>`).join(''):'<p class="empty">No tracked activity yet.</p>';}
function render(data){
 $('freshness').textContent=`Updated ${new Date(data.generatedAt).toLocaleTimeString([], {hour:'numeric',minute:'2-digit',second:'2-digit'})} · refreshes every 30 seconds`;
 $('totals').innerHTML=metrics(data);
 $('sites').innerHTML=data.sites.length?data.sites.map(site=>`<article class="site-card"><h3>${escape(labels[site.site]||site.site)}</h3><div class="site-metrics"><div><strong>${number(site.live)}</strong><span>LIVE</span></div><div><strong>${number(site.day)}</strong><span>24 HOURS</span></div><div><strong>${number(site.week)}</strong><span>7 DAYS</span></div></div><small class="site-last">Last seen ${ago(site.last_seen)}</small></article>`).join(''):'<p class="empty">Activity will appear as people visit the sites.</p>';
 $('hourly').innerHTML=bars(data.hourly,row=>new Date(row.start).toLocaleTimeString([],{hour:'numeric'}));
 $('daily').innerHTML=bars(data.daily,row=>new Date(row.day+'T12:00:00').toLocaleDateString([],{weekday:'short'}));
 // Set chart sizing through the stylesheet API so the strict CSP can remain enabled.
 document.querySelectorAll('.bar').forEach(bar=>{const height=bar.getAttribute('style')?.match(/--height:(\d+)%/)?.[1];if(height)bar.style.setProperty('--height',height+'%');});
 $('username-count').textContent=`${number(data.usernames.length)} in the tracked week`;
 $('usernames').innerHTML=data.usernames.length?data.usernames.map(user=>`<div class="person"><strong>@${escape(user.username)}</strong><span>${number(user.hits)} requests<br>${ago(user.last_seen)}</span></div>`).join(''):'<p class="empty">No signed-in Taskpup accounts have been tracked yet.</p>';
 $('legacy-users').innerHTML=data.recentAccounts.length?data.recentAccounts.map(user=>`<span>@${escape(user.username)} · ${escape(user.last_day)}</span>`).join(''):'<p class="empty">No recent account-day records.</p>';
 $('coverage').textContent=data.trackingSince?`Exact cross-site tracking began ${new Date(data.trackingSince).toLocaleString()}. Live means activity in the past ${data.windows.liveMinutes} minutes. Counts use anonymous browser IDs; signed-in Taskpup rows also attach the account username.`:'Exact cross-site tracking begins with the first visit after this release.';
}
async function refresh(){try{render(await fetchData());}catch(error){$('freshness').textContent=error.message;}}
async function unlock(password){const response=await fetch(API+'/stats/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({password})});const data=await response.json();if(!response.ok)throw new Error(data.error||'Could not unlock stats.');token=data.token;sessionStorage.setItem(TOKEN_KEY,token);$('lock').hidden=true;$('dashboard').hidden=false;await refresh();clearInterval(timer);timer=setInterval(refresh,30000);}
$('login-form').onsubmit=async event=>{event.preventDefault();$('login-error').textContent='';const button=event.submitter;button.disabled=true;try{await unlock($('password').value);$('password').value='';}catch(error){$('login-error').textContent=error.message;}finally{button.disabled=false;}};
$('refresh').onclick=refresh;$('lock-button').onclick=lock;
if(token){$('lock').hidden=true;$('dashboard').hidden=false;refresh();timer=setInterval(refresh,30000);}
