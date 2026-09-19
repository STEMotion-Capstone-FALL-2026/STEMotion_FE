export type STEMSubject = 'Math' | 'Physics' | 'Chemistry' | 'Biology' | 'ComputerScience';

export type SceneType =
  | 'TITLE_HERO'
  | 'MATH_FORMULA'
  | 'DIAGRAM_EXPLAINER'
  | 'DATA_CHART'
  | 'ALGORITHM_WALKTHROUGH'
  | 'STEM_QUIZ'
  | 'OUTRO';

export interface SceneBase {
  id: string;
  type: SceneType;
  title: string;
  narration: string;
  durationInFrames: number; // 30fps default
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

export type SceneData =
  | TitleHeroProps
  | MathFormulaProps
  | DiagramExplainerProps
  | DataChartProps
  | AlgorithmWalkthroughProps
  | STEMQuizProps
  | OutroProps;

export interface STEMScript {
  id: string;
  title: string;
  subject: STEMSubject;
  gradeLevel: string;
  totalDurationSeconds: number;
  scriptStatus: 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED';
  videoStatus: 'NOT_RENDERED' | 'RENDERING' | 'IN_QA' | 'APPROVED' | 'PUBLISHED';
  fps: number;
  scenes: SceneData[];
  createdAt: string;
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
