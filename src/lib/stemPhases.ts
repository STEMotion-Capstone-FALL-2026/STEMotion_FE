import type { SceneData, StemPhase } from '../types/stem';

/**
 * The five activities of a STEM lesson in Công văn 3089/BGDĐT-GDTrH, in
 * order. Each scene may be tagged with the activity it serves, so a writer
 * and a reviewer can see whether a clip walks students through the lesson as
 * the team committed to at Review 1.
 */
export const STEM_PHASES: { id: StemPhase; label: string; short: string }[] = [
  { id: 'PROBLEM', label: '1. Xác định vấn đề', short: 'Vấn đề' },
  { id: 'RESEARCH', label: '2. Nghiên cứu kiến thức nền', short: 'Kiến thức' },
  { id: 'SOLUTION', label: '3. Đề xuất, lựa chọn giải pháp', short: 'Giải pháp' },
  { id: 'PROTOTYPE', label: '4. Chế tạo mẫu, thử nghiệm, đánh giá', short: 'Thử nghiệm' },
  { id: 'SHARE', label: '5. Chia sẻ, thảo luận, điều chỉnh', short: 'Chia sẻ' },
];

export const isStemPhase = (value: unknown): value is StemPhase =>
  typeof value === 'string' && STEM_PHASES.some((p) => p.id === value);

export const phaseLabel = (phase: StemPhase | undefined) => STEM_PHASES.find((p) => p.id === phase)?.short;

/**
 * Which activities a script covers, and whether the ones a short clip needs
 * (a problem to open, background knowledge, a closing share) are there.
 */
export const phaseCoverage = (scenes: SceneData[]) => {
  const covered = new Set(scenes.map((s) => s.stemPhase).filter(isStemPhase));
  const required: StemPhase[] = ['PROBLEM', 'RESEARCH', 'SHARE'];
  return {
    covered,
    missingRequired: required.filter((p) => !covered.has(p)),
    untagged: scenes.filter((s) => !isStemPhase(s.stemPhase)).length,
  };
};
