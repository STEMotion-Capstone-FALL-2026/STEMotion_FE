export type SystemRole = 'ADMIN' | 'USER';
export type WorkspaceRole = 'producer' | 'reviewer' | 'writer';
export type AppView = WorkspaceRole | 'admin' | 'library' | 'dashboard';

export type STEMSubject = 'Math' | 'Physics' | 'Chemistry' | 'Biology' | 'ComputerScience';

export type SceneType =
  | 'TITLE_HERO'
  | 'MATH_FORMULA'
  | 'DIAGRAM_EXPLAINER'
  | 'DATA_CHART'
  | 'ALGORITHM_WALKTHROUGH'
  | 'STEM_QUIZ'
  | 'OUTRO'
  | 'CHEMICAL_REACTION'
  | 'COMPARISON_SPLIT'
  | 'PROCESS_TIMELINE'
  | 'GEOMETRY_SPACE'
  | 'ILLUSTRATED_EXPLAINER'
  | 'COMPOSED';

export type STEMTemplateType = SceneType;

export type LegoTheme =
  | 'default'
  | 'dark'
  | 'contrast'
  | 'glass'
  | 'light'
  | 'emerald'
  | 'cyan'
  | 'purple'
  | 'amber'
  | 'blue'
  | 'rose'
  | 'slate';

export interface LegoComponentLayout {
  /** Horizontal offset in 1920x1080 canvas pixels */
  dx?: number;
  /** Vertical offset in 1920x1080 canvas pixels */
  dy?: number;
  /** Horizontal scale multiplier (default 1) */
  scaleX?: number;
  /** Vertical scale multiplier (default 1) */
  scaleY?: number;
  /** Uniform scale multiplier (default 1) */
  scale?: number;
  /** Per-component font size override (px) */
  fontSize?: number;
  /** Per-component theme/color style override */
  theme?: LegoTheme;
  /** Hide/show toggle for this specific Lego piece */
  hidden?: boolean;
  /** Z-index stacking order */
  zIndex?: number;
}

export interface SceneBase {
  id: string;
  /** Optional additive director plan; legacy scenes keep their existing renderer. */
  visualPlan?: import('../remotion/director/plan').ScenePlan;
  /**
   * URL of the generated Vietnamese narration. Set by the render service after
   * TTS; absent in the browser Player, where the preview stays silent.
   */
  narrationAudioUrl?: string;
  /** Whisper-aligned words of the narration, seconds from the scene start (set by the render worker). */
  captionWords?: { text: string; start: number; end: number }[];
  type: SceneType;
  title: string;
  narration: string;
  durationInFrames: number; // 30fps default
  customFontSize?: number;
  fontSizeScale?: 'normal' | 'large' | 'huge';
  cardScale?: number; // 0.8 to 1.5 scale factor for inner component box
  cardTheme?: 'dark' | 'contrast' | 'glass' | 'light' | 'emerald' | 'cyan' | 'purple' | 'amber';
  cardWidth?: 'compact' | 'standard' | 'wide' | 'full';
  /** Per-component Lego layout, position, scale, theme & visibility overrides */
  componentLayouts?: Record<string, LegoComponentLayout>;
  /** Extra freeform Lego blocks added onto any template scene */
  extraBlocks?: ComposedBlock[];
}

export interface TitleHeroProps extends SceneBase {
  type: 'TITLE_HERO';
  subtitle: string;
  subject: STEMSubject;
  gradeLevel: string;
  badgeText: string;
}

export interface MathFormulaProps extends SceneBase {
  type: 'MATH_FORMULA';
  latex: string;
  steps: {
    label: string;
    latexSnippet: string;
    explanation: string;
  }[];
}

export interface DiagramExplainerProps extends SceneBase {
  type: 'DIAGRAM_EXPLAINER';
  diagramTitle: string;
  labels: {
    name: string;
    description: string;
    xPercent: number;
    yPercent: number;
  }[];
  svgType?: 'pendulum' | 'atom' | 'circuit' | 'cell';
}

