import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Player, PlayerRef } from '@remotion/player';
import { Audio } from 'remotion';
import { STEMScript, SceneData } from '../types/stem';
import { FullSTEMVideo, SceneErrorBoundary, renderSceneComponent, SafeAudio } from '../remotion/compositions/FullSTEMVideo';
import { SceneSeedContext, VideoSeedContext } from '../remotion/flat/variation';
import { Play, Pause, RotateCcw, Sparkles, Maximize, Minimize, Volume2, VolumeX, AlertTriangle } from 'lucide-react';
import { CanvaInteractiveOverlay } from './CanvaInteractiveOverlay';

const SingleSceneRenderer: React.FC<{ scene: SceneData; workspaceId?: string }> = ({ scene, workspaceId }) => {
  const narrationUrl = (scene as any).narrationAudioUrl;

  return (
    <VideoSeedContext.Provider value={workspaceId || ''}>
      <SceneErrorBoundary scene={scene}>
        <SceneSeedContext.Provider value={scene.id}>
          {renderSceneComponent(scene)}
        </SceneSeedContext.Provider>
        {narrationUrl && <SafeAudio src={narrationUrl} />}
      </SceneErrorBoundary>
    </VideoSeedContext.Provider>
  );
};

interface RemotionPlayerWrapperProps {
  script: STEMScript;
  activeSceneId?: string;
  onSceneChange?: (sceneId: string) => void;
  seekTimestampSec?: number | null;
  onFrameUpdate?: (currentFrame: number, currentSec: number) => void;
  updateSceneProperty?: (updater: (s: any) => any) => void;
  activeLegoPieceId?: string | null;
  onSelectLegoPiece?: (pieceId: string | null) => void;
  disabled?: boolean;
}

