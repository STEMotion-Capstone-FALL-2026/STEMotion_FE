from pathlib import Path
import subprocess,time,json
out=Path(__file__).resolve().parent;fe=out.parents[4]
results=[]
for name,cmd in [('typecheck',['node','node_modules/typescript/bin/tsc','--noEmit']),('build',['node','node_modules/vite/bin/vite.js','build','--config',str(out/'vite.build.config.ts'),'--configLoader','native'])]:
 start=time.time()
 with (out/(name+'.log')).open('w',encoding='utf-8') as log:r=subprocess.run(cmd,cwd=fe,stdout=log,stderr=subprocess.STDOUT,timeout=120)
 results.append({'name':name,'exit_code':r.returncode,'seconds':round(time.time()-start,2)})
 if r.returncode:break
(out/'STATIC_RESULTS.json').write_text(json.dumps(results,indent=2),encoding='utf-8');print(json.dumps(results))
raise SystemExit(any(r['exit_code'] for r in results))