export interface DataChartProps extends SceneBase {
  type: 'DATA_CHART';
  chartType: 'bar' | 'line';
  xAxisLabel: string;
  yAxisLabel: string;
  dataPoints: {
    label: string;
    value: number;
    color?: string;
  }[];
}

export interface AlgorithmWalkthroughProps extends SceneBase {
  type: 'ALGORITHM_WALKTHROUGH';
  language: string;
  codeSnippet: string;
  layoutSplit?: 'equal' | 'code-heavy' | 'memory-heavy';
  steps: {
    lineHighlight: number;
    variableState: string;
    note: string;
  }[];
}

export interface STEMQuizProps extends SceneBase {
  type: 'STEM_QUIZ';
  question: string;
  options: string[];
  correctIndex: number;
  hint: string;
  explanation: string;
}

export interface OutroProps extends SceneBase {
  type: 'OUTRO';
  summaryPoints: string[];
  nextLessonSuggestion: string;
  instructorName: string;
}

export interface ChemicalReactionProps extends SceneBase {
  type: 'CHEMICAL_REACTION';
  equation: string;
  reactants: string;
  products: string;
  condition: string;
  observation: string;
  flaskColor?: string;
}

export interface ComparisonSplitProps extends SceneBase {
  type: 'COMPARISON_SPLIT';
  topicA: {
    title: string;
    badge: string;
    points: string[];
    color?: string;
  };
  topicB: {
    title: string;
    badge: string;
    points: string[];
    color?: string;
  };
  conclusion: string;
  fontSizeScale?: 'normal' | 'large' | 'huge';
  customFontSize?: number;
}

export interface ProcessTimelineProps extends SceneBase {
  type: 'PROCESS_TIMELINE';
  processTitle: string;
  stages: {
    stageNumber: number;
    title: string;
    description: string;
    badge?: string;
  }[];
}

export interface GeometrySpaceProps extends SceneBase {
  type: 'GEOMETRY_SPACE';
  shapeType: 'pythagoras_triangle' | 'cone_3d' | 'circle_trig';
  theoremName: string;
  formulaLatex: string;
  dimensions: {
    a: number;
    b: number;
    c: number;
  };
  explanation: string;
}

export type FlatAmbience = 'space' | 'cell' | 'lab' | 'ocean' | 'lilac' | 'sky';
/**
 * exchange: the first icon hands the third icon (or a spark) over to the second, again and again;
 * zoom: each icon is one level deeper than the last, and the camera dives from one into the next.
 */
export type FlatLayout = 'focus' | 'row' | 'cluster' | 'swarm' | 'exchange' | 'zoom';
/** minimal: one colour field and a few specks; rich: adds drifting shapes. */
export type FlatDetail = 'minimal' | 'rich';

export interface IllustratedIcon {
  /** A name from the approved STEM icon set (src/remotion/flat/stemIcons.ts). */
  name: string;
  label?: string;
}

/** Flat-design explainer: a few icons composed as an illustration. */
export interface IllustratedExplainerProps extends SceneBase {
  type: 'ILLUSTRATED_EXPLAINER';
  headline: string;
  caption?: string;
  ambience: FlatAmbience;
  layout: FlatLayout;
  detail?: FlatDetail;
  icons: IllustratedIcon[];
}

/**
 * A scene assembled from blocks instead of a fixed template. The AI or the
 * producer picks a frame (how the screen is divided), puts blocks into its
 * slots and ties each block's entrance to a word of the narration. See
 * src/remotion/composed/.
 */
export type ComposedFrame = 'center' | 'split' | 'thirds' | 'grid' | 'sidebar';
export type ComposedSlot =
  | 'top' | 'main' | 'bottom' | 'left' | 'right' | 'middle' | 'tl' | 'tr' | 'bl' | 'br' | 'side';
