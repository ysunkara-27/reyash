import {readFile} from 'node:fs/promises';
const key=(await readFile(new URL('../.local/cloud-admin.key',import.meta.url),'utf8')).trim();
const response=await fetch('https://raas-atlas-api.sunkarayashaswi.workers.dev/admin/pause',{method:'POST',headers:{Authorization:`Bearer ${key}`}});
if(!response.ok)throw Error(`Could not pause hosted fare searches (${response.status}).`);
const result=await response.json();if(!result.paused)throw Error('Hosted search pause not confirmed.');console.log('Hosted fare searches paused.');
