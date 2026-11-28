import { useEffect, useRef, useState } from 'react';

let cachedWelcomeMascotPromise = null;

function loadWelcomeMascotBundle() {
  if (!cachedWelcomeMascotPromise) {
    cachedWelcomeMascotPromise = Promise.all([
      import('lottie-web/build/player/esm/lottie_light.min.js'),
      import('../../../assets/dashboard-welcome-mascot.json'),
    ]).then(([lottieModule, animationModule]) => ({
      lottie: lottieModule?.default || lottieModule,
      animationData: animationModule?.default || animationModule,
    }));
  }
  return cachedWelcomeMascotPromise;
}

/**
 * Animated waving mascot (`deneme2`) positioned alongside the Dashboard welcome header.
 */
export function DashboardWelcomeMascot({ className = '' }) {
  const containerRef = useRef(null);
  const animationRef = useRef(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    const containerEl = containerRef.current;
    let activeAnim = null;
    let handleError = null;

    const initAnimation = async () => {
      try {
        const { lottie, animationData } = await loadWelcomeMascotBundle();
        if (isCancelled || !containerEl || !lottie?.loadAnimation) {
          return;
        }

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

        handleError = () => {
          if (!isCancelled) {
            setHasError(true);
          }
        };

        anim?.addEventListener?.('data_failed', handleError);
      } catch {
        if (!isCancelled) {
          setHasError(true);
        }
      }
    };

    initAnimation();

    return () => {
      isCancelled = true;
      if (activeAnim && handleError) {
        activeAnim.removeEventListener?.('data_failed', handleError);
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

  if (hasError) return null;

  return (
    <div
      data-testid="dashboard-welcome-mascot"
      aria-label="Welcome mascot animation"
      role="img"
      className={`relative w-[84px] h-[96px] sm:w-[116px] sm:h-[132px] lg:w-[132px] lg:h-[150px] bg-transparent border-0 flex items-center justify-center shrink-0 overflow-visible select-none ${className}`}
    >
      <div
        ref={containerRef}
        className="w-full h-full flex items-center justify-center transform-gpu scale-[1.15] origin-center [&_svg]:w-full [&_svg]:h-full [&_svg]:block"
        aria-hidden="true"
      />
    </div>
  );
}

export default DashboardWelcomeMascot;

