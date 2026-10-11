import React from 'react';
import {AbsoluteFill, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import type {AssetId, ScenePlan} from './plan';
import {validateScenePlan} from './plan';
import {tokens} from './tokens';
import {Arrow,Callout,GlowBody,KineticNumber,Label,Mascot,ParticleField,SpaceBackground,ZoomCamera} from './assets/general';
import type {AssetProps} from './assets/general';
import {ForceVector,OrbitPath,Pendulum,Lens,Wave} from './assets/physics';
import {Atom,Molecule,Flask,ElementTile} from './assets/chemistry';
const components: Record<AssetId, React.FC<AssetProps>> = {glow_body:GlowBody,mascot:Mascot,callout:Callout,arrow:Arrow,label:Label,kinetic_number:KineticNumber,force_vector:ForceVector,orbit_path:OrbitPath,pendulum:Pendulum,lens:Lens,wave:Wave,atom:Atom,molecule:Molecule,flask:Flask,element_tile:ElementTile};
const positions: Record<string,[number,number]> = {main:[960,520],guide:[420,745],note_1:[1430,440],pointer:[1260,540],label:[960,140],quantity:[960,900]};
export function scenePositions(plan: ScenePlan): Record<string,[number,number]> {
  const variant=plan.layout_variant ?? 'center';
  const cosmic=plan.template_id==='cosmic_zoom';
  if(variant==='left') return {...positions,main:cosmic?[650,510]:[730,500],guide:[1550,790],note_1:[1360,510],pointer:[1170,650],label:cosmic?[1160,210]:[960,140],quantity:[1320,880],item_1:cosmic?[1350,760]:[900,800],item_2:[350,800]};
  if(variant==='right') return {...positions,main:cosmic?[1290,500]:[1210,530],guide:[350,800],note_1:[480,360],pointer:[760,570],label:cosmic?[700,160]:[1050,180],quantity:[550,900],item_1:cosmic?[750,780]:[500,730],item_2:[1660,810]};
  return {...positions,main:cosmic?[900,520]:[960,550],label:cosmic?[1220,130]:[960,140],item_1:[470,580],item_2:[1490,720]};
}
export const CinematicScene: React.FC<{plan: ScenePlan}> = ({plan}) => {
  validateScenePlan(plan);
  const frame=useCurrentFrame(), {fps}=useVideoConfig();
  const duration=Math.round(plan.duration_sec*fps);
  const enter=spring({frame,fps,config:{damping:200},durationInFrames:24});
  const layout=scenePositions(plan);
  const body=plan.assets.map(asset => {
    const Component=components[asset.asset_id], [x,y]=layout[asset.slot];
    return <g key={asset.slot} transform={`translate(${x} ${y}) scale(${asset.slot.startsWith('item_')?.65:1})`} opacity={enter}><Component {...asset.props}/></g>;
  });
  return <AbsoluteFill style={{background:tokens.navy}}><svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{fontFamily:tokens.font}}><SpaceBackground/><ParticleField/>
    {plan.template_id==='cosmic_zoom' ? <><ZoomCamera duration={duration} center={layout.main}>{body.filter((_,i)=>plan.assets[i].slot==='main')}</ZoomCamera>{body.filter((_,i)=>plan.assets[i].slot!=='main')}</> : body}
    <path d="M 96 982 H 1824" stroke={tokens.ink} strokeOpacity=".12"/><path d={`M 96 982 H ${96+1728*Math.min(1,frame/Math.max(1,duration-1))}`} stroke={tokens.cyan} strokeWidth="3"/>
  </svg></AbsoluteFill>;
};
