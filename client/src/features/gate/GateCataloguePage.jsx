import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Clock,
  Target,
  ArrowRight,
  FileCheck2,
  FileText,
  Search,
  CheckCircle2,
  Copy,
  ExternalLink,
  Layers,
  Sparkles,
  Cpu,
  Globe,
  Database,
  Binary,
  HardDrive,
  Radio,
  Sigma,
} from 'lucide-react';
import { gateService } from '../../services/gate.service.js';
import { Card } from '../../components/Card.jsx';
import { Badge } from '../../components/Badge.jsx';
import { Button } from '../../components/Button.jsx';
import { Modal } from '../../components/Modal.jsx';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/Table.jsx';
import { useToast } from '../../components/Toast.jsx';
import { GATE_NOTES } from './gateNotesData.js';

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

export function GateCataloguePage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [tests, setTests] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Hub Navigation Tab: 'tests' | 'notes'
  const [activeHubTab, setActiveHubTab] = useState('tests');

  // Notes filtering states
  const [notesSearch, setNotesSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('all');
  const [selectedNote, setSelectedNote] = useState(null);
  const [copiedFormula, setCopiedFormula] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [testsData, attemptsData] = await Promise.all([
        gateService.getTests(),
        gateService.getMyAttempts(),
      ]);
      setTests(testsData || []);
      setAttempts(attemptsData || []);
    } catch {
      // Handled silently
    } finally {
      setLoading(false);
    }
  };

  const handleCopyFormula = (formulaText) => {
    navigator.clipboard.writeText(formulaText);
    setCopiedFormula(formulaText);
    showToast('Formula copied to clipboard', 'success');
    setTimeout(() => setCopiedFormula(null), 2500);
  };

  const allTags = ['all', ...new Set(GATE_NOTES.flatMap((n) => n.tags))];

  const filteredNotes = GATE_NOTES.filter((note) => {
    const matchesSearch =
      note.title.toLowerCase().includes(notesSearch.toLowerCase()) ||
      note.description.toLowerCase().includes(notesSearch.toLowerCase()) ||
      note.tags.some((t) => t.toLowerCase().includes(notesSearch.toLowerCase()));
    const matchesTag = selectedTag === 'all' || note.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12 animate-fade-in">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-surface-700/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-6 h-6 text-brand-500" />
            <span className="text-xs font-mono uppercase tracking-wider text-brand-400">
              National Examination Engine
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-surface-100 tracking-tight">
            GATE Hub & Exam Simulator
          </h1>
          <p className="text-sm text-surface-400 mt-1 max-w-2xl leading-relaxed">
            IIT-pattern computer-based mock tests with full anti-cheat proctoring, alongside
            curated subject revision notes and high-yield formula cheatsheets for GATE CS & IT.
          </p>
        </div>

        {/* Navigation Tabs between Mock Tests and Revision Notes */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-900 border border-surface-700">
          <button
            type="button"
            onClick={() => setActiveHubTab('tests')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeHubTab === 'tests'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-surface-400 hover:text-surface-200'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>Mock Tests</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-surface-800 text-surface-300 font-mono">
              {tests.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveHubTab('notes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeHubTab === 'notes'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-surface-400 hover:text-surface-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Revision Notes & Formulas</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-surface-800 text-surface-300 font-mono">
              8
            </span>
          </button>
        </div>
      </div>

      {/* VIEW 1: MOCK EXAMINATIONS */}
      {activeHubTab === 'tests' && (
        <div className="space-y-8 animate-fade-in">
          {/* Available Tests */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-surface-100 tracking-tight flex items-center gap-2">
                <span>Available Mock Tests</span>
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
              </h2>
              <span className="text-xs text-surface-400">Timed IIT-Pattern Simulations with Proctoring</span>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-56 rounded-2xl bg-surface-900/40 border border-surface-700 animate-pulse"
                  />
                ))}
              </div>
            ) : tests.length === 0 ? (
              <Card className="p-8 text-center text-surface-400 text-sm">
                No mock tests available at the moment. Check back soon!
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {tests.map((test) => (
                  <Card
                    key={test._id}
                    hover
                    className="flex flex-col justify-between min-h-[240px] p-5 border-surface-700 bg-surface-850 shadow-md group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <Badge variant="cyan" size="sm" className="font-mono text-[10px]">
                          {test.subject || 'CS & IT'}
                        </Badge>
                        <span className="text-[11px] font-mono text-surface-400">
                          {test.totalMarks} Marks
                        </span>
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-surface-100 group-hover:text-brand-500 transition-colors line-clamp-1">
                          {test.title}
                        </h3>
                        <p className="text-xs text-surface-400 mt-1 line-clamp-2 leading-relaxed">
                          {test.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 pt-2 text-xs font-mono text-surface-400 border-t border-surface-700/60">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-surface-500" />
                          {test.durationMinutes}m
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <FileCheck2 className="w-3.5 h-3.5 text-surface-500" />
                          {test.totalQuestions} Qs
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Target className="w-3.5 h-3.5 text-surface-500" />
                          {test.totalMarks} Pts
                        </span>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-surface-700">
                      <Button
                        variant="primary"
                        size="sm"
                        className="w-full justify-between"
                        rightIcon={ArrowRight}
                        onClick={() => navigate(`/gate/test/${test._id}`)}
                      >
                        Start Exam
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Recent Attempts History */}
          <div className="space-y-4 pt-4 border-t border-surface-800">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-surface-100 tracking-tight flex items-center gap-2">
                <span>My Test Attempts & Diagnostics</span>
              </h2>
              <span className="text-xs text-surface-400">Historical performance & solutions</span>
            </div>

            {attempts.length === 0 ? (
              <Card className="p-8 text-center text-surface-400 text-sm">
                You haven&apos;t taken any GATE mock exams yet. Take your first test above to evaluate
                your readiness!
              </Card>
            ) : (
              <Table containerClassName="border-surface-700 bg-surface-850 rounded-xl overflow-hidden">
                <TableHeader className="bg-surface-900 border-surface-700">
                  <TableRow hover={false}>
                    <TableHead>Test Title</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Accuracy</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-surface-700/80">
                  {attempts.map((att) => (
                    <TableRow
                      key={att._id}
                      onClick={() => navigate(`/gate/results/${att._id}`)}
                      className="cursor-pointer hover:bg-surface-800/60 transition-colors"
                    >
                      <TableCell className="font-semibold text-surface-100">
                        <div className="flex items-center gap-2">
                          <span>{att.testId?.title || 'GATE CS Mock Exam'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono font-bold text-brand-400">
                          {att.score}
                        </span>{' '}
                        <span className="text-xs font-mono text-surface-500">
                          / {att.totalMarksAvailable}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={att.accuracyRate >= 70 ? 'compiler' : 'signal'} size="sm">
                          {att.accuracyRate}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-surface-400">
                        {new Date(att.submittedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/gate/results/${att._id}`);
                          }}
                        >
                          Review Solutions
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: REVISION NOTES & FORMULA VAULT */}
      {activeHubTab === 'notes' && (
        <div className="space-y-6 animate-fade-in">
          {/* Search & Tag Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl border border-surface-700 bg-surface-850">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
              <input
                type="text"
                placeholder="Search formulas, algorithms, or topics (e.g., Paging, Deadlock, BCNF)..."
                value={notesSearch}
                onChange={(e) => setNotesSearch(e.target.value)}
                className="w-full bg-surface-900 border border-surface-700 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-surface-100 placeholder-surface-500 focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              {['all', 'Paging', 'Subnetting', 'Normalization', 'Master Theorem', 'Pipelining'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                    selectedTag === tag
                      ? 'bg-brand-500 text-white shadow-sm'
                      : 'bg-surface-800 text-surface-400 hover:text-surface-200'
                  }`}
                >
                  {tag === 'all' ? 'All Subjects' : tag}
                </button>
              ))}
            </div>
          </div>

          {/* Subject Notes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredNotes.map((note) => {
              const IconComp = iconMap[note.icon] || BookOpen;
              return (
                <Card
                  key={note.id}
                  hover
                  onClick={() => setSelectedNote(note)}
                  className="flex flex-col justify-between p-5 border-surface-700 bg-surface-850 shadow-md cursor-pointer group hover:border-brand-500/60 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-9 h-9 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 group-hover:bg-brand-500 group-hover:text-white transition-colors">
                        <IconComp className="w-5 h-5" />
                      </div>
                      <Badge variant="brand" size="sm" className="font-mono text-[10px]">
                        {note.weightage}
                      </Badge>
                    </div>

                    <div>
                      <div className="text-[10px] font-mono font-semibold text-brand-400 uppercase tracking-wider">
                        {note.code}
                      </div>
                      <h3 className="text-base font-bold text-surface-100 group-hover:text-brand-400 transition-colors">
                        {note.title}
                      </h3>
                      <p className="text-xs text-surface-400 mt-1 line-clamp-2 leading-relaxed">
                        {note.description}
                      </p>
                    </div>

                    {/* Key formulas preview */}
                    <div className="pt-2 border-t border-surface-700/60 space-y-1.5">
                      <span className="text-[10px] font-semibold uppercase text-surface-400 tracking-wider">
                        Key Formulas ({note.formulas.length}):
                      </span>
                      <div className="space-y-1">
                        {note.formulas.slice(0, 2).map((f, idx) => (
                          <div
                            key={idx}
                            className="p-1.5 rounded-lg bg-surface-900 border border-surface-750 font-mono text-[11px] text-cyan-400 truncate flex items-center justify-between"
                          >
                            <span className="truncate">{f.formula}</span>
                            <span className="text-[9px] text-surface-500 ml-1.5 flex-shrink-0">
                              {f.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-surface-700 flex items-center justify-between">
                    <span className="text-xs text-surface-400">
                      {note.topicsCount} Core Topics
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      rightIcon={ExternalLink}
                      className="text-xs text-brand-400 group-hover:text-brand-300"
                    >
                      Read Cheatsheet
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: Full Subject Cheatsheet & Notes Reader */}
      <Modal
        isOpen={Boolean(selectedNote)}
        onClose={() => setSelectedNote(null)}
        title={selectedNote ? `${selectedNote.title} (${selectedNote.code})` : 'Subject Notes'}
        size="lg"
      >
        {selectedNote && (
          <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
            {/* Header badges */}
            <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-surface-700">
              <Badge variant="brand">{selectedNote.weightage}</Badge>
              <Badge variant="cyan">{selectedNote.topicsCount} Key Topics</Badge>
              {selectedNote.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-md bg-surface-800 border border-surface-700 text-[11px] font-mono text-surface-300"
                >
                  #{tag}
                </span>
              ))}
            </div>

            {/* Formula Quick-Copy Cards */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-surface-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                <span>Essential Formula Vault</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedNote.formulas.map((f, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-surface-900 border border-surface-700 flex items-center justify-between gap-2 hover:border-brand-500/50 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="text-[10px] text-surface-400 font-semibold uppercase">
                        {f.name}
                      </div>
                      <div className="font-mono text-xs text-cyan-300 font-bold truncate mt-0.5">
                        {f.formula}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyFormula(f.formula)}
                      title="Copy Formula"
                      className="p-1.5 rounded-lg bg-surface-800 hover:bg-brand-500/20 text-surface-400 hover:text-brand-300 transition-colors flex-shrink-0"
                    >
                      {copiedFormula === f.formula ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Structured Sections */}
            <div className="space-y-5">
              {selectedNote.sections.map((sec, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-surface-700 bg-surface-900/60 space-y-2.5"
                >
                  <h5 className="text-sm font-bold text-surface-100 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-brand-400" />
                    <span>{sec.heading}</span>
                  </h5>
                  <div className="text-xs text-surface-300 leading-relaxed font-sans space-y-2 whitespace-pre-line">
                    {sec.content.trim()}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-surface-700 flex justify-end">
              <Button variant="secondary" onClick={() => setSelectedNote(null)}>
                Close Cheatsheet
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default GateCataloguePage;
