import React, { useRef, useState, useEffect } from 'react';
import { Player, PlayerRef } from '@remotion/player';
import { STEMScript, SceneData } from '../types/stem';
import { FullSTEMVideo } from '../remotion/compositions/FullSTEMVideo';
import { TitleHeroReveal } from '../remotion/compositions/TitleHeroReveal';
import { MathFormulaStep } from '../remotion/compositions/MathFormulaStep';
import { DiagramExplainer } from '../remotion/compositions/DiagramExplainer';
import { DataChartVisual } from '../remotion/compositions/DataChartVisual';
import { AlgorithmWalkthrough } from '../remotion/compositions/AlgorithmWalkthrough';
import { STEMQuizCard } from '../remotion/compositions/STEMQuizCard';
import { OutroCard } from '../remotion/compositions/OutroCard';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface RemotionPlayerWrapperProps {
  script: STEMScript;
  activeSceneId?: string;
  onSceneChange?: (sceneId: string) => void;
  seekTimestampSec?: number | null;
  onFrameUpdate?: (currentFrame: number, currentSec: number) => void;
}

export const RemotionPlayerWrapper: React.FC<RemotionPlayerWrapperProps> = ({
  script,
  activeSceneId,
  onSceneChange,
  seekTimestampSec,
  onFrameUpdate,
}) => {
  const playerRef = useRef<PlayerRef>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [viewMode, setViewMode] = useState<'FULL' | 'SINGLE'>('FULL');

  // Listen to frame update
  useEffect(() => {
    const current = playerRef.current;
    if (!current) return;

    const onFrame = () => {
      const frame = current.getCurrentFrame();
      setCurrentFrame(frame);
      if (onFrameUpdate) {
        onFrameUpdate(frame, frame / 30);
      }
    };

    const onPlayState = () => {
      setIsPlaying(current.isPlaying());
    };

    current.addEventListener('frameupdate', onFrame);
    current.addEventListener('play', onPlayState);
    current.addEventListener('pause', onPlayState);

    return () => {
      current.removeEventListener('frameupdate', onFrame);
      current.removeEventListener('play', onPlayState);
      current.removeEventListener('pause', onPlayState);
    };
  }, [onFrameUpdate]);

  // Handle external seek requests (e.g. from Reviewer comment click)
  useEffect(() => {
    if (seekTimestampSec !== undefined && seekTimestampSec !== null && playerRef.current) {
      const targetFrame = Math.round(seekTimestampSec * 30);
      playerRef.current.seekTo(targetFrame);
      playerRef.current.pause();
    }
  }, [seekTimestampSec]);

  // Calculate total frames
  const totalFrames = script.scenes.reduce((sum, sc) => sum + (sc.durationInFrames || 150), 0);
  const selectedScene = script.scenes.find((s) => s.id === activeSceneId) || script.scenes[0];

  const togglePlay = () => {
    if (!playerRef.current) return;
    if (playerRef.current.isPlaying()) {
      playerRef.current.pause();
      setIsPlaying(false);
    } else {
      playerRef.current.play();
      setIsPlaying(true);
    }
  };

  const restartVideo = () => {
    if (!playerRef.current) return;
    playerRef.current.seekTo(0);
    playerRef.current.play();
    setIsPlaying(true);
  };

  const formatTime = (frameNum: number) => {
    const totalSec = Math.floor(frameNum / 30);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Determine active single scene component
  const getSingleComponent = (scene: SceneData) => {
    switch (scene.type) {
      case 'TITLE_HERO':
        return TitleHeroReveal;
      case 'MATH_FORMULA':
        return MathFormulaStep;
      case 'DIAGRAM_EXPLAINER':
        return DiagramExplainer;
      case 'DATA_CHART':
        return DataChartVisual;
      case 'ALGORITHM_WALKTHROUGH':
        return AlgorithmWalkthrough;
      case 'STEM_QUIZ':
        return STEMQuizCard;
      case 'OUTRO':
        return OutroCard;
      default:
        return TitleHeroReveal;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
      {/* Player Top Bar */}
      <div className="px-5 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-mono font-bold text-slate-300 uppercase">
              REMOTION 4.0 LIVE PLAYER
            </span>
          </div>
          <span className="text-xs text-slate-500">•</span>
          <span className="text-xs text-slate-400 truncate max-w-md font-medium">
            {script.title}
          </span>
        </div>

        {/* Switch Full Video vs Single Scene Mode */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-900 p-0.5 rounded-lg border border-slate-800 flex items-center text-xs">
            <button
              onClick={() => setViewMode('FULL')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                viewMode === 'FULL'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Full Series ({Math.round(totalFrames / 30)}s)
            </button>
            <button
              onClick={() => setViewMode('SINGLE')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                viewMode === 'SINGLE'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Từng Scene ({selectedScene.type.replace('_', ' ')})
            </button>
          </div>
        </div>
      </div>

      {/* Main Remotion Player Canvas */}
      <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
        {viewMode === 'FULL' ? (
          <Player
            ref={playerRef}
            component={FullSTEMVideo}
            durationInFrames={totalFrames}
            compositionWidth={1920}
            compositionHeight={1080}
            fps={30}
            style={{
              width: '100%',
              height: '100%',
            }}
            inputProps={{ script }}
            controls={false}
            loop
          />
        ) : (
          <Player
            ref={playerRef}
            component={getSingleComponent(selectedScene) as any}
            durationInFrames={selectedScene.durationInFrames || 150}
            compositionWidth={1920}
            compositionHeight={1080}
            fps={30}
            style={{
              width: '100%',
              height: '100%',
            }}
            inputProps={selectedScene as any}
            controls={false}
            loop
          />
        )}
      </div>

      {/* Scene Navigation Quick-bar */}
      <div className="bg-slate-950/90 border-t border-slate-800 px-4 py-2 flex items-center gap-1.5 overflow-x-auto text-xs">
        <span className="text-slate-500 font-mono text-[11px] uppercase mr-1">Phân cảnh:</span>
        {script.scenes.map((sc, idx) => {
          const isActive = selectedScene.id === sc.id;
          return (
            <button
              key={sc.id}
              onClick={() => {
                if (onSceneChange) onSceneChange(sc.id);
                // In full mode, jump to start frame of that scene
                if (viewMode === 'FULL' && playerRef.current) {
                  let startFrame = 0;
                  for (let i = 0; i < idx; i++) {
                    startFrame += script.scenes[i].durationInFrames || 150;
                  }
                  playerRef.current.seekTo(startFrame);
                }
              }}
              className={`px-2.5 py-1 rounded-md font-mono whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-blue-600/30 text-blue-300 border border-blue-500/50 font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <span>{idx + 1}.</span>
              <span>{sc.type.replace('_', ' ')}</span>
              <span className="text-[10px] opacity-60">({Math.round((sc.durationInFrames || 150) / 30)}s)</span>
            </button>
          );
        })}
      </div>

      {/* Playback Control Bar */}
      <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 transition-transform active:scale-95"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
          </button>
          <button
            onClick={restartVideo}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
            title="Xem lại từ đầu"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Timecode */}
          <div className="font-mono text-xs text-slate-300 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="text-blue-400 font-bold">{formatTime(currentFrame)}</span>
            <span className="text-slate-600 mx-1.5">/</span>
            <span className="text-slate-400">
              {formatTime(viewMode === 'FULL' ? totalFrames : selectedScene.durationInFrames || 150)}
            </span>
            <span className="text-slate-600 ml-2 font-light text-[10px]">
              (f: {currentFrame})
            </span>
          </div>
        </div>

        {/* Timeline Slider / Progress */}
        <div className="flex-1 max-w-xl mx-4">
          <input
            type="range"
            min={0}
            max={viewMode === 'FULL' ? totalFrames : selectedScene.durationInFrames || 150}
            value={currentFrame}
            onChange={(e) => {
              const frame = parseInt(e.target.value, 10);
              if (playerRef.current) {
                playerRef.current.seekTo(frame);
              }
              setCurrentFrame(frame);
            }}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="px-2 py-1 bg-slate-900 rounded border border-slate-800 font-mono text-[11px]">
            1080p • 30fps
          </span>
        </div>
      </div>
    </div>
  );
};
