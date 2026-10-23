import { useState } from 'react';
import { useReducedMotion } from '../hooks/useMotion';

interface BackgroundVideoProps {
  src: string; // file inside frontend/public, e.g. "/videos/hero.mp4"
  poster?: string;
  className?: string;
}

// Muted, looping decorative video. Hides itself if the file is missing,
// and does not autoplay for visitors who prefer reduced motion.
export default function BackgroundVideo({ src, poster, className = '' }: BackgroundVideoProps) {
  const reduced = useReducedMotion();
  const [failed, setFailed] = useState(false);
  if (failed) return null;

  return (
    <video
      className={className}
      src={src}
      poster={poster}
      autoPlay={!reduced}
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden="true"
      tabIndex={-1}
      onError={() => setFailed(true)}
    />
  );
}