export type ComposedBlockKind =
  | 'title' | 'text' | 'list' | 'formula' | 'icon' | 'icons' | 'number'
  | 'chart' | 'choice' | 'arrow' | 'highlight' | 'guide';
export type ComposedMotion = 'pop' | 'rise' | 'slide' | 'draw' | 'type' | 'count';
export type ComposedEmphasis = 'none' | 'pulse' | 'float' | 'shake';
export type ComposedTone = 'default' | 'accent' | 'good' | 'bad';

export interface ComposedBlock {
  id: string;
  kind: ComposedBlockKind;
  /** Where the block sits; arrows and highlights are overlays and take none. */
  slot?: ComposedSlot;
  /** title, text, guide speech, number label, arrow label. */
  text?: string;
  items?: string[];
  latex?: string;
  icon?: IllustratedIcon;
  icons?: IllustratedIcon[];
  value?: number;
  unit?: string;
  points?: { label: string; value: number }[];
  question?: string;
  options?: string[];
  answer?: number;
  /** arrow: from and to block ids; highlight: target in `to`. */
  from?: string;
  to?: string;
  pose?: 'idle' | 'point';
  /** Words of the narration that cue the block: appear, leave, reveal the answer, cross out. */
  at?: string;
  until?: string;
  revealAt?: string;
  strikeAt?: string;
  motion?: ComposedMotion;
  emphasis?: ComposedEmphasis;
  tone?: ComposedTone;
  /** Optional custom freeform rect on the 1920x1080 canvas (overrides slot rect when dragged/resized) */
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  scale?: number;
  fontSize?: number;
  hidden?: boolean;
}

export interface ComposedProps extends SceneBase {
  type: 'COMPOSED';
  frame: ComposedFrame;
  ambience?: FlatAmbience;
  blocks: ComposedBlock[];
}

export type SceneData =
  | TitleHeroProps
  | MathFormulaProps
  | DiagramExplainerProps
  | DataChartProps
  | AlgorithmWalkthroughProps
  | STEMQuizProps
  | OutroProps
  | ChemicalReactionProps
  | ComparisonSplitProps
  | ProcessTimelineProps
  | GeometrySpaceProps
  | IllustratedExplainerProps
  | ComposedProps;

export type STEMScene = SceneData;

export interface STEMScript {
  id: string;
  /** The workspace (subject department) the clip belongs to; it fixes the clip's visual theme. */
  workspaceId?: string;
  title: string;
  subject: STEMSubject;
  gradeLevel: string;
  totalDurationSeconds?: number;
  scriptStatus: 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'CHANGE_REQUESTED';
  videoStatus?: 'NOT_RENDERED' | 'RENDERING' | 'IN_QA' | 'APPROVED' | 'PUBLISHED';
  fps?: number;
  videoUrl?: string | null;
  visualTheme?: string | null;
  scenes: SceneData[];
  createdAt?: string;
  draftRevision?: number;
  reviewComments?: FeedbackComment[];
  version?: string;
  /** Read-only backend version number; never a ScriptVersion UUID. */
  currentVersionNo?: number;
  reviewNote?: string;
  estimatedDurationSeconds?: number;
  targetAudience?: string;
  sceneCount?: number;
  ownerName?: string;
}

export interface FeedbackComment {
  id: string;
  author: string;
  avatar: string;
  role: 'Writer' | 'Reviewer' | 'Producer' | 'Admin';
  timestampSec: number;
  sceneId?: string;
  content: string;
  status: 'OPEN' | 'RESOLVED';
  createdAt: string;
  clipId?: string | null;
  parentId?: string | null;
  resolvedByName?: string | null;
  resolvedAt?: string | null;
  replies?: FeedbackComment[];
}

export type ReviewComment = FeedbackComment;

export interface WorkspaceMember {
  id: string;
  userId?: string;
  name: string;
  email: string;
  role: 'Trưởng bộ môn (Admin)' | 'Writer (Biên kịch)' | 'Reviewer (Chuyên gia)' | 'Producer (Dựng video)' | AppView | string;
  avatar?: string;
  status: 'ACTIVE' | 'INACTIVE';
  isLeader: boolean;
}

