import React, { useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { captionAt, groupCaptionLines, isCaptionWords, type CaptionWord } from './cues';

/**
 * Lower-third captions for one scene, timed word by word from Whisper. The
 * word being spoken is highlighted. Renders nothing when the scene has no
 * aligned words (Whisper off, or the scene could not be aligned).
 */
export const CaptionTrack: React.FC<{ words?: CaptionWord[] }> = ({ words }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const lines = useMemo(() => (isCaptionWords(words) ? groupCaptionLines(words) : []), [words]);
  const cue = captionAt(lines, frame / fps);
  if (!cue) return null;

  return (
    <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'center', pointerEvents: 'none' }}>
      <div
        style={{
          marginBottom: 64,
          maxWidth: '78%',
          padding: '14px 28px',
          borderRadius: 18,
          background: 'rgba(15, 23, 42, 0.78)',
          color: '#F8FAFC',
          fontSize: 44,
          fontWeight: 600,
          lineHeight: 1.3,
          textAlign: 'center',
          letterSpacing: 0.2,
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
        }}
      >
        {cue.line.words.map((word, i) => (
          <span key={`${word.start}-${i}`} style={{ color: i === cue.activeIndex ? '#FDE047' : undefined }}>
            {i > 0 ? ' ' : ''}
            {word.text}
          </span>
        ))}
      </div>
    </AbsoluteFill>
  );
};
