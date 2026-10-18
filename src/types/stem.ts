export type UserRole = 'producer' | 'reviewer' | 'writer' | 'admin' | 'library';

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
  scenes: SceneData[];
  createdAt?: string;
  reviewComments?: FeedbackComment[];
  version?: string;
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
}

export type ReviewComment = FeedbackComment;

export interface WorkspaceMember {
  id: string;
  userId?: string;
  name: string;
  email: string;
  role: 'Trưởng bộ môn (Admin)' | 'Writer (Biên kịch)' | 'Reviewer (Chuyên gia)' | 'Producer (Dựng video)' | UserRole | string;
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
  myRole?: UserRole;
  isLeader?: boolean;
}
