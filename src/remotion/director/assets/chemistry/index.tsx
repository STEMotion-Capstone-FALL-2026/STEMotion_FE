import React from 'react';
import {useCurrentFrame,useVideoConfig} from 'remotion';
import {tokens} from '../../tokens';
export interface ChemistryProps {color?:string;label?:string;protons?:number;electrons?:number;radius?:number;formula?:string;fill?:number;symbol?:string;atomicNumber?:number;elementName?:string;mass?:number}
export const Atom: React.FC<ChemistryProps> = ({color=tokens.cyan,label='',protons=6,electrons=6,radius=155}) => {
 const f=useCurrentFrame(),{fps}=useVideoConfig();
 return <g>{[0,60,120].map(a=><ellipse key={a} rx={radius} ry={radius*.4} transform={`rotate(${a})`} fill="none" stroke={color} strokeOpacity=".55" strokeWidth="3"/>)}<circle r="46" fill={tokens.coral}/><text textAnchor="middle" y="9" fill={tokens.navy} fontSize="27">{protons}+</text>{Array.from({length:electrons},(_,i)=>{const a=i/electrons*Math.PI*2+f/fps;return <circle key={i} cx={radius*Math.cos(a)} cy={radius*.72*Math.sin(a)} r="9" fill={tokens.gold}/>})}<text textAnchor="middle" y={radius+70} fill={tokens.ink} fontSize="30">{label}</text></g>;
};
export const Molecule: React.FC<ChemistryProps> = ({color=tokens.cyan,label='',formula='water'}) => {
 const atoms=formula==='water'?[[-100,65,'H'],[0,-35,'O'],[100,65,'H']]:formula==='carbon_dioxide'?[[-160,0,'O'],[0,0,'C'],[160,0,'O']]:[[-65,0,'O'],[65,0,'O']];
 return <g><g stroke={tokens.muted} strokeWidth="13">{atoms.slice(1).map((a,i)=><line key={i} x1={Number(atoms[i][0])} y1={Number(atoms[i][1])} x2={Number(a[0])} y2={Number(a[1])}/>)}</g>{atoms.map((a,i)=><g key={i} transform={`translate(${a[0]} ${a[1]})`}><circle r="46" fill={a[2]==='O'?tokens.coral:color}/><text textAnchor="middle" y="12" fill={tokens.navy} fontSize="34">{a[2]}</text></g>)}<text textAnchor="middle" y="175" fill={tokens.ink} fontSize="30">{label}</text></g>;
};
export const Flask: React.FC<ChemistryProps> = ({color=tokens.cyan,label='',fill=.5}) => {
 const f=useCurrentFrame(),id=React.useId();
 const shape='M -40 -170 H 40 V -55 L 140 160 Q 150 190 120 190 H -120 Q -150 190 -140 160 L -40 -55 Z';
 return <g><defs><clipPath id={id}><path d={shape}/></clipPath></defs><g clipPath={`url(#${id})`}><rect x="-160" y={190-360*fill} width="320" height="360" fill={color} opacity=".7"/>{Array.from({length:8},(_,i)=><circle key={i} cx={Math.sin(i*9)*65} cy={180-((f+i*31)%150)} r={4+i%4} fill={tokens.ink} opacity=".3"/>)}</g><path d={shape} fill="none" stroke={tokens.ink} strokeWidth="5"/><path d="M -55 -175 H 55" stroke={tokens.coral} strokeWidth="10"/><text textAnchor="middle" y="250" fill={tokens.ink} fontSize="30">{label}</text></g>;
};
export const ElementTile: React.FC<ChemistryProps> = ({color=tokens.violet,symbol='C',atomicNumber=6,elementName='',mass=12.011}) => <g><rect x="-125" y="-150" width="250" height="300" rx="24" fill={tokens.navy} stroke={color} strokeWidth="4"/><text x="-95" y="-105" fill={tokens.muted} fontSize="28">{atomicNumber}</text><text textAnchor="middle" y="15" fill={color} fontSize="100" fontWeight="bold">{symbol}</text><text textAnchor="middle" y="78" fill={tokens.ink} fontSize="27">{elementName}</text><text textAnchor="middle" y="122" fill={tokens.muted} fontSize="24">{mass}</text></g>;
