import {mkdir,readFile,writeFile,cp} from 'node:fs/promises';
import {resolve} from 'node:path';
export async function buildAtlas(source,destination){
 await mkdir(destination,{recursive:true});
 for(const name of ['index.html','style.css','app.mjs','model.mjs','circuit.mjs','scenario.mjs','fare-routes.mjs','locations.mjs','data.json','geography.json','fares.json']){
  if(name==='index.html'){let html=await readFile(resolve(source,name),'utf8');html=html.replace('<html lang="en">','<html lang="en" data-mode="public">').replace('Local planning workspace','Your personal forecast').replace('Schedule & inputs','Published schedule').replace('Changes save in this browser.','Preferences stay in your browser; published data is read-only.');await writeFile(resolve(destination,name),html);}
  else await cp(resolve(source,name),resolve(destination,name));
 }
}
if(process.argv[1]&&resolve(process.argv[1])===resolve(import.meta.filename))await buildAtlas(resolve(import.meta.dirname,'..'),resolve(process.argv[2]||'dist/atlas'));
