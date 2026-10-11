import registry from './registry.json';
import type { SceneData } from '../../types/stem';

export type AssetId = keyof typeof registry.assets;
export type TemplateId = keyof typeof registry.templates;
export interface ScenePlan {
  template_id: TemplateId;
  assets: {asset_id: AssetId; slot: string; props: Record<string, string | number>}[];
  narration: string;
  duration_sec: number;
}
export interface DirectorPlan { scenes: ScenePlan[] }
export { registry };
const object = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v);
const own = (o: object, k: string) => Object.prototype.hasOwnProperty.call(o, k);
function keys(v: Record<string, unknown>, allowed: string[]) {
  if (Object.keys(v).some(k => !allowed.includes(k))) throw new Error('Unexpected plan property');
}
export function validateScenePlan(value: unknown): asserts value is ScenePlan {
  if (!object(value)) throw new Error('Expected scene object');
  keys(value, ['template_id','assets','narration','duration_sec']);
  if (typeof value.template_id !== 'string' || !own(registry.templates, value.template_id)) throw new Error('Unknown template_id');
  if (typeof value.narration !== 'string' || value.narration.length > 6000) throw new Error('Invalid narration');
  if (typeof value.duration_sec !== 'number' || !Number.isFinite(value.duration_sec) || value.duration_sec < 1 || value.duration_sec > 120) throw new Error('duration_sec must be 1–120');
  if (!Array.isArray(value.assets) || value.assets.length < 1 || value.assets.length > 8) throw new Error('Expected 1–8 assets');
  const slots = registry.templates[value.template_id as TemplateId].slots as Record<string, string[]>;
  const used = new Set<string>();
  for (const asset of value.assets) {
    if (!object(asset)) throw new Error('Invalid asset');
    keys(asset, ['asset_id','slot','props']);
    if (typeof asset.asset_id !== 'string' || !own(registry.assets, asset.asset_id)) throw new Error('Unknown asset_id');
    if (typeof asset.slot !== 'string' || !own(slots, asset.slot) || !slots[asset.slot].includes(asset.asset_id) || used.has(asset.slot)) throw new Error('Invalid or duplicate slot');
    used.add(asset.slot);
    if (!object(asset.props)) throw new Error('Expected props object');
    const schema = registry.assets[asset.asset_id as AssetId].propsSchema.properties as Record<string, {type:string; maxLength?:number; pattern?:string; enum?:string[]; minimum?:number; maximum?:number}>;
    keys(asset.props, Object.keys(schema));
    for (const [key, val] of Object.entries(asset.props)) {
      const rule = schema[key];
      if (rule.type === 'string' && (typeof val !== 'string' || val.length > (rule.maxLength ?? Infinity) || (rule.pattern && !new RegExp(rule.pattern).test(val)) || (rule.enum && !rule.enum.includes(val)))) throw new Error('Invalid asset string');
      if (rule.type === 'number' && (typeof val !== 'number' || !Number.isFinite(val) || val < (rule.minimum ?? -Infinity) || val > (rule.maximum ?? Infinity))) throw new Error('Invalid asset number');
    }
  }
  if (!used.has('main')) throw new Error('main slot is required');
}
/** Keep seconds at the director boundary; only this adapter calculates frames. */
export function scenePlanToSceneData(value: unknown, fps: number, id: string): SceneData {
  validateScenePlan(value);
  if (![30,60].includes(fps)) throw new Error('Unsupported FPS');
  if (!id) throw new Error('Stable scene ID is required');
  return {id, type:'ILLUSTRATED_EXPLAINER', title:value.template_id, narration:value.narration,
    durationInFrames:Math.round(value.duration_sec * fps), headline:value.template_id, icons:[{name:'planet'}],
    ambience:'space', layout:'focus', visualPlan:structuredClone(value)};
}
