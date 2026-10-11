import React from 'react';
import {useCurrentFrame,useVideoConfig} from 'remotion';
import {tokens} from '../../tokens';
import {CARBON,WATER,assertCarbon,carbonElectrons,waterGeometry} from './facts';
export interface ChemistryProps {color?:string;label?:string;protons?:number;electrons?:number;radius?:number;formula?:string;fill?:number;symbol?:string;atomicNumber?:number;elementName?:string;mass?:number}
export const Atom: React.FC<ChemistryProps> = ({color=tokens.cyan,label='',protons=6,electrons=6,radius=155}) => {
 const f=useCurrentFrame(),{fps}=useVideoConfig();assertCarbon({protons,electrons});
 return <g>{[.48,1].map(scale=><circle key={scale} r={radius*scale} fill="none" stroke={color} strokeOpacity=".55" strokeWidth="3"/>)}<circle r="40" fill={tokens.coral}/><text textAnchor="middle" y="9" fill={tokens.navy} fontSize="27">{CARBON.atomicNumber}+</text>{carbonElectrons(f,fps,radius).map((e,i)=><circle key={i} cx={e.x} cy={e.y} r="9" fill={tokens.gold}/>)}<text textAnchor="middle" y={radius+70} fill={tokens.ink} fontSize="30">{label}</text></g>;
};
export const Molecule: React.FC<ChemistryProps> = ({color=tokens.cyan,label='',formula='water'}) => {
 const atoms=waterGeometry(formula),caption=label.replace(/H2O/g,WATER.formula);
 return <g><g stroke={tokens.muted} strokeWidth="13">{[0,2].map(i=><line key={i} x1={atoms[1].x} y1={atoms[1].y} x2={atoms[i].x} y2={atoms[i].y}/>)}</g>{atoms.map((a,i)=><g key={i} transform={`translate(${a.x} ${a.y})`}><circle r="36" fill={a.symbol==='O'?tokens.coral:color}/><text textAnchor="middle" y="12" fill={tokens.navy} fontSize="34">{a.symbol}</text></g>)}<text textAnchor="middle" y="45" fill={tokens.gold} fontSize="24">{WATER.angleDegrees}°</text><text textAnchor="middle" y="175" fill={tokens.ink} fontSize="30">{caption||WATER.formula}</text></g>;
};
export const Flask: React.FC<ChemistryProps> = ({color=tokens.cyan,label='',fill=.5}) => {
 const f=useCurrentFrame(),id=React.useId();
 const shape='M -40 -170 H 40 V -55 L 140 160 Q 150 190 120 190 H -120 Q -150 190 -140 160 L -40 -55 Z';
 return <g><defs><clipPath id={id}><path d={shape}/></clipPath></defs><g clipPath={`url(#${id})`}><rect x="-160" y={190-360*fill} width="320" height="360" fill={color} opacity=".7"/>{Array.from({length:8},(_,i)=><circle key={i} cx={Math.sin(i*9)*65} cy={180-((f+i*31)%150)} r={4+i%4} fill={tokens.ink} opacity=".3"/>)}</g><path d={shape} fill="none" stroke={tokens.ink} strokeWidth="5"/><path d="M -55 -175 H 55" stroke={tokens.coral} strokeWidth="10"/><text textAnchor="middle" y="250" fill={tokens.ink} fontSize="30">{label}</text></g>;
};
export const ElementTile: React.FC<ChemistryProps> = ({color=tokens.violet,...props}) => {
 assertCarbon(props);
 return <g><rect x="-125" y="-150" width="250" height="300" rx="24" fill={tokens.navy} stroke={color} strokeWidth="4"/><text x="-95" y="-105" fill={tokens.muted} fontSize="28">{CARBON.atomicNumber}</text><text textAnchor="middle" y="15" fill={color} fontSize="100" fontWeight="bold">{CARBON.symbol}</text><text textAnchor="middle" y="78" fill={tokens.ink} fontSize="27">{CARBON.name}</text><text textAnchor="middle" y="122" fill={tokens.muted} fontSize="24">{CARBON.mass}</text></g>;
};
