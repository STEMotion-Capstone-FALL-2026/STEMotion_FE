import React from 'react';
import {useCurrentFrame,useVideoConfig} from 'remotion';
import {tokens} from '../../tokens';
export interface PhysicsProps {color?:string;label?:string;radius?:number;angle?:number;magnitude?:number;amplitude?:number;period?:number;frequency?:number;wavelength?:number;focalLength?:number;eccentricity?:number}
export const ForceVector: React.FC<PhysicsProps> = ({color=tokens.coral,label='',angle=-25,magnitude=180}) => <g transform={`rotate(${angle})`}><circle r="38" fill={tokens.violet}/><path d={`M 0 0 H ${magnitude} M ${magnitude-25} -18 L ${magnitude} 0 L ${magnitude-25} 18`} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round"/><text x={magnitude/2} y="-35" fill={tokens.ink} fontSize="28" textAnchor="middle">{label}</text></g>;
export const OrbitPath: React.FC<PhysicsProps> = ({color=tokens.cyan,label='',radius=180,eccentricity=.45,period=6}) => {
 const f=useCurrentFrame(),{fps}=useVideoConfig(),a=f/fps/period*Math.PI*2,ry=radius*Math.sqrt(1-eccentricity*eccentricity);
 return <g><ellipse rx={radius} ry={ry} fill="none" stroke={color} strokeWidth="3" strokeDasharray="9 7"/><circle cx={-radius*eccentricity} r="55" fill={tokens.gold}/><circle cx={Math.cos(a)*radius} cy={Math.sin(a)*ry} r="18" fill={color}/><text textAnchor="middle" y={radius+60} fill={tokens.ink} fontSize="30">{label}</text></g>;
};
export const Pendulum: React.FC<PhysicsProps> = ({color=tokens.coral,label='',amplitude=30,period=3}) => {
 const f=useCurrentFrame(),{fps}=useVideoConfig(),angle=amplitude*Math.cos(f/fps/period*Math.PI*2);
 return <g><path d="M -120 -180 H 120" stroke={tokens.ink} strokeWidth="12"/><g transform={`translate(0 -180) rotate(${angle})`}><path d="M 0 0 V 310" stroke={tokens.muted} strokeWidth="5"/><circle cy="310" r="42" fill={color}/></g><text textAnchor="middle" y="255" fill={tokens.ink} fontSize="30">{label}</text></g>;
};
export const Lens: React.FC<PhysicsProps> = ({color=tokens.cyan,label='',focalLength=220}) => <g><path d="M 0 -160 Q 90 0 0 160 Q -90 0 0 -160" fill={color} fillOpacity=".25" stroke={color} strokeWidth="4"/><path d="M -300 0 H 320" stroke={tokens.muted} strokeDasharray="8 8"/><g stroke={tokens.gold} strokeWidth="3" fill="none">{[-90,0,90].map(y=><path key={y} d={`M -300 ${y} H 0 L ${focalLength} 0 L 300 ${-y*(300-focalLength)/focalLength}`}/>)}</g><circle cx={focalLength} r="7" fill={tokens.coral}/><text textAnchor="middle" y="230" fill={tokens.ink} fontSize="30">{label}</text></g>;
export const Wave: React.FC<PhysicsProps> = ({color=tokens.cyan,label='',amplitude=70,wavelength=180,frequency=.7}) => {
 const f=useCurrentFrame(),{fps}=useVideoConfig();
 const points=Array.from({length:151},(_,i)=>{const x=-300+i*4;return `${i?'L':'M'} ${x} ${amplitude*Math.sin(x/wavelength*Math.PI*2-f/fps*frequency*Math.PI*2)}`}).join(' ');
 return <g><path d="M -320 0 H 320" stroke={tokens.muted} opacity=".3"/><path d={points} stroke={color} strokeWidth="6" fill="none"/><text textAnchor="middle" y="170" fill={tokens.ink} fontSize="30">{label}</text></g>;
};
