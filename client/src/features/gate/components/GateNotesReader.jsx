import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  X,
  Copy,
  CheckCircle2,
  BookOpen,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Search,
  Cpu,
  Globe,
  Database,
  Binary,
  Layers,
  HardDrive,
  Radio,
  Sigma,
  Check,
} from 'lucide-react';
import { Badge, Button, Input, Select, useToast } from '../../../components/index.js';

const iconMap = {
  Cpu,
  Globe,
  Database,
  Binary,
  Layers,
  HardDrive,
  Radio,
  Sigma,
};

/**
 * Formats markdown tables, math symbols, bold headings, and bullets cleanly across Light and Dark themes.
 */
function FormattedContent({ text }) {
  if (!text) return null;

  const lines = text.trim().split('\n');

  const isTable = lines.some((l) => l.includes('|') && l.includes('---'));
  if (isTable) {
    const tableLines = lines.filter((l) => l.trim().startsWith('|'));
    if (tableLines.length >= 3) {
      const headers = tableLines[0]
        .split('|')
        .map((h) => h.trim())
        .filter(Boolean);
      const rows = tableLines.slice(2).map((line) =>
        line
          .split('|')
          .map((c) => c.trim())
          .filter(Boolean)
      );

      return (
        <div className="overflow-x-auto my-4 rounded-xl border border-surface-700 bg-card shadow-[var(--shadow-card)]">
          <table className="w-full text-xs font-mono text-left">
            <thead className="bg-elevated text-surface-100 border-b border-surface-700">
              <tr>
                {headers.map((h, i) => (
                  <th key={i} className="px-3.5 py-2.5 font-semibold whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-700">
              {rows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-elevated/45 transition-colors">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-3.5 py-2">
                      {cell === 'YES' ? (
                        <span className="inline-flex items-center gap-1 badge-compiler font-semibold bg-compiler-500/12 border border-compiler-500/25 px-2 py-0.5 rounded">
                          <Check className="w-3 h-3" /> YES
                        </span>
                      ) : cell === 'NO' ? (
                        <span className="inline-flex items-center gap-1 text-rose-700 dark:text-rose-400 font-semibold bg-rose-500/10 border border-rose-500/25 px-2 py-0.5 rounded">
                          ✕ NO
                        </span>
                      ) : (
                        <span className="text-surface-200 font-medium">{cell}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
  }

  return (
    <div className="space-y-2 text-xs sm:text-sm text-surface-200 leading-relaxed font-sans">
      {lines.map((rawLine, idx) => {
        const line = rawLine.trim();
        if (!line) return null;

        const cleanLine = line
          .replace(/\$\\text\{([^}]+)\}\$/g, '$1')
          .replace(/\\text\{([^}]+)\}/g, '$1')
          .replace(/\$([^$]+)\$/g, '$1')
          .replace(/\\times/g, '×')
          .replace(/\\le/g, '≤')
          .replace(/\\ge/g, '≥')
          .replace(/\\ne/g, '≠')
          .replace(/\\to/g, '→')
          .replace(/\\approx/g, '≈')
          .replace(/\\in/g, '∈')
          .replace(/\\cdot/g, '·')
          .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1 / $2)')
          .replace(/\\lfloor/g, '⌊')
          .replace(/\\rfloor/g, '⌋')
          .replace(/\\lceil/g, '⌈')
          .replace(/\\rceil/g, '⌉');

        const isBullet = line.startsWith('-');
        const isSubBullet = rawLine.startsWith('  -') || rawLine.startsWith('    -');
        const parts = cleanLine.replace(/^-\s*/, '').split(/(\*\*[^*]+\*\*)/g);

        return (
          <div
            key={idx}
            className={`flex items-start gap-2 ${
              isSubBullet ? 'pl-6 text-xs text-surface-300' : isBullet ? 'pl-2' : ''
            }`}
          >
            {isBullet && (
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-2 shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              {parts.map((p, pIdx) => {
                if (p.startsWith('**') && p.endsWith('**')) {
                  return (
                    <strong key={pIdx} className="font-semibold text-surface-100">
                      {p.slice(2, -2)}
                    </strong>
                  );
                }
                if (p.startsWith('*') && p.endsWith('*')) {
                  return (
                    <em key={pIdx} className="text-brand-700 not-italic font-medium">
                      {p.slice(1, -1)}
                    </em>
                  );
                }
                return <span key={pIdx}>{p}</span>;
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Full-viewport dual-theme GATE CS revision notes & formula cheatsheet reader.
 */
export function GateNotesReader({ note, allNotes = [], onClose, onSelectNote }) {
  const { showToast } = useToast();
  const [copiedFormula, setCopiedFormula] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const contentScrollRef = useRef(null);

  const currentIndex = allNotes.findIndex((n) => n.id === note.id);

  const handleNextSubject = useCallback(() => {
    if (currentIndex < allNotes.length - 1) {
      onSelectNote(allNotes[currentIndex + 1]);
      setActiveSectionIdx(0);
      contentScrollRef.current?.scrollTo?.({ top: 0, behavior: 'smooth' });
    }
  }, [currentIndex, allNotes, onSelectNote]);

  const handlePrevSubject = useCallback(() => {
    if (currentIndex > 0) {
      onSelectNote(allNotes[currentIndex - 1]);
      setActiveSectionIdx(0);
      contentScrollRef.current?.scrollTo?.({ top: 0, behavior: 'smooth' });
    }
  }, [currentIndex, allNotes, onSelectNote]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
      if (e.key === 'ArrowRight' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
        handleNextSubject();
      }
      if (e.key === 'ArrowLeft' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
        handlePrevSubject();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, handleNextSubject, handlePrevSubject]);

  const handleCopyFormula = (formulaText) => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(formulaText);
    }
    setCopiedFormula(formulaText);
    showToast('Formula copied to clipboard', 'success');
    setTimeout(() => setCopiedFormula(null), 2500);
  };

  const IconComp = iconMap[note.icon] || BookOpen;

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return note.sections || [];
    const q = searchQuery.toLowerCase();
    return (note.sections || []).filter(
      (sec) =>
        sec.heading.toLowerCase().includes(q) ||
        sec.content.toLowerCase().includes(q)
    );
  }, [note, searchQuery]);

  const subjectOptions = useMemo(
    () =>
      allNotes.map((n) => ({
        value: n.id,
        label: `${n.title} (${n.code})`,
      })),
    [allNotes]
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${note.title} Revision Notes`}
      className="fixed inset-0 z-50 bg-canvas flex flex-col text-surface-100 overflow-hidden animate-fade-in"
    >
      {/* Top Reader Bar */}
      <header className="px-4 py-3 sm:px-6 border-b border-surface-700 bg-card flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-brand-500/12 border border-brand-500/25 flex items-center justify-center text-brand-700 shrink-0">
            <IconComp className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-display text-base sm:text-lg font-bold text-surface-100 truncate tracking-tight">
                {note.title}
              </h2>
              <Badge variant="cyan" size="sm" className="hidden sm:inline-flex">
                {note.code}
              </Badge>
              <Badge variant="brand" size="sm">
                {note.weightage}
              </Badge>
            </div>
            <p className="text-xs text-surface-400 truncate hidden md:block">
              GATE CS Revision Cheatsheet &amp; Formula Vault
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <div className="w-44 sm:w-56">
            <Input
              aria-label="Search topic or formula"
              placeholder="Search topic or formula..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={Search}
              className="text-xs py-1.5"
            />
          </div>

          <div className="hidden sm:flex items-center bg-elevated rounded-lg p-0.5 border border-surface-700">
            <button
              type="button"
              onClick={handlePrevSubject}
              disabled={currentIndex <= 0}
              aria-label="Previous subject"
              title="Previous Subject (Left Arrow)"
              className="p-1.5 rounded-md text-surface-400 hover:text-surface-100 hover:bg-card disabled:opacity-35 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono px-2 text-surface-300 tabular-nums">
              {currentIndex + 1} / {allNotes.length}
            </span>
            <button
              type="button"
              onClick={handleNextSubject}
              disabled={currentIndex >= allNotes.length - 1}
              aria-label="Next subject"
              title="Next Subject (Right Arrow)"
              className="p-1.5 rounded-md text-surface-400 hover:text-surface-100 hover:bg-card disabled:opacity-35 disabled:pointer-events-none transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            leftIcon={X}
            title="Close Notes (Esc)"
          >
            Close
          </Button>
        </div>
      </header>

      {/* Main Two-Column Body */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Navigation Sidebar */}
        <aside className="w-72 lg:w-80 border-r border-surface-700 bg-card hidden md:flex flex-col min-h-0 shrink-0">
          <div className="p-4 border-b border-surface-700">
            <Select
              label="Core GATE Subject"
              aria-label="Select core GATE subject"
              value={note.id}
              onChange={(e) => {
                const target = allNotes.find((n) => n.id === e.target.value);
                if (target) {
                  onSelectNote(target);
                  setActiveSectionIdx(0);
                  contentScrollRef.current?.scrollTo?.({ top: 0, behavior: 'smooth' });
                }
              }}
              options={subjectOptions}
              className="text-xs py-2"
            />
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            <div className="px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider text-surface-400 font-semibold">
              Modules ({(note.sections || []).length})
            </div>

            <button
              type="button"
              onClick={() => {
                document.getElementById('formula-vault-section')?.scrollIntoView?.({ behavior: 'smooth' });
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-brand-700 bg-brand-500/10 border border-brand-500/25 hover:bg-brand-500/15 transition-colors text-left"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Essential Formula Vault</span>
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-card border border-brand-500/25 font-mono">
                {note.formulas?.length || 0}
              </span>
            </button>

            {(note.sections || []).map((sec, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setActiveSectionIdx(idx);
                  document.getElementById(`section-${idx}`)?.scrollIntoView?.({ behavior: 'smooth' });
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left border ${
                  activeSectionIdx === idx
                    ? 'bg-elevated text-brand-700 font-semibold border-brand-500/30'
                    : 'border-transparent text-surface-300 hover:text-surface-100 hover:bg-elevated/60'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] font-mono text-surface-400">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span className="truncate">{sec.heading}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-surface-400 shrink-0" />
              </button>
            ))}
          </div>

          <div className="p-4 border-t border-surface-700 bg-elevated/55 text-xs font-mono space-y-1.5">
            <div className="flex justify-between text-surface-400">
              <span>Exam Weightage:</span>
              <strong className="text-surface-100">{note.weightage}</strong>
            </div>
            <div className="flex justify-between text-surface-400">
              <span>Syllabus Units:</span>
              <span className="badge-compiler font-semibold">{note.topicsCount} Topics</span>
            </div>
          </div>
        </aside>

        {/* Scrollable Subject Notes Body */}
        <div
          ref={contentScrollRef}
          className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-8 space-y-8 max-w-5xl mx-auto w-full"
        >
          {/* Mobile subject switcher */}
          <div className="md:hidden">
            <Select
              label="Switch Subject Notes"
              value={note.id}
              onChange={(e) => {
                const target = allNotes.find((n) => n.id === e.target.value);
                if (target) {
                  onSelectNote(target);
                  setActiveSectionIdx(0);
                }
              }}
              options={subjectOptions}
            />
          </div>

          {/* Reader Hero Banner */}
          <div className="p-5 sm:p-6 rounded-xl border border-surface-700 bg-card shadow-[var(--shadow-card)] space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="cyan" size="sm">
                {note.code}
              </Badge>
              <Badge variant="brand" size="sm">
                {note.weightage}
              </Badge>
              <span className="text-xs text-surface-400 font-mono">
                {note.topicsCount} Key Topics Covered
              </span>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl font-bold text-surface-100 tracking-tight">
              {note.title}
            </h1>
            <p className="text-sm text-surface-300 max-w-3xl leading-relaxed">
              {note.description}
            </p>

            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-surface-700">
              {(note.tags || []).map((t) => (
                <span
                  key={t}
                  className="px-2.5 py-0.5 rounded-md bg-elevated border border-surface-700 text-[11px] font-mono text-surface-300"
                >
                  #{t}
                </span>
              ))}
            </div>
          </div>

          {/* Essential Formula Vault */}
          <div id="formula-vault-section" className="space-y-4">
            <div className="flex items-center justify-between border-b border-surface-700 pb-2">
              <h3 className="font-display text-base sm:text-lg font-bold text-surface-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-700" />
                <span>Essential Formula Vault</span>
              </h3>
              <span className="text-xs text-surface-400 font-mono hidden sm:inline">
                1-click copy
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {(note.formulas || []).map((f, fIdx) => (
                <div
                  key={fIdx}
                  className="p-4 rounded-xl border border-surface-700 bg-card flex flex-col justify-between gap-2.5 shadow-[var(--shadow-card)] hover:border-brand-500/40 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-surface-400">
                      {f.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyFormula(f.formula)}
                      title="Copy Formula"
                      className="px-2 py-1 rounded-md bg-elevated border border-surface-700 text-surface-300 hover:text-brand-700 transition-colors flex items-center gap-1 text-[11px] font-mono"
                    >
                      {copiedFormula === f.formula ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 badge-compiler" />
                          <span className="badge-compiler font-semibold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="p-3 rounded-lg bg-elevated border border-surface-700 font-mono text-xs sm:text-sm text-surface-100 font-semibold overflow-x-auto whitespace-pre-wrap">
                    {f.formula}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Sections */}
          <div className="space-y-6 pt-2">
            {filteredSections.map((sec, sIdx) => (
              <section
                key={sIdx}
                id={`section-${sIdx}`}
                className="p-5 sm:p-6 rounded-xl border border-surface-700 bg-card shadow-[var(--shadow-card)] space-y-4"
              >
                <div className="flex items-center justify-between border-b border-surface-700 pb-3">
                  <h4 className="font-display text-base sm:text-lg font-bold text-surface-100 flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0" />
                    <span>{sec.heading}</span>
                  </h4>
                  <span className="text-xs font-mono text-surface-400">
                    Section {sIdx + 1}
                  </span>
                </div>

                <FormattedContent text={sec.content} />
              </section>
            ))}
          </div>

          {/* Footer Subject Switcher */}
          <div className="pt-6 border-t border-surface-700 flex flex-wrap items-center justify-between gap-3">
            <Button
              type="button"
              variant="secondary"
              disabled={currentIndex <= 0}
              onClick={handlePrevSubject}
              leftIcon={ChevronLeft}
            >
              Previous: {currentIndex > 0 ? allNotes[currentIndex - 1].title : 'Start'}
            </Button>

            <Button
              type="button"
              variant="primary"
              disabled={currentIndex >= allNotes.length - 1}
              onClick={handleNextSubject}
              rightIcon={ChevronRight}
            >
              Next: {currentIndex < allNotes.length - 1 ? allNotes[currentIndex + 1].title : 'End'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GateNotesReader;
