import React from 'react';
import {AbsoluteFill,Audio,staticFile} from 'remotion';
import {FullSTEMVideo} from '../compositions/FullSTEMVideo';
import type {STEMScript} from '../../types/stem';
export function musicVolume(frame:number,scenes:STEMScript['scenes']):number {
 let start=0;
 for(const scene of scenes){if(frame<start+scene.durationInFrames){const narration=(scene as typeof scene & {narrationAudioUrl?:string}).narrationAudioUrl;const local=frame-start;const ramp=Math.min(1,local/8,(scene.durationInFrames-1-local)/8);return narration?.length ? .035 : .035+.075*Math.max(0,ramp);}start+=scene.durationInFrames;}
 return 0;
}
/** Local showcase: fixed licensed track, narration remains in the shared renderer. */
export const PhaseBVideo:React.FC<{script:STEMScript}>=({script})=><AbsoluteFill><FullSTEMVideo script={script}/><Audio src={staticFile('music/spacyloop.ogg')} loop volume={frame=>musicVolume(frame,script.scenes)}/></AbsoluteFill>;
