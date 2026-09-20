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
  | 'GEOMETRY_SPACE';

export type STEMTemplateType = SceneType;

export interface SceneBase {
  id: string;
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
  | GeometrySpaceProps;

export type STEMScene = SceneData;

export interface STEMScript {
  id: string;
  title: string;
  subject: STEMSubject;
  gradeLevel: string;
  totalDurationSeconds?: number;
  scriptStatus: 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'CHANGE_REQUESTED';
  videoStatus?: 'NOT_RENDERED' | 'RENDERING' | 'IN_QA' | 'APPROVED' | 'PUBLISHED';
  fps?: number;
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
