'use client';

import React from 'react';
import { Audio, Series } from 'remotion';
import { STEMScript, SceneData } from '@/types/stem';
import { TitleHeroReveal } from './TitleHeroReveal';
import { MathFormulaStep } from './MathFormulaStep';
import { DiagramExplainer } from './DiagramExplainer';
import { DataChartVisual } from './DataChartVisual';
import { AlgorithmWalkthrough } from './AlgorithmWalkthrough';
import { STEMQuizCard } from './STEMQuizCard';
import { OutroCard } from './OutroCard';
import { ChemicalReaction } from './ChemicalReaction';
import { ComparisonSplit } from './ComparisonSplit';
import { ProcessTimeline } from './ProcessTimeline';
import { GeometrySpace } from './GeometrySpace';

export const renderSceneComponent = (scene: SceneData) => {
  switch (scene.type) {
    case 'TITLE_HERO':
      return <TitleHeroReveal {...scene} />;
    case 'MATH_FORMULA':
      return <MathFormulaStep {...scene} />;
    case 'DIAGRAM_EXPLAINER':
      return <DiagramExplainer {...scene} />;
    case 'DATA_CHART':
      return <DataChartVisual {...scene} />;
    case 'ALGORITHM_WALKTHROUGH':
      return <AlgorithmWalkthrough {...scene} />;
    case 'STEM_QUIZ':
      return <STEMQuizCard {...scene} />;
    case 'OUTRO':
      return <OutroCard {...scene} />;
    case 'CHEMICAL_REACTION':
      return <ChemicalReaction {...scene} />;
    case 'COMPARISON_SPLIT':
      return <ComparisonSplit {...scene} />;
    case 'PROCESS_TIMELINE':
      return <ProcessTimeline {...scene} />;
    case 'GEOMETRY_SPACE':
      return <GeometrySpace {...scene} />;
    default:
      return null;
  }
};

export class SceneErrorBoundary extends React.Component<
  { scene: SceneData; children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any) {
    console.warn('[FullSTEMVideo] Scene render fallback for:', this.props.scene.type, error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center text-white p-12 select-none">
          <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center max-w-xl shadow-2xl">
            <span className="text-xs font-mono text-indigo-400 font-bold uppercase tracking-wider block mb-2">
              {this.props.scene.type}
            </span>
            <h2 className="text-2xl font-bold text-slate-100 mb-3">{this.props.scene.title || 'Phân cảnh STEM'}</h2>
            <p className="text-sm text-slate-400 leading-relaxed">{this.props.scene.narration || 'Nội dung kiến thức phân cảnh.'}</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export const FullSTEMVideo: React.FC<{ script: STEMScript }> = ({ script }) => {
  return (
    <Series>
      {script.scenes.map((scene) => {
        // The render service attaches this after generating TTS narration.
        // It is absent in the browser Player, where the clip stays silent.
        const narrationUrl = (scene as SceneData & { narrationAudioUrl?: string })
          .narrationAudioUrl;

        return (
          <Series.Sequence
            key={scene.id}
            durationInFrames={scene.durationInFrames || 150}
          >
            <SceneErrorBoundary scene={scene}>
              {renderSceneComponent(scene)}
            </SceneErrorBoundary>
            {narrationUrl && <Audio src={narrationUrl} />}
          </Series.Sequence>
        );
      })}
    </Series>
  );
};
