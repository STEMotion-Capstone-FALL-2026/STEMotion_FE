import React, {useId} from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {noise2D} from '@remotion/noise';
import {tokens} from '../../tokens';

export interface AssetProps { color?: string; radius?: number; label?: string; text?: string; pose?: string; value?: number; suffix?: string }
export const SpaceBackground: React.FC = () => {
  const id=useId();
  return <><defs><radialGradient id={id}><stop stopColor="#203563"/><stop offset="1" stopColor={tokens.navy}/></radialGradient></defs><rect width="1920" height="1080" fill={`url(#${id})`}/><ellipse cx="1260" cy="290" rx="630" ry="250" fill={tokens.violet} opacity=".035" transform="rotate(-22 1260 290)"/></>;
};
/** Small SVG particle field avoids canvas readiness races in frame snapshots. */
export const ParticleField: React.FC = () => {
  const frame=useCurrentFrame();
  return <g>{Array.from({length:140},(_,i) => {
    const x=(noise2D('stemotion-x',i,0)+1)*960;
    const y=(noise2D('stemotion-y',i,0)+1)*540;
    return <circle key={i} cx={x+Math.sin(frame/210+i)*9} cy={y+Math.cos(frame/180+i)*6} r={i%7===0?2.5:1.2} fill={tokens.ink} opacity={.2+(noise2D('stemotion-opacity',i,frame/150)+1)*.18}/>;
  })}</g>;
};
export const ZoomCamera: React.FC<React.PropsWithChildren<{duration: number;center?:[number,number]}>> = ({duration,center=[960,520],children}) => {
  const frame=useCurrentFrame();
  const t=interpolate(frame,[0,duration*.2,duration*.8,duration-1],[0,0,1,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  const smooth=t*t*(3-2*t), scale=Math.exp(Math.log(.38)+(Math.log(3.5)-Math.log(.38))*smooth);
  return <g transform={`translate(${center[0]} ${center[1]}) scale(${scale}) translate(${-center[0]} ${-center[1]})`}>{children}</g>;
};
export const GlowBody: React.FC<AssetProps> = ({color=tokens.cyan,radius=155,label=''}) => {
  const id=useId();
  return <g><defs><radialGradient id={id}><stop stopColor={tokens.ink}/><stop offset=".16" stopColor={color}/><stop offset=".7" stopColor={color} stopOpacity=".75"/><stop offset="1" stopColor={color} stopOpacity="0"/></radialGradient></defs><circle r={radius*1.7} fill={`url(#${id})`} opacity=".2"/><circle r={radius} fill={color}/><path d={`M ${-radius*.7} ${-radius*.35} Q 0 ${-radius} ${radius*.65} ${-radius*.1}`} fill="none" stroke={tokens.ink} strokeWidth="12" opacity=".25"/><ellipse rx={radius*1.65} ry={radius*.4} fill="none" stroke={color} strokeWidth="3" opacity=".6" transform="rotate(-22)"/><circle cx={radius*1.5} cy={-radius*.55} r="13" fill={tokens.gold}/>{label && <text y={radius+70} textAnchor="middle" fill={tokens.ink} fontSize="32">{label}</text>}</g>;
};
/** Original floating prism mascot, with articulated antenna and pointing fin. */
export const Mascot: React.FC<AssetProps> = ({color=tokens.coral,pose='idle'}) => {
  const frame=useCurrentFrame();
  return <g transform={`translate(0 ${Math.sin(frame/20)*7})`}><ellipse cy="135" rx="100" ry="13" fill="#000" opacity=".2"/><path d="M 0 -110 L 85 -55 L 85 55 L 0 110 L -85 55 L -85 -55 Z" fill={color}/><path d="M 0 -110 L 0 110 L 85 55 L 85 -55 Z" fill="#15163a" opacity=".14"/><rect x="-55" y="-40" width="110" height="72" rx="28" fill={tokens.navy}/><circle cx="-23" cy="-7" r="9" fill={tokens.ink}/><circle cx="23" cy="-7" r="9" fill={tokens.ink}/><path d="M -14 15 Q 0 28 14 15" fill="none" stroke={tokens.cyan} strokeWidth="4"/><path d={pose==='point'?'M 82 10 L 170 -62 L 145 -70':'M 82 10 L 120 45'} stroke={color} strokeWidth="19" fill="none" strokeLinecap="round"/><path d="M 0 -110 L 0 -150" stroke={color} strokeWidth="8"/><circle cy="-158" r="12" fill={tokens.gold}/></g>;
};
export const Callout: React.FC<AssetProps> = ({text='',color=tokens.cyan}) => <g><rect x="-250" y="-52" width="500" height="104" rx="22" fill={tokens.navy} stroke={color} strokeWidth="2"/><text textAnchor="middle" y="12" fontSize="30" fill={tokens.ink}>{text}</text></g>;
export const Arrow: React.FC<AssetProps> = ({color=tokens.gold}) => <g fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"><path d="M -180 80 Q -100 -45 110 -30"/><path d="M 80 -55 L 110 -30 L 75 -5"/></g>;
export const Label: React.FC<AssetProps> = ({text='',color=tokens.ink}) => <text textAnchor="middle" fontSize="46" fill={color}>{text}</text>;
export const KineticNumber: React.FC<AssetProps> = ({value=1,suffix='',color=tokens.gold}) => {
  const frame=useCurrentFrame(), {fps}=useVideoConfig();
  const progress=spring({frame:Math.max(0,frame-15),fps,config:{damping:15,stiffness:80}});
  const count=Math.round(value*interpolate(frame,[15,70],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'}));
  return <text textAnchor="middle" fontSize="88" fontWeight="700" fill={color} transform={`scale(${Math.max(.01,progress)})`}>{count.toLocaleString('en-US')}{suffix}</text>;
};