export interface Workspace {
  id: string;
  name: string;
  department: string;
  membersCount: number;
  activeProjects: number;
  myRole?: WorkspaceRole;
  isLeader?: boolean;
}


// ==========================================
// STEM Track - Phase 4 Studio & Reviewer Types
// Aligned with CONTRACT_DELTA.md (P3)
// ==========================================

export interface ContextEntry {
  key: 'IN_CLASS_SCREEN' | 'GROUP_PRACTICE';
  condition?: string | null;
  adaptations?: string | null;
}

export interface UsageContext {
  primary: ContextEntry | null;
  secondary: ContextEntry[];
}

export interface StemObjective {
  key: string;
  outcomeId?: string | null;
  learnerAction?: string | null;
  observableEvidence?: string | null;
}

export interface StudentTask {
  key: string;
  learnerAction?: string | null;
  teacherSupport?: string | null;
  materials?: string | null;
  safety?: string | null;
  assessmentEvidence?: string | null;
  executionContextKey?: string | null;
}

export interface StemContribution {
  component: 'S' | 'T' | 'E' | 'M';
  explanation?: string | null;
  objectiveKeys: string[];
  taskKeys: string[];
}

export interface StemEvidence {
  id?: string | null;
  sceneId?: string | null;
  taskKey?: string | null;
  objectiveKey?: string | null;
  component: 'S' | 'T' | 'E' | 'M';
  explanation?: string | null;
}

export interface StemValidationFinding {
  ruleId: string;
  field: string;
  severity: 'ERROR' | 'WARN' | 'INFO' | string;
  message: string;
  basis?: string;
}

export interface LegacySuggestion {
  primaryKey?: string | null;
  channelKeys: string[];
  requiresConfirmation: boolean;
  reason: string;
}

export interface LessonStep {
  stepKey: string;
  sceneIds: string[];
  activityKey?: string | null;
  objectiveKeys: string[];
}

export interface StemBrief {
  policyVersionId?: string | null;
  topicVersionId?: string | null;
  gradeKey?: string | null;
  subjectKeys: string[];
  outcomeIds: string[];
  scopeOfClip?: string | null;
  context: UsageContext;
  distributionChannels: string[];
  objectives: StemObjective[];
  studentTasks: StudentTask[];
  contributions: StemContribution[];
  steps?: LessonStep[];
  safetyNotes?: string | null;
  rawLegacy?: string | null;
}

export interface StemCreateRequest {
  schemaVersion: 'stem.v1';
  expectedScriptRevision: number;
  idempotencyKey: string;
}

export interface StemSaveRequest {
  schemaVersion: 'stem.v1';
  baseRevision: number;
  expectedScriptRevision: number;
  idempotencyKey: string;
  brief: StemBrief;
  evidence: StemEvidence[];
}

export interface StemValidateRequest {
  expectedBriefRevision: number;
  expectedScriptRevision: number;
  phase: 'SCRIPT' | 'VIDEO';
  expectedCompositionRevision?: number | null;
}

export interface StemChangeTarget {
  expectedVersionId: string;
  expectedScriptRevision: number;
  expectedBriefRevision: number;
  idempotencyKey: string;
}

export interface StemCriterion {
  key: string;
  judgment: 'ADEQUATE' | 'NEEDS_CHANGES' | 'NOT_ASSESSED' | 'NOT_APPLICABLE';
  rationale: string;
  evidenceIds: string[];
}

export interface StemAssessment {
  expectedBriefRevision: number;
  expectedScriptRevision: number;
  expectedCompositionRevision?: number | null;
  expectedModeRevision: number;
  rubricVersionId?: string | null;
  criteria: StemCriterion[];
  idempotencyKey: string;
  expectedFingerprint?: string | null;
}

