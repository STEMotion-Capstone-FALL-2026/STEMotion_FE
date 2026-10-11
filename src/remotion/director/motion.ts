import {spring} from 'remotion';
/** A deterministic spring yoyo. No wall clock or CSS animation. */
export function springLoop(frame:number,fps:number,seconds=2.8):number {
 const half=Math.max(1,Math.round(fps*seconds/2));
 const local=((frame%(half*2))+half*2)%(half*2);
 const rise=spring({frame:local%half,fps,config:{damping:200},durationInFrames:half});
 return local<half?rise:1-rise;
}
export const forceScale=(frame:number,fps:number)=>.96+.16*springLoop(frame,fps,1.5);
export const waveDisplacement=(x:number,time:number,amplitude:number,wavelength:number,frequency:number)=>amplitude*Math.sin(2*Math.PI*(x/wavelength-time*frequency));