export const RemotionPlayerWrapper: React.FC<RemotionPlayerWrapperProps> = ({
  script,
  activeSceneId,
  onSceneChange,
  seekTimestampSec,
  onFrameUpdate,
  updateSceneProperty,
  activeLegoPieceId,
  onSelectLegoPiece,
  disabled = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<PlayerRef>(null);
  const canvasStageRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCanvaModeEnabled, setIsCanvaModeEnabled] = useState(true);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [viewMode, setViewMode] = useState<'FULL' | 'SINGLE'>('FULL');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const toggleMute = () => {
    if (!playerRef.current) return;
    if (isMuted) {
      playerRef.current.unmute();
      setIsMuted(false);
    } else {
      playerRef.current.mute();
      setIsMuted(true);
    }
  };

  // Lắng nghe sự kiện Fullscreen của trình duyệt
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch((err) => {
        console.warn('Lỗi kích hoạt toàn màn hình:', err);
      });
    } else {
      document.exitFullscreen?.().catch((err) => {
        console.warn('Lỗi thoát toàn màn hình:', err);
      });
    }
  };

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
  const selectedSceneIndex = Math.max(
    0,
    script.scenes.findIndex((s) => s.id === activeSceneId)
  );
  const selectedScene = script.scenes[selectedSceneIndex] || script.scenes[0];

  const getSettledFrameForScene = (sceneIndex: number, mode: 'FULL' | 'SINGLE') => {
    const sc = script.scenes[sceneIndex] || script.scenes[0];
    const dur = sc?.durationInFrames || 150;
    const settledLocal = Math.min(Math.max(0, dur - 5), Math.max(60, Math.round(dur * 0.65)));
    if (mode === 'SINGLE') {
      return settledLocal;
    }
    let startFrame = 0;
    for (let i = 0; i < sceneIndex; i++) {
      startFrame += script.scenes[i].durationInFrames || 150;
    }
    return startFrame + settledLocal;
  };

  const togglePlay = () => {
    if (!playerRef.current) return;
    if (playerRef.current.isPlaying()) {
      playerRef.current.pause();
      setIsPlaying(false);
    } else {
      const maxFrames = viewMode === 'FULL' ? totalFrames : (selectedScene?.durationInFrames || 150);
      if (currentFrame >= maxFrames - 1) {
        playerRef.current.seekTo(0);
        setCurrentFrame(0);
      }
      try {
        const playResult: any = playerRef.current.play();
        if (playResult && typeof playResult.catch === 'function') {
          playResult.catch((err: any) => {
            console.warn('[RemotionPlayerWrapper] play() rejected:', err);
            setIsPlaying(false);
          });
        }
        setIsPlaying(true);
      } catch (err) {
        console.warn('[RemotionPlayerWrapper] play() threw error:', err);
        setIsPlaying(false);
      }
    }
  };

  const restartVideo = () => {
    if (!playerRef.current) return;
    playerRef.current.seekTo(0);
    setCurrentFrame(0);
    try {
      const playResult: any = playerRef.current.play();
      if (playResult && typeof playResult.catch === 'function') {
        playResult.catch((err: any) => {
          console.warn('[RemotionPlayerWrapper] restart play rejected:', err);
          setIsPlaying(false);
        });
      }
      setIsPlaying(true);
    } catch (err) {
      console.warn('[RemotionPlayerWrapper] restart play threw error:', err);
      setIsPlaying(false);
    }
  };

  const renderPlayerErrorFallback = (errorProps: { error: Error }) => (
    <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white select-none">
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 max-w-md shadow-2xl">
        <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <h4 className="font-bold text-slate-200 text-sm mb-1">Không thể phát hoạt cảnh này</h4>
        <p className="text-xs text-slate-400 mb-4">{errorProps.error?.message || 'Có lỗi xảy ra khi dựng phân cảnh'}</p>
        <button
          type="button"
          onClick={() => {
            if (playerRef.current) {
              playerRef.current.seekTo(0);
              setCurrentFrame(0);
            }
          }}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold text-white transition-all cursor-pointer"
        >
          Phát lại từ đầu
        </button>
      </div>
    </div>
  );

  const formatTime = (frameNum: number) => {
    const totalSec = Math.floor(frameNum / 30);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const fullInputProps = useMemo(() => ({ script }), [script]);
  const singleInputProps = useMemo(
    () => ({ scene: selectedScene, workspaceId: script.workspaceId }),
    [selectedScene, script.workspaceId]
  );

  // Seek player to active scene's settled frame when switching mode or scene so all Lego blocks are visible
  useEffect(() => {
    if (playerRef.current) {
      const targetFrame = getSettledFrameForScene(selectedSceneIndex, viewMode);
      playerRef.current.pause();
      playerRef.current.seekTo(targetFrame);
      setCurrentFrame(targetFrame);
      setIsPlaying(false);
    }
  }, [viewMode, activeSceneId]);

  return (
    <div
      ref={containerRef}
      className={`transition-all ${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-black flex flex-col justify-between'
          : 'bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col'
      }`}
    >
      {/* Player Top Bar */}
      <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
            <span className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-tight">
              REMOTION 4.0
            </span>
          </div>
          <span
            className="text-xs text-slate-400 truncate min-w-0 flex-1 font-medium"
            title={script.title}
          >
            {script.title}
          </span>
          <span className="hidden xl:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 shrink-0 whitespace-nowrap">
            <Volume2 className="w-3 h-3 text-emerald-400 shrink-0" />
            <span>Voiceover: BẬT</span>
          </span>
        </div>

        {/* Switch Full Video vs Single Scene Mode & Canva Mode */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Nút Bật/Tắt chế độ tương tác Canva WYSIWYG */}
          {updateSceneProperty && (
            <button
              type="button"
              onClick={() => setIsCanvaModeEnabled(!isCanvaModeEnabled)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1.5 transition-all border shrink-0 whitespace-nowrap cursor-pointer ${
                isCanvaModeEnabled
                  ? 'bg-blue-600/20 text-blue-400 border-blue-500/50 shadow-xs'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
              title="Click trực tiếp lên video để sửa chữ, chỉnh cỡ như Canva"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>Canva Mode: {isCanvaModeEnabled ? 'BẬT' : 'TẮT'}</span>
            </button>
          )}

          <div className="bg-slate-900 p-0.5 rounded-lg border border-slate-800 flex items-center text-[11px] shrink-0 whitespace-nowrap">
            <button
              type="button"
              onClick={() => setViewMode('FULL')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all whitespace-nowrap cursor-pointer ${
                viewMode === 'FULL'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Full Series ({Math.round(totalFrames / 30)}s)
            </button>
            <button
              type="button"
              onClick={() => setViewMode('SINGLE')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all whitespace-nowrap cursor-pointer ${
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
      <div
        ref={canvasStageRef}
        className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden"
      >
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
            inputProps={fullInputProps}
            controls={false}
            loop={false}
            errorFallback={renderPlayerErrorFallback}
          />
        ) : (
          <Player
            ref={playerRef}
            component={SingleSceneRenderer}
            durationInFrames={selectedScene.durationInFrames || 150}
            compositionWidth={1920}
            compositionHeight={1080}
            fps={30}
            style={{
              width: '100%',
              height: '100%',
            }}
            inputProps={singleInputProps}
            controls={false}
            loop={false}
            errorFallback={renderPlayerErrorFallback}
          />
        )}

        {/* Lớp Tương Tác Trực Tiếp Canva / Lego WYSIWYG phủ lên Canvas */}
        {isCanvaModeEnabled && updateSceneProperty && (
          <CanvaInteractiveOverlay
            scene={selectedScene}
            updateSceneProperty={updateSceneProperty}
            isPlaying={isPlaying}
            currentFrame={currentFrame}
            stageContainerRef={canvasStageRef}
            activeLegoPieceId={activeLegoPieceId}
            onSelectLegoPiece={onSelectLegoPiece}
            disabled={disabled}
            onPauseVideo={() => {
              if (playerRef.current?.isPlaying()) {
                playerRef.current.pause();
                setIsPlaying(false);
              }
            }}
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
                if (playerRef.current) {
                  const target = getSettledFrameForScene(idx, viewMode);
                  playerRef.current.pause();
                  playerRef.current.seekTo(target);
                  setCurrentFrame(target);
                  setIsPlaying(false);
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
      <div className="px-4 py-3 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={togglePlay}
            className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 transition-transform active:scale-95 shrink-0 cursor-pointer"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>
          <button
            type="button"
            onClick={restartVideo}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
            title="Xem lại từ đầu"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={toggleMute}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
            title={isMuted ? 'Bật âm thanh thuyết minh (Unmute)' : 'Tắt âm thanh (Mute)'}
          >
            {isMuted ? (
              <VolumeX className="w-3.5 h-3.5 text-rose-400" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            )}
          </button>

          {/* Timecode */}
          <div className="font-mono text-xs text-slate-300 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 whitespace-nowrap shrink-0">
            <span className="text-blue-400 font-bold">{formatTime(currentFrame)}</span>
            <span className="text-slate-600 mx-1">/</span>
            <span className="text-slate-400">
              {formatTime(viewMode === 'FULL' ? totalFrames : selectedScene.durationInFrames || 150)}
            </span>
            <span className="text-slate-600 ml-1.5 font-light text-[10px] hidden sm:inline">
              (f: {currentFrame})
            </span>
          </div>
        </div>

        {/* Timeline Slider / Progress */}
        <div className="flex-1 min-w-[100px] mx-1">
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

        <div className="flex items-center gap-2 text-xs text-slate-400 shrink-0 whitespace-nowrap">
          <span className="px-2 py-1 bg-slate-900 rounded border border-slate-800 font-mono text-[11px] hidden xl:inline-block">
            1080p • 30fps
          </span>
          <button
            type="button"
            onClick={handleToggleFullscreen}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg border border-slate-700 font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer whitespace-nowrap"
            title={isFullscreen ? 'Thu nhỏ màn hình (Esc)' : 'Phóng to toàn màn hình'}
          >
            {isFullscreen ? <Minimize className="w-3.5 h-3.5 text-blue-400 shrink-0" /> : <Maximize className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
            <span>{isFullscreen ? 'Thu Nhỏ' : 'Toàn Màn Hình'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
