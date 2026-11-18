import { useEffect, useState } from 'react';

function isPhoneLike() {
  if (typeof window === 'undefined') return false;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const noHover = window.matchMedia('(hover: none)').matches;
  const shortSide = Math.min(window.innerWidth, window.innerHeight);
  return (coarse || noHover) && shortSide <= 820;
}

export function useLandscapeGate() {
  const [needsRotate, setNeedsRotate] = useState(false);

  useEffect(() => {
    const sync = () => {
      const portrait = window.matchMedia('(orientation: portrait)').matches
        || window.innerHeight > window.innerWidth;
      setNeedsRotate(isPhoneLike() && portrait);
    };
    sync();
    window.addEventListener('resize', sync);
    window.addEventListener('orientationchange', sync);
    const media = window.matchMedia('(orientation: portrait)');
    media.addEventListener?.('change', sync);

    const lock = async () => {
      try {
        const orientation = screen.orientation as ScreenOrientation & {
          lock?: (mode: string) => Promise<void>;
        };
        await orientation.lock?.('landscape');
      } catch {
        /* browsers often block lock outside fullscreen */
      }
    };
    void lock();

    return () => {
      window.removeEventListener('resize', sync);
      window.removeEventListener('orientationchange', sync);
      media.removeEventListener?.('change', sync);
    };
  }, []);

  return needsRotate;
}
