import { loadPyodide } from 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.mjs';
let py;
self.onmessage=async({data})=>{
 try{
  if(!py){self.postMessage({status:'Loading Python (first use may take a minute)…'});py=await loadPyodide();}
  self.postMessage({status:'Loading required libraries…'});
  await py.loadPackagesFromImports(data.setup+'\n'+data.code+'\n'+data.checks.join('\n'));
  let output='';py.setStdout({batched:s=>output+=s+'\n'});py.setStderr({batched:s=>output+=s+'\n'});
  const ns=py.runPython('dict()');
  let checks=[],error='',plot='';
  try{
   await py.runPythonAsync("import os\nos.environ['MPLBACKEND']='Agg'",{globals:ns});
   await py.runPythonAsync(data.setup,{globals:ns});
   await py.runPythonAsync(data.code,{globals:ns});
   if(data.reference)await py.runPythonAsync(data.reference,{globals:ns});
   for(const check of data.checks){try{await py.runPythonAsync(check,{globals:ns});checks.push(true);}catch{checks.push(false);}}
   plot=await py.runPythonAsync(`import sys\n_plot=''\nif 'matplotlib.pyplot' in sys.modules:\n    import matplotlib.pyplot as plt\n    if plt.get_fignums():\n        import io,base64\n        buf=io.BytesIO()\n        plt.gcf().savefig(buf,format='png',bbox_inches='tight')\n        _plot=base64.b64encode(buf.getvalue()).decode()\n        plt.close('all')\n_plot`,{globals:ns});
  }catch(e){error=e.message;checks=data.checks.map(()=>false);}
  finally{ns.destroy();}
  self.postMessage({done:true,output,checks,error,plot});
 }catch(e){self.postMessage({done:true,infrastructure:true,error:'Python could not load. Check your connection and retry, or download the notebook. '+e.message});}
};
