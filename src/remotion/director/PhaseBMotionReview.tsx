import React from 'react';
import {TransitionSeries,linearTiming} from '@remotion/transitions';
import {AbsoluteFill} from 'remotion';
import {CinematicScene} from './CinematicScene';
import {phaseBPlans} from './phaseB';
import {pushThrough} from './transitions/remocn/push-through';
/** Local silent review. Outgoing handles compensate overlap without shortening 60s. */
export const REVIEW_FPS=30, REVIEW_TRANSITION_FRAMES=24;
export function reviewTimeline() {
 return phaseBPlans.map((plan,i)=>({start:i*300,frames:300+(i<phaseBPlans.length-1?REVIEW_TRANSITION_FRAMES:0),plan}));
}
export const PhaseBMotionReview:React.FC=()=> <AbsoluteFill style={{background:'#080e27'}}><TransitionSeries>
 {reviewTimeline().map(({plan,frames},i)=><React.Fragment key={i}>
  {i>0&&<TransitionSeries.Transition presentation={pushThrough({zoom:1.16,blur:3})} timing={linearTiming({durationInFrames:REVIEW_TRANSITION_FRAMES})}/>}
  <TransitionSeries.Sequence durationInFrames={frames}><CinematicScene plan={{...plan,duration_sec:frames/REVIEW_FPS}}/></TransitionSeries.Sequence>
 </React.Fragment>)}
 </TransitionSeries></AbsoluteFill>;
