import path from 'node:path';
import {mkdirSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {bundle} from '@remotion/bundler';
import {enableTailwind} from '@remotion/tailwind';
import {selectComposition,renderStill,renderMedia} from '@remotion/renderer';
const root=path.resolve(import.meta.dirname,'..');
const output=path.join(root,'.local-artifacts','phase-a');mkdirSync(output,{recursive:true});
const sibling=path.join(root,'..','STEMotion_BE','src','main','resources','director-registry.json');
assert.deepEqual(JSON.parse(readFileSync(sibling,'utf8')),JSON.parse(readFileSync(path.join(root,'src/remotion/director/registry.json'),'utf8')),'BE registry must match FE');
const serveUrl=await bundle({entryPoint:path.join(root,'src/remotion/index.ts'),webpackOverride:(config)=>{
 const tailwind=enableTailwind(config);
 return {...tailwind,resolve:{...tailwind.resolve,alias:{...tailwind.resolve?.alias,'@':path.join(root,'src')}}};
}});
for(const id of ['PhaseACosmicZoom','PhaseATalkingDiagram']) {
 const composition=await selectComposition({serveUrl,id});
 const frame=Math.floor(composition.durationInFrames/2);
 const a=path.join(output,`${id}.png`),b=path.join(output,`${id}.repeat.png`);
 await renderStill({serveUrl,composition,frame,output:a});
 await renderStill({serveUrl,composition,frame,output:b});
 const hash=f=>createHash('sha256').update(readFileSync(f)).digest('hex');
 assert.equal(hash(a),hash(b),`Non-deterministic ${id}`);
 console.log(`${id}: midpoint snapshot and repeat hash PASS`);
}
if(process.argv.includes('--video')) {
 const composition=await selectComposition({serveUrl,id:'PhaseADemo'});
 await renderMedia({serveUrl,composition,codec:'h264',outputLocation:path.join(output,'PhaseADemo.mp4'),concurrency:1,crf:18});
 console.log('PhaseADemo: 30-second 1080p MP4 rendered');
}
console.log(`Artifacts: ${output}`);
