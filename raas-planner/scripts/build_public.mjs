import {mkdir,readFile,writeFile,cp} from 'node:fs/promises';
import {resolve} from 'node:path';
export async function buildAtlas(source,destination){
 await mkdir(destination,{recursive:true});
 for(const name of ['atlas.html','atlas.css','atlas.mjs','calendar.mjs','lineups.mjs','evidence.mjs','planner-state.mjs','locations.mjs','data.json','geography.json']){
  if(name==='atlas.html'){const html=(await readFile(resolve(source,name),'utf8')).replace('<html lang="en">','<html lang="en" data-mode="public">');await writeFile(resolve(destination,'index.html'),html);}
  else await cp(resolve(source,name),resolve(destination,name));
 }
}
if(process.argv[1]&&resolve(process.argv[1])===resolve(import.meta.filename))await buildAtlas(resolve(import.meta.dirname,'..'),resolve(process.argv[2]||'dist/atlas'));
