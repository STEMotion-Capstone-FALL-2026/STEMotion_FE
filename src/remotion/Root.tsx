import React from 'react';
import { Composition } from 'remotion';
import { FullSTEMVideo } from './compositions/FullSTEMVideo';
import { TitleHeroReveal } from './compositions/TitleHeroReveal';
import { MathFormulaStep } from './compositions/MathFormulaStep';
import { DiagramExplainer } from './compositions/DiagramExplainer';
import { DataChartVisual } from './compositions/DataChartVisual';
import { AlgorithmWalkthrough } from './compositions/AlgorithmWalkthrough';
import { STEMQuizCard } from './compositions/STEMQuizCard';
import { OutroCard } from './compositions/OutroCard';
import { DEFAULT_SAMPLE_SCRIPT } from '../lib/sampleData';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="FullSTEMVideo"
        component={FullSTEMVideo}
        durationInFrames={1050}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          script: DEFAULT_SAMPLE_SCRIPT,
        }}
      />

      <Composition
        id="TitleHero"
        component={TitleHeroReveal}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={DEFAULT_SAMPLE_SCRIPT.scenes[0] as any}
      />

      <Composition
        id="MathFormula"
        component={MathFormulaStep}
        durationInFrames={180}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={DEFAULT_SAMPLE_SCRIPT.scenes[1] as any}
      />

      <Composition
        id="DiagramExplainer"
        component={DiagramExplainer}
        durationInFrames={180}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={DEFAULT_SAMPLE_SCRIPT.scenes[2] as any}
      />

      <Composition
        id="DataChart"
        component={DataChartVisual}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={DEFAULT_SAMPLE_SCRIPT.scenes[3] as any}
      />

      <Composition
        id="AlgorithmWalkthrough"
        component={AlgorithmWalkthrough}
        durationInFrames={180}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={DEFAULT_SAMPLE_SCRIPT.scenes[4] as any}
      />

      <Composition
        id="STEMQuiz"
        component={STEMQuizCard}
        durationInFrames={180}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={DEFAULT_SAMPLE_SCRIPT.scenes[5] as any}
      />

      <Composition
        id="OutroCard"
        component={OutroCard}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={DEFAULT_SAMPLE_SCRIPT.scenes[6] as any}
      />
    </>
  );
};
