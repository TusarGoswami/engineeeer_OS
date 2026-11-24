/**
 * BB-8 Animated Theme Toggle
 * Original design: https://uiverse.io/Galahhad/silent-robin-40 by Galahhad (MIT License)
 * Adapted for EngineerOS by integrating with the existing ThemeContext.
 *
 * Drop-in replacement for the previous Sun/Moon ThemeToggle.
 * API is fully backward-compatible: same named + default export, same props.
 */
import { useTheme } from '../context/ThemeContext.jsx';

/**
 * @param {Object}  props
 * @param {string}  [props.className]   - Extra wrapper classes (ignored for sizing; BB-8 has fixed proportions)
 * @param {boolean} [props.showLabel]   - Unused (kept for API compat)
 * @param {string}  [props.size]        - 'sm' | 'md' | 'lg'  — scales the whole toggle
 */
export const ThemeToggle = ({ className = '', showLabel: _sl, size = 'md' }) => {
  const { isDark, toggleTheme } = useTheme();

  const label = isDark
    ? 'Switch to light theme (Day Mode)'
    : 'Switch to dark theme (Night Mode)';

  // Scale factors for sm / md / lg
  const scale = size === 'sm' ? 0.62 : size === 'lg' ? 0.95 : 0.78;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      aria-pressed={isDark}
      className={`bb8-toggle-btn${className ? ` ${className}` : ''}`}
      style={{ '--bb8-scale': scale }}
    >
      {/* ── Scenery wrapper — switches class when dark ── */}
      <div className={`bb8-toggle${isDark ? ' bb8-toggle--dark' : ''}`}>

        {/* Sky / background */}
        <div className="bb8-toggle__sky">
          {/* Stars (visible in dark mode) */}
          <div className="bb8-toggle__star bb8-toggle__star--1" />
          <div className="bb8-toggle__star bb8-toggle__star--2" />
          <div className="bb8-toggle__star bb8-toggle__star--3" />
          <div className="bb8-toggle__star bb8-toggle__star--4" />
          <div className="bb8-toggle__star bb8-toggle__star--5" />
          <div className="bb8-toggle__star bb8-toggle__star--6" />
          <div className="bb8-toggle__star bb8-toggle__star--7" />

          {/* Clouds (visible in light mode) */}
          <div className="bb8-toggle__cloud bb8-toggle__cloud--1" />
          <div className="bb8-toggle__cloud bb8-toggle__cloud--2" />
          <div className="bb8-toggle__cloud bb8-toggle__cloud--3" />
        </div>

        {/* Ground / terrain strip */}
        <div className="bb8-toggle__ground" />

        {/* ── BB-8 Droid ── */}
        <div className={`bb8${isDark ? ' bb8--night' : ''}`}>
          {/* Head */}
          <div className="bb8__head-container">
            <div className="bb8__head">
              <div className="bb8__head-stripe bb8__head-stripe--1" />
              <div className="bb8__head-stripe bb8__head-stripe--2" />
              <div className="bb8__eye bb8__eye--1">
                <div className="bb8__eye-pupil" />
              </div>
              <div className="bb8__eye bb8__eye--2" />
              <div className="bb8__antenna bb8__antenna--1" />
              <div className="bb8__antenna bb8__antenna--2" />
            </div>
          </div>

          {/* Body */}
          <div className="bb8__body">
            {/* Orange stripe segments */}
            <div className="bb8__body-panel bb8__body-panel--1" />
            <div className="bb8__body-panel bb8__body-panel--2" />
            <div className="bb8__body-panel bb8__body-panel--3" />
            {/* Equatorial band */}
            <div className="bb8__body-band" />
            {/* Body details */}
            <div className="bb8__body-dot bb8__body-dot--1" />
            <div className="bb8__body-dot bb8__body-dot--2" />
            <div className="bb8__body-dot bb8__body-dot--3" />
          </div>

          {/* Shadow under body */}
          <div className="bb8__shadow" />
        </div>
      </div>
    </button>
  );
};

export default ThemeToggle;
