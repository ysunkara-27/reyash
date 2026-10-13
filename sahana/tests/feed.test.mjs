import test from 'node:test';
import assert from 'node:assert/strict';
import {matchJob,rankJobs} from '../../lib/sahana/match.mjs';
import {collect} from '../feed/sources.mjs';
import {federalJobs} from '../../api/sahana/jobs.mjs';
import {visibleJobs,csvCell} from '../model.mjs';
const now=Date.parse('2026-10-13T12:00:00Z');
const base={id:'1',sourceId:'oscar',title:'Healthcare Data Analyst Intern',company:'Health team',description:'Enrolled undergraduate students. Work with patient data.',sector:'healthcare',location:'Reston, VA',url:'https://example.org/jobs/1',checkedAt:'2026-10-13T11:00:00Z'};
test('matches internship work, rejects full-time and expired jobs',()=>{
 assert.equal(matchJob(base,now).track,'Data & analysis');
 assert.equal(matchJob({...base,title:'Senior Data Analyst'},now),null);
 assert.equal(matchJob({...base,closesAt:'2026-10-12'},now),null);
 assert.equal(matchJob({...base,url:'javascript:alert(1)'},now),null);
 assert.equal(matchJob({...base,title:'Marketing Intern',description:'Equal opportunity healthcare benefits'},now),null);
});
test('first-year uncertainty, explicit upper-year, graduation mismatch and bachelor alternative',()=>{
 assert.equal(matchJob(base,now).eligibility,'review');
 assert.equal(matchJob({...base,description:'Open to freshmen and all class levels.'},now).eligibility,'first-year');
 assert.equal(matchJob({...base,description:'Must be a rising junior or senior.'},now).eligibility,'later');
 assert.equal(matchJob({...base,description:'Expected graduation December 2027 or May 2028.'},now).eligibility,'later');
 assert.equal(matchJob({...base,description:"Currently pursuing a Bachelor's or Master's degree."},now).eligibility,'review');
 assert.equal(matchJob({...base,description:"Must be pursuing a Master's degree."},now).eligibility,'later');
});
test('government, local health data is prioritized and duplicates removed',()=>{
 const federal={...base,id:'2',url:'https://example.org/jobs/2',sector:'government'};
 const jobs=rankJobs([base,federal,base],now);assert.equal(jobs.length,2);assert.equal(jobs[0].id,'2');assert.equal(jobs[0].local,true);
});
test('failed sources retain recent evidence and successful empty sources clear old jobs',async()=>{
 const previous={jobs:[{...matchJob(base,now),checkedAt:'2026-10-12T11:00:00Z'}],sources:[{id:'oscar',checkedAt:'2026-10-12T11:00:00Z'}]};
 const failing=await collect(previous,async()=>{throw new Error('offline')},now);
 assert.equal(failing.jobs.length,1);assert.equal(failing.jobs[0].stale,true);
 const empty=await collect(previous,async()=>Response.json({jobs:[],total:0,jobPostings:[]}),now);
 assert.equal(empty.jobs.length,0);
 const old=await collect(previous,async()=>{throw new Error('offline')},now+8*86400000);assert.equal(old.jobs.length,0);
});
test('USAJOBS uses student path, normalizes deadlines and preserves education',async()=>{
 let requested;
 const result=await federalJobs({USAJOBS_API_KEY:'test-key',USAJOBS_EMAIL:'test@example.com'},async(u)=>{requested=u;return Response.json({SearchResult:{SearchResultCountAll:1,SearchResultItems:[{MatchedObjectDescriptor:{PositionID:'123',PositionTitle:'Student Trainee (Health Data Analysis)',OrganizationName:'Agency',PositionURI:'https://www.usajobs.gov/job/123',ApplicationCloseDate:'2099-10-31',UserArea:{Details:{Education:'Must be a rising junior',RemoteIndicator:'True'}},PositionLocationDisplay:'Washington, DC'}}]}})});
 assert.match(requested,/HiringPath=student/);assert.equal(result.jobs[0].eligibility,'later');assert.match(result.jobs[0].closesAt,/23:59:59/);assert.equal(result.jobs[0].mode,'remote');
});
test('saved archive survives removal, filters and spreadsheet export remain safe',()=>{
 const job=matchJob(base,now),tracker={'1':{job,saved:true,status:'applied'}};
 const f={view:'saved',category:'all',search:'',location:'all',sort:'fit',later:false};
 assert.equal(visibleJobs([],tracker,f,now)[0].archived,true);
 assert.equal(visibleJobs([job],tracker,{...f,view:'discover',search:'python'},now).length,0);
 assert.equal(visibleJobs([{...job,eligibility:'later'}],tracker,{...f,view:'discover'},now).length,0);
 assert.match(csvCell('=HYPERLINK("bad")'),/^"'/);
});
