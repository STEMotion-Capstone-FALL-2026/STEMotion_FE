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
import { ChemicalReaction } from './compositions/ChemicalReaction';
import { ComparisonSplit } from './compositions/ComparisonSplit';
import { ProcessTimeline } from './compositions/ProcessTimeline';
import { GeometrySpace } from './compositions/GeometrySpace';
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
        calculateMetadata={({ props }) => {
          const script = (props as any)?.script;
          const scenes = script?.scenes || [];
          const totalFrames = scenes.reduce(
            (acc: number, s: any) => acc + (Number(s?.durationInFrames) || 150),
            0
          );
          return {
            durationInFrames: Math.max(30, totalFrames || 1050),
          };
        }}
        defaultProps={{
          script: DEFAULT_SAMPLE_SCRIPT,
        }}
      />

      {/*
        The single-scene previews below pass one scene as defaultProps.
        That cast hides the prop type from Remotion, so each component is
        cast to match. The scenes stay strongly typed in FullSTEMVideo.
      */}
      <Composition
        id="TitleHero"
        component={TitleHeroReveal as unknown as React.FC<Record<string, unknown>>}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={DEFAULT_SAMPLE_SCRIPT.scenes[0] as any}
      />

      <Composition
        id="MathFormula"
        component={MathFormulaStep as unknown as React.FC<Record<string, unknown>>}
        durationInFrames={180}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={DEFAULT_SAMPLE_SCRIPT.scenes[1] as any}
      />

      <Composition
        id="DiagramExplainer"
        component={DiagramExplainer as unknown as React.FC<Record<string, unknown>>}
        durationInFrames={180}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={DEFAULT_SAMPLE_SCRIPT.scenes[2] as any}
      />

      <Composition
        id="DataChart"
        component={DataChartVisual as unknown as React.FC<Record<string, unknown>>}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={DEFAULT_SAMPLE_SCRIPT.scenes[3] as any}
      />

      <Composition
        id="AlgorithmWalkthrough"
        component={AlgorithmWalkthrough as unknown as React.FC<Record<string, unknown>>}
        durationInFrames={180}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={DEFAULT_SAMPLE_SCRIPT.scenes[4] as any}
      />

      <Composition
        id="STEMQuiz"
        component={STEMQuizCard as unknown as React.FC<Record<string, unknown>>}
        durationInFrames={180}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={DEFAULT_SAMPLE_SCRIPT.scenes[5] as any}
      />

      <Composition
        id="OutroCard"
        component={OutroCard as unknown as React.FC<Record<string, unknown>>}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={DEFAULT_SAMPLE_SCRIPT.scenes[6] as any}
      />

      <Composition
        id="ChemicalReaction"
        component={ChemicalReaction as unknown as React.FC<Record<string, unknown>>}
        durationInFrames={180}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          id: 'sc_chem_demo',
          type: 'CHEMICAL_REACTION',
          title: 'Phản ứng tổng hợp nước từ H2 và O2',
          equation: '2H_2 + O_2 \\xrightarrow{t^\\circ} 2H_2O',
          reactants: 'Khí Hydro (H2) + Khí Oxy (O2)',
          products: 'Nước (H2O)',
          condition: 'Đốt nóng (t° > 500°C)',
          observation: 'Phát nổ mạnh, tỏa nhiệt lớn, hơi nước ngưng tụ thành giọt.',
          flaskColor: '#38bdf8',
          narration: 'Khi kích hoạt phản ứng bằng tia lửa điện, hai thể tích Hydro kết hợp với một thể tích Oxy tạo thành nước.',
          durationInFrames: 180,
        }}
      />

      <Composition
        id="ComparisonSplit"
        component={ComparisonSplit as unknown as React.FC<Record<string, unknown>>}
        durationInFrames={180}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          id: 'sc_compare_demo',
          type: 'COMPARISON_SPLIT',
          title: 'So sánh Dòng điện DC và AC',
          topicA: {
            title: 'Dòng Một Chiều (DC)',
            badge: 'Direct Current',
            points: ['Dòng electron dịch chuyển 1 chiều', 'Điện áp ổn định theo thời gian', 'Nguồn: Pin, Ắc quy'],
            color: '#3b82f6',
          },
          topicB: {
            title: 'Dòng Xoay Chiều (AC)',
            badge: 'Alternating Current',
            points: ['Biến thiên điều hòa tuần hoàn', 'Dễ dàng tăng hạ áp qua biến áp', 'Truyền tải điện đi xa ít hao phí'],
            color: '#f59e0b',
          },
          conclusion: 'Dòng AC thích hợp cho truyền tải năng lượng, còn DC là nguồn cho vi mạch điện tử.',
          narration: 'Chúng ta cùng phân biệt hai loại dòng điện thông dụng trong đời sống kỹ thuật.',
          durationInFrames: 180,
        }}
      />

      <Composition
        id="ProcessTimeline"
        component={ProcessTimeline as unknown as React.FC<Record<string, unknown>>}
        durationInFrames={180}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          id: 'sc_timeline_demo',
          type: 'PROCESS_TIMELINE',
          title: 'Chu trình phân bào nguyên phân',
          processTitle: 'Các kỳ phân bào nguyên phân (Mitosis Stages)',
          stages: [
            { stageNumber: 1, title: 'Kỳ Đầu', description: 'NST kép co xoắn, màng nhân tiêu biến' },
            { stageNumber: 2, title: 'Kỳ Giữa', description: 'NST co xoắn cực đại, xếp 1 hàng ở xích đạo' },
            { stageNumber: 3, title: 'Kỳ Sau', description: 'Tách tại tâm động, NST phân ly về 2 cực' },
            { stageNumber: 4, title: 'Kỳ Cuối', description: 'Hình thành màng nhân mới, phân chia tế bào chất' },
          ],
          narration: 'Quá trình nguyên phân đảm bảo vật chất di truyền được sao chép nguyên vẹn qua các thế hệ tế bào.',
          durationInFrames: 180,
        }}
      />

      <Composition
        id="GeometrySpace"
        component={GeometrySpace as unknown as React.FC<Record<string, unknown>>}
        durationInFrames={180}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          id: 'sc_geom_demo',
          type: 'GEOMETRY_SPACE',
          title: 'Định lý Pytago trực quan',
          theoremName: 'Định Lý Pytago Trong Tam Giác Vuông',
          formulaLatex: 'a^2 + b^2 = c^2',
          dimensions: { a: 3, b: 4, c: 5 },
          explanation: 'Tổng diện tích hai hình vuông trên hai cạnh góc vuông bằng diện tích hình vuông trên cạnh huyền.',
          narration: 'Định lý Pytago là một trong những định lý nền tảng của hình học Euclid.',
          durationInFrames: 180,
        }}
      />
    </>
  );
};
