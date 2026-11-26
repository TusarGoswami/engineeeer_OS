import { Link } from 'react-router-dom';

/**
 * Unified EngineerOS brand logo (glowing E emblem + EngineerOS wordmark).
 */
export const BrandLogo = ({
  to = '/',
  size = 'md',
  subtitle = '',
  className = '',
  asLink = true,
}) => {
  const iconSizes = {
    sm: 'h-7 w-7',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-[15px]',
    lg: 'text-xl',
  };

  const content = (
    <>
      <img
        src="/favicon.png"
        alt="EngineerOS"
        className={`${iconSizes[size] || iconSizes.md} rounded-full shrink-0 shadow-xs ring-1 ring-brand-500/30 object-cover transition-transform duration-150 group-hover:scale-105`}
      />
      <div className="leading-tight">
        <span
          className={`font-display font-bold tracking-tight text-surface-100 block ${
            textSizes[size] || textSizes.md
          }`}
        >
          Engineer<span className="text-brand-500">OS</span>
        </span>
        {subtitle && (
          <span className="block text-[10px] text-surface-400 font-mono tracking-wide">
            {subtitle}
          </span>
        )}
      </div>
    </>
  );

  if (!asLink) {
    return (
      <div className={`inline-flex items-center gap-2.5 group select-none ${className}`}>
        {content}
      </div>
    );
  }

  return (
    <Link
      to={to}
      className={`inline-flex items-center gap-2.5 group select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 rounded-lg pr-1 ${className}`}
    >
      {content}
    </Link>
  );
};

export default BrandLogo;
