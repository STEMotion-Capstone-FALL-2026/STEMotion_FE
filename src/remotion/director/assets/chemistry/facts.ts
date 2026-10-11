/** Verified presets only; shell paths are a teaching model, not quantum trajectories. */
export const CARBON = {symbol:'C', atomicNumber:6, mass:12.011, name:'Carbon', shells:[2,4]} as const;
export const WATER = {formula:'H₂O', angleDegrees:104.5, name:'Water'} as const;
export function carbonElectrons(frame:number,fps:number,radius:number) {
 return CARBON.shells.flatMap((count,shell)=>Array.from({length:count},(_,i)=>{
  const r=radius*(shell===0?.48:1),angle=2*Math.PI*(i/count+frame/fps/(shell===0?4.5:6));
  return {shell,radius:r,x:r*Math.cos(angle),y:r*Math.sin(angle)};
 }));
}
export function waterGeometry(formula='water') {
 if(formula!=='water') throw new Error(`Unverified molecule preset: ${formula}`);
 const a=WATER.angleDegrees/2*Math.PI/180,length=150;
 return [{x:-length*Math.sin(a),y:length*Math.cos(a)-30,symbol:'H'},{x:0,y:-30,symbol:'O'},{x:length*Math.sin(a),y:length*Math.cos(a)-30,symbol:'H'}];
}
export function assertCarbon(props:{protons?:number;electrons?:number;symbol?:string;atomicNumber?:number;mass?:number;elementName?:string}) {
 for(const [key,value] of Object.entries({protons:6,electrons:6,symbol:'C',atomicNumber:6,mass:12.011,elementName:'Carbon'})) {
  const actual=props[key as keyof typeof props];
  if(actual!==undefined&&actual!==value) throw new Error(`Unverified carbon ${key}`);
 }
}
