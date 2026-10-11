import React from 'react';
import {Series} from 'remotion';
import {CinematicScene} from './CinematicScene';
import type {ScenePlan} from './plan';
import {scenePlanToSceneData} from './plan';
export const cosmicPlan: ScenePlan = {template_id:'cosmic_zoom',duration_sec:30,narration:'Từ một điểm sáng nhỏ, hãy đổi góc nhìn để khám phá những thang đo của vũ trụ.',assets:[
  {asset_id:'glow_body',slot:'main',props:{color:'#53eed7',radius:155}},
  {asset_id:'label',slot:'label',props:{text:'MỘT THẾ GIỚI — NHIỀU THANG ĐO'}},
  {asset_id:'kinetic_number',slot:'quantity',props:{value:1000,suffix:' ×'}}]};
export const talkingPlan: ScenePlan = {template_id:'talking_diagram',duration_sec:15,narration:'Chuyển động của vệ tinh là kết quả của lực hấp dẫn và vận tốc của nó.',assets:[
  {asset_id:'glow_body',slot:'main',props:{color:'#9a87fa',radius:155,label:'Hệ quỹ đạo'}},
  {asset_id:'mascot',slot:'guide',props:{color:'#ff876d',pose:'point'}},
  {asset_id:'callout',slot:'note_1',props:{text:'Lực hấp dẫn giữ quỹ đạo'}},
  {asset_id:'arrow',slot:'pointer',props:{}},
  {asset_id:'label',slot:'label',props:{text:'VÌ SAO VỆ TINH KHÔNG RƠI?'}}]};
export const PhaseADemo: React.FC = () => <Series>{[{...cosmicPlan,duration_sec:15},talkingPlan].map((plan,i)=><Series.Sequence key={plan.template_id} durationInFrames={scenePlanToSceneData(plan,30,`phase-a-${i}`).durationInFrames}><CinematicScene plan={plan}/></Series.Sequence>)}</Series>;
