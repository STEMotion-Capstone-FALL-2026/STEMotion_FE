import React from 'react';
import {AbsoluteFill, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import type {AssetId, ScenePlan} from './plan';
import {validateScenePlan} from './plan';
import {tokens} from './tokens';
import {Arrow,Callout,GlowBody,KineticNumber,Label,Mascot,ParticleField,SpaceBackground,ZoomCamera} from './assets/general';
import type {AssetProps} from './assets/general';
const components: Record<AssetId, React.FC<AssetProps>> = {glow_body:GlowBody,mascot:Mascot,callout:Callout,arrow:Arrow,label:Label,kinetic_number:KineticNumber};
const positions: Record<string,[number,number]> = {main:[960,520],guide:[420,745],note_1:[1430,440],pointer:[1260,540],label:[960,140],quantity:[960,900]};
export const CinematicScene: React.FC<{plan: ScenePlan}> = ({plan}) => {
  validateScenePlan(plan);
  const frame=useCurrentFrame(), {fps}=useVideoConfig();
  const duration=Math.round(plan.duration_sec*fps);
  const enter=spring({frame,fps,config:{damping:200},durationInFrames:24});
  const body=plan.assets.map(asset => {
    const Component=components[asset.asset_id], [x,y]=positions[asset.slot];
    return <g key={asset.slot} transform={`translate(${x} ${y})`} opacity={enter}><Component {...asset.props}/></g>;
  });
  return <AbsoluteFill style={{background:tokens.navy}}><svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{fontFamily:tokens.font}}><SpaceBackground/><ParticleField/>
    {plan.template_id==='cosmic_zoom' ? <><ZoomCamera duration={duration}>{body.filter((_,i)=>plan.assets[i].slot==='main')}</ZoomCamera>{body.filter((_,i)=>plan.assets[i].slot!=='main')}</> : body}
    <path d="M 96 982 H 1824" stroke={tokens.ink} strokeOpacity=".12"/><path d={`M 96 982 H ${96+1728*Math.min(1,frame/Math.max(1,duration-1))}`} stroke={tokens.cyan} strokeWidth="3"/>
  </svg></AbsoluteFill>;
};