export interface StemViewResponse {
  schemaVersion: string;
  briefId?: string | null;
  scriptVersionId: string;
  revision: number;
  verificationStatus: 'UNVERIFIED' | string;
  readiness: 'INCOMPLETE' | 'READY_FOR_REVIEW' | 'NEEDS_REVIEW' | 'LEGACY_UNMAPPED' | string;
  effectiveMode: 'OFF' | 'ADVISORY' | 'STRICT' | string;
  modeRevision: number;
  brief: StemBrief | null;
  evidence: StemEvidence[];
  findings: StemValidationFinding[];
  legacySuggestion?: LegacySuggestion | null;
  scriptFingerprint?: string | null;
  compositionFingerprint?: string | null;
}

/** Client name deliberately distinguishes workspace mode CAS from a brief revision. */
export interface WorkspaceStemSettings {
  workspaceId: string;
  modeRevision: number;
  mode: 'OFF' | 'ADVISORY' | 'STRICT';
  policyVersionIds: string[];
  defaultPolicyVersionId: string | null;
}
export interface WorkspaceStemSettingsRequest {
  modeRevision: number;
  mode: 'OFF' | 'ADVISORY' | 'STRICT';
  policyVersionIds: string[];
  defaultPolicyVersionId?: string | null;
  idempotencyKey: string;
  baseRevision?: number;
  legacyModeSelection?: 'OFF' | 'ADVISORY' | 'STRICT' | null;
}
/** Exact P3 wire response. Do not confuse revision with brief/script revision. */
export interface WorkspaceStemSettingsWire {
  workspaceId: string;
  revision: number;
  mode: 'OFF' | 'ADVISORY' | 'STRICT';
  policyIds: string[];
  defaultPolicyId: string | null;
}
export interface StemTarget {
  versionId: string;
  scriptRevision: number;
  workspaceId: string;
  versionNo: number;
}

export interface CatalogVersionEntry {
  id: string;
  kind: 'TOPIC' | 'TOPIC_VERSION' | 'SOURCE_EDITION' | 'OUTCOME' | 'PROFILE' | 'POLICY' | 'RUBRIC' | string;
  logicalKey: string;
  version: number;
  parentId?: string | null;
  sourceId?: string | null;
  status: 'DRAFT' | string;
  data: Record<string, any>;
  revision: number;
  verificationStatus: 'UNVERIFIED' | string;
}

/** P5 server-owned technical state; CURRENT never implies expert verification. */
export interface StemArtifactStatus {
  schemaVersion: 'stem-artifact.v1';
  target: {projectId:string;versionId:string;compositionRevision?:number|null;clipId?:string;jobId?:string;snapshotId?:string;inputHash?:string};
  freshness: 'CURRENT'|'NEEDS_REVIEW'|string;
  classification: 'CLASSIFIED'|'UNKNOWN';
  integrity: 'MATCH'|'MISMATCH'|'UNKNOWN';
  publishEligibility: {allowed:boolean;route:'CURRENT'|'LEGACY_UNVERIFIED'|'BLOCKED';requiresLegacyAcknowledgement:boolean};
  snapshotOrigin: {snapshotId?:string;capturedMode?:string;effectiveMode?:string};
  verificationStatus: 'UNVERIFIED'|'LEGACY_UNMAPPED';
  reasons: string[];
}
export interface StemArtifactExpectation {clipId:string;jobId:string;snapshotId:string;inputHash:string}
export interface GroundedAiTarget {
  scriptVersionId: string; expectedScriptRevision: number; expectedBriefRevision: number; expectedModeRevision: number;
}
export interface GroundedAiResult {
  operation: 'generate'|'resegment'|'grade'|'extract'|'terms'; result: unknown; model: string; requestId?: string;
  grounding: {schemaVersion: 'stem-ai.v1'; contextDigest: string; target: GroundedAiTarget; verificationStatus: 'UNVERIFIED'; profile: string; objectiveKeys: string[]; activityKeys: string[]; warnings: unknown[]};
}
