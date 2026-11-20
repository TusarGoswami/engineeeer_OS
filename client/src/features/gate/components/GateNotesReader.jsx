import { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Copy,
  CheckCircle2,
  BookOpen,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Search,
  AlertTriangle,
  Lightbulb,
  Cpu,
  Globe,
  Database,
  Binary,
  Layers,
  HardDrive,
  Radio,
  Sigma,
  ExternalLink,
  Target,
  Maximize2,
  Minimize2,
  Check,
} from 'lucide-react';
import Badge from '../../../components/Badge.jsx';
import Button from '../../../components/Button.jsx';
import { useToast } from '../../../components/Toast.jsx';

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

// Formats text with markdown-like highlights and clean math formatting
function FormattedContent({ text }) {
  if (!text) return null;

  // Split into lines or paragraphs
  const lines = text.trim().split('\n');

  // Check if this block is a markdown table (e.g. TOC closure table)
  const isTable = lines.some(l => l.includes('|') && l.includes('---'));
  if (isTable) {
    const tableLines = lines.filter(l => l.trim().startsWith('|'));
    if (tableLines.length >= 3) {
      const headers = tableLines[0]
        .split('|')
        .map(h => h.trim())
        .filter(Boolean);
      const rows = tableLines.slice(2).map(line =>
        line
          .split('|')
          .map(c => c.trim())
          .filter(Boolean)
      );

      return (
        <div className="overflow-x-auto my-4 rounded-xl border border-surface-700 bg-surface-900/80 shadow-md">
          <table className="w-full text-xs font-mono text-left">
            <thead className="bg-surface-800/90 text-surface-200 border-b border-surface-700">
              <tr>
                {headers.map((h, i) => (
                  <th key={i} className="px-3.5 py-2.5 font-bold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-800">
              {rows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-surface-850/50 transition-colors">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-3.5 py-2">
                      {cell === 'YES' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                          <Check className="w-3 h-3" /> YES
                        </span>
                      ) : cell === 'NO' ? (
                        <span className="inline-flex items-center gap-1 text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded">
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

  // Render bullet points & paragraphs cleanly
  return (
    <div className="space-y-2 text-xs sm:text-sm text-surface-300 leading-relaxed font-sans">
      {lines.map((rawLine, idx) => {
        const line = rawLine.trim();
        if (!line) return null;

        // Clean math markers like $\text{...}$ or $$...$$ into readable math expressions
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

        // Check for Bold headers like **Turnaround Time (TAT)**:
        const parts = cleanLine.replace(/^-\s*/, '').split(/(\*\*[^*]+\*\*)/g);

        return (
          <div
            key={idx}
            className={`flex items-start gap-2 ${
              isSubBullet ? 'pl-6 text-xs text-surface-400' : isBullet ? 'pl-2' : ''
            }`}
          >
            {isBullet && (
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 mt-2 flex-shrink-0" />
            )}
            <div className="flex-1">
              {parts.map((p, pIdx) => {
                if (p.startsWith('**') && p.endsWith('**')) {
                  const boldText = p.slice(2, -2);
                  return (
                    <strong key={pIdx} className="font-semibold text-surface-100">
                      {boldText}
                    </strong>
                  );
                }
                if (p.startsWith('*') && p.endsWith('*')) {
                  const italicText = p.slice(1, -1);
                  return (
                    <em key={pIdx} className="text-cyan-300 not-italic font-medium">
                      {italicText}
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

export function GateNotesReader({ note, allNotes, onClose, onSelectNote }) {
  const { showToast } = useToast();
  const [copiedFormula, setCopiedFormula] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const contentScrollRef = useRef(null);

  // Close on Escape, navigate subjects with Left/Right
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
      if (e.key === 'ArrowRight' && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
        handleNextSubject();
      }
      if (e.key === 'ArrowLeft' && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
        handlePrevSubject();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [note, allNotes]);

  // Current Subject index
  const currentIndex = allNotes.findIndex((n) => n.id === note.id);

  const handleNextSubject = () => {
    if (currentIndex < allNotes.length - 1) {
      onSelectNote(allNotes[currentIndex + 1]);
      setActiveSectionIdx(0);
      contentScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevSubject = () => {
    if (currentIndex > 0) {
      onSelectNote(allNotes[currentIndex - 1]);
      setActiveSectionIdx(0);
      contentScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleCopyFormula = (formulaText) => {
    navigator.clipboard.writeText(formulaText);
    setCopiedFormula(formulaText);
    showToast('Formula copied to clipboard', 'success');
    setTimeout(() => setCopiedFormula(null), 2500);
  };

  const IconComp = iconMap[note.icon] || BookOpen;

  // Filter sections based on local search inside this subject
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return note.sections;
    const q = searchQuery.toLowerCase();
    return note.sections.filter(
      (sec) =>
        sec.heading.toLowerCase().includes(q) ||
        sec.content.toLowerCase().includes(q)
    );
  }, [note, searchQuery]);

  return (
    <div className="fixed inset-0 z-50 bg-surface-950 flex flex-col text-surface-100 overflow-hidden animate-fade-in">
      {/* 1. TOP APP BAR */}
      <div className="h-16 px-4 sm:px-6 border-b border-surface-800 bg-surface-900/90 backdrop-blur-md flex items-center justify-between gap-4 flex-shrink-0 z-10 shadow-lg">
        {/* Left: Subject Identity */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400 flex-shrink-0">
            <IconComp className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-surface-100 truncate tracking-tight">
                {note.title}
              </h2>
              <Badge variant="cyan" size="sm" className="font-mono text-[10px] hidden sm:inline-flex">
                {note.code}
              </Badge>
              <Badge variant="brand" size="sm" className="font-mono text-[10px]">
                {note.weightage}
              </Badge>
            </div>
            <p className="text-xs text-surface-400 truncate hidden md:block">
              GATE CS Comprehensive High-Yield Revision Cheatsheet & Formula Vault
            </p>
          </div>
        </div>

        {/* Center: Search inside subject */}
        <div className="relative w-64 max-w-xs hidden lg:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-surface-500" />
          <input
            type="text"
            placeholder="Search topic or formula..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-950 border border-surface-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-surface-200 placeholder-surface-500 focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>

        {/* Right: Subject Switcher & Close */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center bg-surface-800/80 rounded-xl p-0.5 border border-surface-700/60 hidden sm:flex">
            <button
              type="button"
              onClick={handlePrevSubject}
              disabled={currentIndex === 0}
              title="Previous Subject (Left Arrow)"
              className="p-1.5 rounded-lg text-surface-400 hover:text-surface-100 hover:bg-surface-700/60 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono px-2 text-surface-400">
              {currentIndex + 1} / {allNotes.length}
            </span>
            <button
              type="button"
              onClick={handleNextSubject}
              disabled={currentIndex === allNotes.length - 1}
              title="Next Subject (Right Arrow)"
              className="p-1.5 rounded-lg text-surface-400 hover:text-surface-100 hover:bg-surface-700/60 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            title="Close Notes (Esc)"
            className="p-2 rounded-xl text-surface-400 hover:text-surface-100 hover:bg-surface-800 border border-surface-700/60 transition-colors flex items-center gap-1.5 text-xs font-semibold"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Close</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN TWO-COLUMN BODY */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* LEFT SIDEBAR: Table of Contents & Subject Switcher */}
        <div className="w-72 sm:w-80 border-r border-surface-800 bg-surface-900/50 flex flex-col min-h-0 hidden md:flex flex-shrink-0">
          {/* Quick Subject Selector */}
          <div className="p-4 border-b border-surface-800">
            <span className="text-[11px] font-bold uppercase tracking-wider text-surface-400 block mb-2">
              Select Core Subject
            </span>
            <select
              value={note.id}
              onChange={(e) => {
                const target = allNotes.find((n) => n.id === e.target.value);
                if (target) {
                  onSelectNote(target);
                  setActiveSectionIdx(0);
                  contentScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              className="w-full bg-surface-850 border border-surface-700 rounded-xl px-3 py-2 text-xs font-medium text-surface-100 focus:outline-none focus:border-brand-500 font-sans"
            >
              {allNotes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.title} ({n.code})
                </option>
              ))}
            </select>
          </div>

          {/* Table of Contents Sections */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-surface-500 font-semibold">
              Sections in this Module ({note.sections.length})
            </div>

            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('formula-vault-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 transition-all text-left"
            >
              <span className="flex items-center gap-2 font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Essential Formula Vault</span>
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                {note.formulas.length}
              </span>
            </button>

            {note.sections.map((sec, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setActiveSectionIdx(idx);
                  const el = document.getElementById(`section-${idx}`);
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left ${
                  activeSectionIdx === idx
                    ? 'bg-surface-800 text-brand-400 font-semibold border border-brand-500/30'
                    : 'text-surface-300 hover:text-surface-100 hover:bg-surface-850/80'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="text-[10px] font-mono text-surface-500">
                    0{idx + 1}
                  </span>
                  <span className="truncate">{sec.heading}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-40 flex-shrink-0" />
              </button>
            ))}
          </div>

          {/* Exam Blueprint stats footer */}
          <div className="p-4 border-t border-surface-800 bg-surface-900 text-xs font-mono space-y-1.5">
            <div className="flex justify-between text-surface-400">
              <span>Exam Weightage:</span>
              <strong className="text-surface-200">{note.weightage}</strong>
            </div>
            <div className="flex justify-between text-surface-400">
              <span>Expected Questions:</span>
              <span className="text-emerald-400 font-semibold">4 - 6 Questions</span>
            </div>
          </div>
        </div>

        {/* RIGHT CONTENT: High-Yield Notes & Full Formula Vault */}
        <div
          ref={contentScrollRef}
          className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-8 lg:p-10 space-y-8 max-w-5xl mx-auto w-full"
        >
          {/* Header Banner inside reader */}
          <div className="p-6 rounded-2xl border border-surface-800 bg-gradient-to-r from-surface-900 to-surface-850 shadow-xl space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="cyan" size="sm" className="font-mono text-xs">
                {note.code}
              </Badge>
              <Badge variant="brand" size="sm" className="font-mono text-xs">
                {note.weightage}
              </Badge>
              <span className="text-xs text-surface-400 font-mono">
                {note.topicsCount} Key Topics Covered
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-surface-100 tracking-tight">
              {note.title}
            </h1>
            <p className="text-sm text-surface-300 max-w-3xl leading-relaxed">
              {note.description}
            </p>

            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-surface-800">
              {note.tags.map((t) => (
                <span
                  key={t}
                  className="px-2.5 py-1 rounded-lg bg-surface-950 border border-surface-800 text-[11px] font-mono text-surface-400"
                >
                  #{t}
                </span>
              ))}
            </div>
          </div>

          {/* 3. ESSENTIAL FORMULA VAULT (Full-Width Cards with 1-Click Copy) */}
          <div id="formula-vault-section" className="space-y-4 pt-2">
            <div className="flex items-center justify-between border-b border-surface-800 pb-2">
              <h3 className="text-base sm:text-lg font-bold text-surface-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-400" />
                <span>Essential Formula Vault</span>
              </h3>
              <span className="text-xs text-surface-400 font-mono">
                Click copy button to copy formula
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {note.formulas.map((f, fIdx) => (
                <div
                  key={fIdx}
                  className="p-4 rounded-xl border border-surface-700/80 bg-surface-900 flex flex-col justify-between gap-3 hover:border-brand-500/60 shadow-md transition-all group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-surface-400">
                        {f.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyFormula(f.formula)}
                        title="Copy Formula"
                        className="p-1.5 rounded-lg bg-surface-800 text-surface-400 hover:text-brand-300 hover:bg-brand-500/20 transition-all flex items-center gap-1 text-[11px] font-mono"
                      >
                        {copiedFormula === f.formula ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400 font-bold">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="p-3 rounded-lg bg-surface-950 border border-surface-800 font-mono text-sm text-cyan-300 font-bold overflow-x-auto whitespace-pre-wrap selection:bg-brand-500/30">
                      {f.formula}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. DETAILED SECTIONS */}
          <div className="space-y-8 pt-4">
            {filteredSections.map((sec, sIdx) => (
              <div
                key={sIdx}
                id={`section-${sIdx}`}
                className="p-6 rounded-2xl border border-surface-750 bg-surface-900/70 shadow-lg space-y-4 hover:border-surface-600 transition-colors"
              >
                <div className="flex items-center justify-between border-b border-surface-800 pb-3">
                  <h4 className="text-lg font-bold text-surface-100 flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-brand-500" />
                    <span>{sec.heading}</span>
                  </h4>
                  <span className="text-xs font-mono text-surface-500">
                    Section {sIdx + 1}
                  </span>
                </div>

                {/* Formatted Content */}
                <FormattedContent text={sec.content} />
              </div>
            ))}
          </div>

          {/* Bottom Subject Switcher Navigation */}
          <div className="pt-8 border-t border-surface-800 flex items-center justify-between gap-4">
            <Button
              variant="secondary"
              disabled={currentIndex === 0}
              onClick={handlePrevSubject}
              leftIcon={ChevronLeft}
            >
              Previous: {currentIndex > 0 ? allNotes[currentIndex - 1].title : 'Start'}
            </Button>

            <Button
              variant="primary"
              disabled={currentIndex === allNotes.length - 1}
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
