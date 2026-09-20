'use client';

import React from 'react';
import { Series } from 'remotion';
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

export const FullSTEMVideo: React.FC<{ script: STEMScript }> = ({ script }) => {
  return (
    <Series>
      {script.scenes.map((scene) => (
        <Series.Sequence
          key={scene.id}
          durationInFrames={scene.durationInFrames || 150}
        >
          {renderSceneComponent(scene)}
        </Series.Sequence>
      ))}
    </Series>
  );
};
