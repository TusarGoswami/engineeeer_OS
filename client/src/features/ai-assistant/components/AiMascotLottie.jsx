import { useEffect, useRef, useState } from 'react';
import { Bot } from 'lucide-react';

// Cached single dynamic load so navigation across routes never re-fetches/re-parses
let cachedMascotBundlePromise = null;

function loadMascotBundle() {
  if (!cachedMascotBundlePromise) {
    cachedMascotBundlePromise = Promise.all([
      import('lottie-web/build/player/esm/lottie_light.min.js'),
      import('../../../assets/ai-robot-mascot.json'),
    ]).then(([lottieModule, animationModule]) => ({
      lottie: lottieModule?.default || lottieModule,
      animationData: animationModule?.default || animationModule,
    }));
  }
  return cachedMascotBundlePromise;
}

/**
 * Compact header Lottie mascot (`robot-alt-happy`) with non-blocking module load,
 * single-instance lifecycle management, unmount cleanup, and graceful icon fallback.
 */
export function AiMascotLottie({ className = '' }) {
  const containerRef = useRef(null);
  const animationRef = useRef(null);
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'error'

  useEffect(() => {
    let isCancelled = false;
    const containerEl = containerRef.current;
    let activeAnim = null;
    let handleLoaded = null;
    let handleError = null;

    const initAnimation = async () => {
      try {
        const { lottie, animationData } = await loadMascotBundle();
        if (isCancelled || !containerEl || !lottie?.loadAnimation) {
          return;
        }

        // Prevent duplicate SVG instances during StrictMode remounts
        if (animationRef.current) {
          animationRef.current.destroy?.();
          animationRef.current = null;
        }
        containerEl.innerHTML = '';

        const anim = lottie.loadAnimation({
          container: containerEl,
          renderer: 'svg',
          loop: true,
          autoplay: true,
          animationData,
          rendererSettings: {
            preserveAspectRatio: 'xMidYMid meet',
            progressiveLoad: false,
          },
        });

        activeAnim = anim;
        animationRef.current = anim;

        handleLoaded = () => {
          if (!isCancelled) {
            setStatus('ready');
          }
        };

        handleError = () => {
          if (!isCancelled) {
            setStatus('error');
          }
        };

        anim?.addEventListener?.('DOMLoaded', handleLoaded);
        anim?.addEventListener?.('data_failed', handleError);

        // If DOMLoaded already fired synchronously on inline SVG load, mark ready cleanly
        if (containerEl.querySelector('svg')) {
          setStatus('ready');
        }
      } catch {
        if (!isCancelled) {
          setStatus('error');
        }
      }
    };

    initAnimation();

    return () => {
      isCancelled = true;
      if (activeAnim) {
        if (handleLoaded) activeAnim.removeEventListener?.('DOMLoaded', handleLoaded);
        if (handleError) activeAnim.removeEventListener?.('data_failed', handleError);
      }
      if (animationRef.current) {
        animationRef.current.destroy?.();
        animationRef.current = null;
      }
      if (containerEl) {
        containerEl.innerHTML = '';
      }
    };
  }, []);

  return (
    <div
      data-testid="ai-assistant-mascot"
      data-status={status}
      aria-label="AI Academic Assistant mascot"
      role="img"
      className={`relative w-12 h-12 sm:w-14 sm:h-14 lg:w-[60px] lg:h-[60px] bg-transparent border-0 text-brand-700 flex items-center justify-center shrink-0 overflow-visible select-none ${className}`}
    >
      {status === 'error' ? (
        <Bot className="w-6 h-6" data-testid="ai-mascot-fallback" aria-hidden="true" />
      ) : (
        <div
          ref={containerRef}
          className="w-full h-full flex items-center justify-center transform-gpu scale-[1.42] translate-y-[4%] origin-center [&_svg]:w-full [&_svg]:h-full [&_svg]:block"
          aria-hidden="true"
        />
      )}
    </div>
  );
}

export default AiMascotLottie;
