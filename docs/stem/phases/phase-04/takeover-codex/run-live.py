from pathlib import Path
import os,sys,subprocess,socket,time,json,re,urllib.request,urllib.error,xml.etree.ElementTree as ET
out=Path(__file__).resolve().parent
fe=out.parents[4]
be=fe.parents[1]/'phase-03'/'STEMotion_BE'
java=Path('C:/Users/LeTran/.jdks/ms-17.0.18/bin/java.exe')
xml=ET.parse(be/'.build-p3/surefire-reports/TEST-com.stemotion.domain.stem.StemPostgresTest.xml')
cp=next(p.attrib['value'] for p in xml.findall('.//property') if p.attrib['name']=='java.class.path')
with socket.socket() as s:s.bind(('127.0.0.1',0));port=s.getsockname()[1]
args=['-cp',cp,'com.stemotion.e2e.E2eServer',f'--server.port={port}','--server.address=127.0.0.1','--spring.profiles.active=stem-p3-test','--spring.dotenv.enabled=false','--spring.flyway.locations=classpath:db/migration,classpath:db/auth-v2-e2e,classpath:db/stem-p3','--app.stem.enabled=true','--spring.sql.init.mode=always','--spring.sql.init.data-locations='+ (out/'catalog-test-only.sql').as_uri(),'--logging.level.root=WARN','--logging.level.com.stemotion=WARN','--logging.level.io.zonky.test.db.postgres.embedded.EmbeddedPostgres=INFO']
argfile=out/'java-test-only.args'
argfile.write_text('\n'.join('"'+a.replace('\\','/')+'"' for a in args),encoding='utf-8')
keys={'SYSTEMROOT','WINDIR','COMSPEC','PATHEXT','USERPROFILE','HOMEDRIVE','HOMEPATH','APPDATA','LOCALAPPDATA','PROGRAMFILES','PROGRAMFILES(X86)','PROGRAMDATA','ALLUSERSPROFILE','NUMBER_OF_PROCESSORS','PROCESSOR_ARCHITECTURE','TEMP','TMP','PATH'}
env={k:v for k,v in os.environ.items() if k.upper() in keys}
env.update(DB_URL='jdbc:postgresql://127.0.0.1:9/p4_unused',DB_USERNAME='postgres',DB_PASSWORD='',JWT_SECRET='p4-test-only-not-production-01234567890123456789',GEMINI_API_KEY='',BREVO_API_KEY='',GOOGLE_CLIENT_ID='',CI='true',NO_COLOR='1',E2E_API_PORT=str(port),P4_LIVE_API_URL=f'http://127.0.0.1:{port}/api/v1')
result={'scope':'TEST_ONLY embedded PostgreSQL / E2eServer fakes','be_source_edited':False,'ready':False,'test_exit_code':None,'cleaned':False}
with (out/'be-live.log').open('w',encoding='utf-8') as log:
 proc=subprocess.Popen([str(java),'@'+str(argfile)],cwd=fe,env=env,stdout=log,stderr=subprocess.STDOUT,creationflags=subprocess.CREATE_NO_WINDOW)
 result.update(pid=proc.pid,port=port)
 try:
  deadline=time.time()+90
  while time.time()<deadline and proc.poll() is None:
   try:
    with urllib.request.urlopen(f'http://127.0.0.1:{port}/api/v1/auth/google/enabled',timeout=1) as response:
     if response.status==200:result['ready']=True;break
   except (OSError,urllib.error.URLError):pass
   time.sleep(0.5)
  if not result['ready']:result['blocker']='BE clone could not start in 90s; see be-live.log'
  else:
   print('BE P3 clone ready on owned localhost port; disposable DB; running live FE integration.',flush=True)
   with (out/'integration.log').open('w',encoding='utf-8') as testlog:
    test=subprocess.run(['node','node_modules/vitest/vitest.mjs','run','--config',str(out/'vitest.live.config.ts'),'--configLoader','native'],cwd=fe,env=env,stdout=testlog,stderr=subprocess.STDOUT,timeout=180)
   result['test_exit_code']=test.returncode
 finally:
  # pg_ctl detaches PostgreSQL on Windows. Killing Java's process tree is insufficient.
  # Capture identity only from THIS runner's log and verify postmaster.pid + live CIM command.
  log.flush()
  pg_cleanup={'status':'NO_POSTMASTER_RECORDED'}
  try:
   text=(out/'be-live.log').read_text(encoding='utf-8')
   dirs=re.findall(r'fixing permissions on existing directory (.+?) \.\.\. ok',text)
   bins=re.findall(r'Postgres binaries at (.+)',text)
   if dirs and bins:
    data=Path(dirs[-1]).resolve();binary=Path(bins[-1].strip()).resolve()
    temp=Path(env['TEMP']).resolve()
    if not data.is_relative_to(temp) or not data.name.startswith('epg') or not binary.is_relative_to(temp/'embedded-pg'):
     raise RuntimeError('Refusing unverified temporary DB paths')
    pidfile=data/'postmaster.pid'
    if pidfile.exists():
     pg_pid=int(pidfile.read_text().splitlines()[0])
     probe_env={**env,'P4_PG_PID':str(pg_pid)}
     command="Get-CimInstance Win32_Process -Filter ('ProcessId = ' + $env:P4_PG_PID) | Select-Object Name,CommandLine | ConvertTo-Json"
     probe=subprocess.run(['powershell','-NoProfile','-Command',command],env=probe_env,capture_output=True,text=True,timeout=10)
     identity=json.loads(probe.stdout)
     if identity['Name']!='postgres.exe' or str(data).replace('\\','/') not in (identity['CommandLine'] or '').replace('\\','/'):
      raise RuntimeError('Refusing PostgreSQL identity mismatch')
     stopped=subprocess.run([str(binary/'bin'/'pg_ctl.exe'),'-D',str(data),'-m','fast','-w','stop'],env=env,capture_output=True,text=True,timeout=20)
     pg_cleanup={'status':'STOPPED' if stopped.returncode==0 else 'STOP_FAILED','pid':pg_pid,'data_dir':str(data),'exit_code':stopped.returncode}
    else:pg_cleanup={'status':'ALREADY_STOPPED','data_dir':str(data)}
  except Exception as exc:pg_cleanup={'status':'MANUAL_VERIFICATION_REQUIRED','reason':str(exc)}
  result['postgres_cleanup']=pg_cleanup
  if proc.poll() is None:
   subprocess.run(['taskkill','/PID',str(proc.pid),'/T','/F'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,timeout=15)
  try:proc.wait(timeout=20)
  except subprocess.TimeoutExpired:proc.kill();proc.wait(timeout=10)
  result['cleaned']=proc.poll() is not None and pg_cleanup['status'] in ['STOPPED','ALREADY_STOPPED','NO_POSTMASTER_RECORDED']
  result['cleanup_note']='Runner cleanup hardened after final live attempt; historical runs additionally verified by OWNED_PG_SHUTDOWN.json'
  result['server_exit_code']=proc.returncode
  (out/'LIVE_RUN_RESULT.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
  print(json.dumps(result),flush=True)
sys.exit(0 if result['ready'] and result['test_exit_code']==0 else 1)
