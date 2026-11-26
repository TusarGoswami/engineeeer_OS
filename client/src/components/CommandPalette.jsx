import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Code2,
  GraduationCap,
  Brain,
  ShieldAlert,
  Users,
  MessageSquareCode,
  User,
  Settings,
  ArrowRight,
  X,
  LayoutDashboard,
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

/**
 * Keyboard-first navigation command palette triggered globally via Ctrl/Cmd+K.
 */
export const CommandPalette = ({ isOpen, onClose, userRole }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const commands = useMemo(() => {
    const base = [
      { id: 'dash', title: 'Dashboard', category: 'Navigation', icon: LayoutDashboard, path: '/dashboard' },
      { id: 'coding', title: 'Coding Problems & DSA', category: 'Navigation', icon: Code2, path: '/coding' },
      { id: 'gate', title: 'GATE Preparation Hub', category: 'Navigation', icon: Brain, path: '/gate' },
      { id: 'academics', title: 'Academic Hub & Syllabus', category: 'Navigation', icon: GraduationCap, path: '/academics' },
      { id: 'ai', title: 'AI Academic Assistant', category: 'Navigation', icon: Brain, path: '/ai-assistant' },
      { id: 'interviews', title: 'Mock Interviews', category: 'Navigation', icon: MessageSquareCode, path: '/interviews' },
      { id: 'assessments', title: 'Proctored Assessments', category: 'Navigation', icon: ShieldAlert, path: '/assessments' },
      { id: 'community', title: 'Senior & Alumni Network', category: 'Navigation', icon: Users, path: '/community' },
      { id: 'profile', title: 'My Profile & Engineer Card', category: 'Settings', icon: User, path: '/profile' },
      { id: 'settings', title: 'Account Settings', category: 'Settings', icon: Settings, path: '/profile' },
    ];
    if (userRole === 'platformAdmin' || userRole === 'contentAdmin') {
      base.push({
        id: 'admin',
        title: 'Admin & Faculty Studio',
        category: 'Admin',
        icon: ShieldAlert,
        path: '/admin',
      });
    }
    return base;
  }, [userRole]);

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
      setTimeout(() => inputRef.current?.focus(), 40);
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
        setSelectedIndex((prev) => (prev - 1 + Math.max(filteredCommands.length, 1)) % Math.max(filteredCommands.length, 1));
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
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 overflow-y-auto" role="dialog" aria-modal="true" aria-label="Command palette">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/50 dark:bg-black/65 backdrop-blur-[2px] animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Palette Surface */}
      <div className="relative w-full max-w-xl rounded-xl border border-surface-700 bg-card shadow-[var(--shadow-elevated)] z-10 overflow-hidden animate-in zoom-in-95">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-700 bg-elevated/50">
          <Search className="w-4 h-4 text-surface-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or jump to a module..."
            aria-label="Command palette search"
            className="flex-1 bg-transparent text-sm text-surface-100 placeholder:text-surface-500 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-surface-400 hover:text-surface-100 p-1 rounded"
              aria-label="Clear query"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block text-[11px] font-mono text-surface-400 bg-card border border-surface-700 rounded px-1.5 py-0.5">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-1.5 space-y-0.5">
          {filteredCommands.length === 0 ? (
            <div className="p-6 text-center text-xs text-surface-400">
              No matching destinations found for &quot;{query}&quot;
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const Icon = cmd.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={cmd.id}
                  type="button"
                  onClick={() => {
                    navigate(cmd.path);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs transition-colors border',
                    isSelected
                      ? 'bg-brand-500/10 text-brand-700 border-brand-500/25 font-medium'
                      : 'border-transparent text-surface-200 hover:bg-elevated/70'
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        'p-1.5 rounded-md border shrink-0',
                        isSelected
                          ? 'bg-brand-500/15 border-brand-500/25 text-brand-700'
                          : 'bg-elevated border-surface-700 text-surface-400'
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-surface-100 truncate">{cmd.title}</p>
                      <p className="text-[10px] text-surface-400">{cmd.category}</p>
                    </div>
                  </div>
                  {isSelected && <ArrowRight className="w-3.5 h-3.5 text-brand-700 shrink-0" />}
                </button>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between px-4 py-2 border-t border-surface-700 bg-elevated/50 text-[11px] font-mono text-surface-400">
          <div className="flex items-center gap-2">
            <span>Navigate:</span>
            <kbd className="px-1.5 py-0.5 rounded bg-card border border-surface-700 text-surface-200">↑</kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-card border border-surface-700 text-surface-200">↓</kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-card border border-surface-700 text-surface-200">↵ Open</kbd>
          </div>
          <span>EngineerOS</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
