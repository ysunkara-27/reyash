import {mkdir,readFile,writeFile,rename,chmod} from 'node:fs/promises';
import {FareEngine} from './fare-engine.mjs';
export {routeKey} from './fare-engine.mjs';
export class FareStore extends FareEngine{
 async init(){await mkdir(this.directory,{recursive:true,mode:0o700});await chmod(this.directory,0o700);for(const [file,apply] of [['fares.json',v=>{if(v.version===1)this.db=v;}],['secrets.json',v=>{this.key=v.serpApiKey||'';}]] ){try{apply(JSON.parse(await readFile(new URL(file,this.directory),'utf8')));}catch(e){if(e.code!=='ENOENT')throw Error(`Could not read local ${file}.`);}}this.key=process.env.SERPAPI_API_KEY||this.key;this.account=this.db.account||null;return this;}
 async write(name,value){const content=JSON.stringify(value);const operation=this.pending.then(async()=>{const temp=new URL(`${name}.tmp`,this.directory),destination=new URL(name,this.directory);await writeFile(temp,content,{mode:0o600});await chmod(temp,0o600);await rename(temp,destination);});this.pending=operation.catch(()=>{});return operation;}
}
