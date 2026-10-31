import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Code2, GraduationCap, Brain, ShieldAlert, Users, MessageSquareCode, User, Settings, ArrowRight, X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

export const CommandPalette = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const commands = useMemo(
    () => [
      { id: 'dash', title: 'Dashboard', category: 'Navigation', icon: Code2, path: '/' },
      { id: 'coding', title: 'Coding Problems & DSA', category: 'Navigation', icon: Code2, path: '/coding' },
      { id: 'gate', title: 'GATE Preparation Hub', category: 'Navigation', icon: Brain, path: '/gate' },
      { id: 'academics', title: 'Academic Hub & Syllabus', category: 'Navigation', icon: GraduationCap, path: '/academics' },
      { id: 'ai', title: 'AI Academic Assistant', category: 'Navigation', icon: Brain, path: '/ai-assistant' },
      { id: 'interviews', title: 'Mock Interviews', category: 'Navigation', icon: MessageSquareCode, path: '/interviews' },
      { id: 'assessments', title: 'Proctored Assessments', category: 'Navigation', icon: ShieldAlert, path: '/assessments' },
      { id: 'community', title: 'Senior & Alumni Network', category: 'Navigation', icon: Users, path: '/community' },
      { id: 'profile', title: 'My Profile & Engineer Card', category: 'Settings', icon: User, path: '/profile' },
      { id: 'settings', title: 'Account Settings', category: 'Settings', icon: Settings, path: '/settings' },
    ],
    []
  );

  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(
      (c) => c.title.toLowerCase().includes(q) || c.category.toLowerCase().includes(q)
    );
  }, [commands, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(filteredCommands.length, 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(filteredCommands.length, 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          navigate(filteredCommands[selectedIndex].path);
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, navigate, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-surface-950/80 backdrop-blur-md" onClick={onClose} aria-hidden="true" />

      {/* Palette Container */}
      <div className="relative w-full max-w-xl rounded-2xl border border-surface-700 bg-surface-900 shadow-2xl overflow-hidden z-10 animate-fade-in">
        {/* Search Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-surface-800">
          <Search className="w-5 h-5 text-surface-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or jump to a module..."
            aria-label="Command palette search"
            className="flex-1 bg-transparent text-sm text-white placeholder-surface-500 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-surface-400 hover:text-white p-1 rounded"
              aria-label="Clear query"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="hidden sm:inline-block text-[11px] font-mono text-surface-500 border border-surface-700/60 rounded px-1.5 py-0.5">
            ESC to close
          </span>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-surface-850/50">
          {filteredCommands.length === 0 ? (
            <div className="p-6 text-center text-xs text-surface-400">
              No matching commands or destinations found for &quot;{query}&quot;
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const Icon = cmd.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  onClick={() => {
                    navigate(cmd.path);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={cn(
                    'flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs transition-colors',
                    isSelected ? 'bg-brand-600/20 text-white border border-brand-500/30' : 'text-surface-300 hover:bg-surface-800/60'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn('p-1.5 rounded-lg border border-surface-700/40', isSelected ? 'bg-brand-500/20 text-brand-300' : 'bg-surface-800 text-surface-400')}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{cmd.title}</p>
                      <p className="text-[10px] text-surface-400">{cmd.category}</p>
                    </div>
                  </div>
                  {isSelected && <ArrowRight className="w-3.5 h-3.5 text-brand-400" />}
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-surface-800 bg-surface-950/60 text-[11px] font-mono text-surface-400">
          <div className="flex items-center gap-2">
            <span>Navigation:</span>
            <kbd className="px-1.5 py-0.5 rounded bg-surface-800 border border-surface-700 text-surface-300">↑</kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-surface-800 border border-surface-700 text-surface-300">↓</kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-surface-800 border border-surface-700 text-surface-300">↵ Select</kbd>
          </div>
          <span>EngineerOS v1.0</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;

