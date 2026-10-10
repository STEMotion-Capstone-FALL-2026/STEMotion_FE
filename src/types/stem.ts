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
  | 'ILLUSTRATED_EXPLAINER';

export type STEMTemplateType = SceneType;

export interface SceneBase {
  id: string;
  /**
   * URL of the generated Vietnamese narration. Set by the render service after
   * TTS; absent in the browser Player, where the preview stays silent.
   */
  narrationAudioUrl?: string;
  type: SceneType;
  title: string;
  narration: string;
  durationInFrames: number; // 30fps default
  customFontSize?: number;
  fontSizeScale?: 'normal' | 'large' | 'huge';
  cardScale?: number; // 0.8 to 1.5 scale factor for inner component box
  cardTheme?: 'dark' | 'contrast' | 'glass' | 'light' | 'emerald' | 'cyan' | 'purple' | 'amber';
  cardWidth?: 'compact' | 'standard' | 'wide' | 'full';
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
export type FlatLayout = 'focus' | 'row' | 'cluster' | 'swarm';
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
  | IllustratedExplainerProps;

export type STEMScene = SceneData;

export interface STEMScript {
  id: string;
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
  estimatedDurationSeconds?: number;
  targetAudience?: string;
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
  name: string;
  email: string;
  role: 'Trưởng bộ môn (Admin)' | 'Writer (Biên kịch)' | 'Reviewer (Chuyên gia)' | 'Producer (Dựng video)';
  avatar: string;
  status: 'ACTIVE' | 'INVITED';
}

export interface Workspace {
  id: string;
  name: string;
  department: string;
  membersCount: number;
  activeProjects: number;
}
