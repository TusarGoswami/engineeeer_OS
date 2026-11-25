import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Clock,
  Target,
  ArrowRight,
  FileCheck2,
  FileText,
  Search,
  Layers,
  Cpu,
  Globe,
  Database,
  Binary,
  HardDrive,
  Radio,
  Sigma,
  Award,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import { gateService } from '../../services/gate.service.js';
import {
  PageHeader,
  MetricStrip,
  MetricItem,
  Card,
  Badge,
  Button,
  Input,
  Skeleton,
  EmptyState,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../components/index.js';
import { GATE_NOTES } from './gateNotesData.js';
import { GateNotesReader } from './components/GateNotesReader.jsx';

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
 * Finds a matching GATE_NOTES subject sheet for a weak syllabus topic when available.
 */
function findMatchingRevisionNote(topicName = '') {
  const q = topicName.toLowerCase();
  if (!q) return null;
  return (
    GATE_NOTES.find(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        q.includes(n.title.toLowerCase()) ||
        n.tags.some((t) => t.toLowerCase().includes(q) || q.includes(t.toLowerCase()))
    ) || null
  );
}

/**
 * GATE Preparation Command Center: live telemetry from real attempts, mock test discovery,
 * weak-area revision recommendations, attempts diagnostics, and curated GATE CS formula notes.
 */
export function GateCataloguePage() {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeHubTab, setActiveHubTab] = useState('tests'); // 'tests' | 'notes'
  const [testSearch, setTestSearch] = useState('');
  const [selectedTestSubject, setSelectedTestSubject] = useState('all');

  const [notesSearch, setNotesSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('all');
  const [selectedNote, setSelectedNote] = useState(null);

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
      // Handled gracefully with empty lists
    } finally {
      setLoading(false);
    }
  };

  // Real aggregated analytics from recorded attempts (never fabricated)
  const analytics = useMemo(() => {
    if (!attempts.length) {
      return {
        avgAccuracy: null,
        bestScoreLabel: '—',
        bestScoreSub: 'Complete a mock to benchmark',
        weakTopicCounts: [],
        bestByTestId: new Map(),
      };
    }

    const totalAcc = attempts.reduce((sum, a) => sum + (a.accuracyRate || 0), 0);
    const avgAccuracy = Math.round(totalAcc / attempts.length);

    let bestAttempt = attempts[0];
    const weakMap = new Map();
    const bestByTestId = new Map();

    for (const att of attempts) {
      const pct = att.totalMarksAvailable ? att.score / att.totalMarksAvailable : 0;
      const bestPct = bestAttempt.totalMarksAvailable
        ? bestAttempt.score / bestAttempt.totalMarksAvailable
        : 0;
      if (pct > bestPct || (pct === bestPct && att.score > bestAttempt.score)) {
        bestAttempt = att;
      }

      const tid = att.testId?._id || att.testId;
      if (tid) {
        const existingBest = bestByTestId.get(tid);
        if (!existingBest || att.score > existingBest.score) {
          bestByTestId.set(tid, att);
        }
      }

      for (const wt of att.weakTopics || []) {
        weakMap.set(wt, (weakMap.get(wt) || 0) + 1);
      }
    }

    const weakTopicCounts = Array.from(weakMap.entries())
      .map(([topic, count]) => ({
        topic,
        count,
        matchingNote: findMatchingRevisionNote(topic),
      }))
      .sort((a, b) => b.count - a.count);

    return {
      avgAccuracy,
      bestScoreLabel: `${bestAttempt.score}/${bestAttempt.totalMarksAvailable}`,
      bestScoreSub: `${bestAttempt.accuracyRate}% accuracy peak`,
      weakTopicCounts,
      bestByTestId,
    };
  }, [attempts]);

  const testSubjects = useMemo(() => {
    const unique = Array.from(new Set(tests.map((t) => t.subject).filter(Boolean)));
    return ['all', ...unique];
  }, [tests]);

  const filteredTests = useMemo(() => {
    const q = testSearch.trim().toLowerCase();
    return tests.filter((test) => {
      const matchesSubject =
        selectedTestSubject === 'all' || test.subject === selectedTestSubject;
      const matchesSearch =
        !q ||
        (test.title || '').toLowerCase().includes(q) ||
        (test.description || '').toLowerCase().includes(q) ||
        (test.subject || '').toLowerCase().includes(q);
      return matchesSubject && matchesSearch;
    });
  }, [tests, testSearch, selectedTestSubject]);

  const allNoteTags = useMemo(
    () => ['all', ...new Set(GATE_NOTES.flatMap((n) => n.tags || []))],
    []
  );

  const filteredNotes = useMemo(() => {
    const q = notesSearch.trim().toLowerCase();
    return GATE_NOTES.filter((note) => {
      const matchesSearch =
        !q ||
        note.title.toLowerCase().includes(q) ||
        note.description.toLowerCase().includes(q) ||
        note.tags.some((t) => t.toLowerCase().includes(q));
      const matchesTag = selectedTag === 'all' || note.tags.includes(selectedTag);
      return matchesSearch && matchesTag;
    });
  }, [notesSearch, selectedTag]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header & Workspace Switcher */}
      <PageHeader
        eyebrow="~/gate · National Examination Engine"
        title="GATE Hub & Exam Simulator"
        description="IIT-pattern CBT mock tests with integrity proctoring, real diagnostic analytics, and curated CS/IT formula revision sheets."
        actions={
          <div className="flex items-center gap-1 p-1 rounded-xl bg-elevated border border-surface-700">
            <button
              type="button"
              onClick={() => setActiveHubTab('tests')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                activeHubTab === 'tests'
                  ? 'bg-brand-500 text-white shadow-2xs'
                  : 'text-surface-300 hover:text-surface-100'
              }`}
            >
              <Target className="w-4 h-4" />
              <span>Mock Tests</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeHubTab === 'tests'
                    ? 'bg-white/20 text-white'
                    : 'bg-card text-surface-400 border border-surface-700'
                }`}
              >
                {tests.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveHubTab('notes')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                activeHubTab === 'notes'
                  ? 'bg-brand-500 text-white shadow-2xs'
                  : 'text-surface-300 hover:text-surface-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Revision Notes &amp; Formulas</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeHubTab === 'notes'
                    ? 'bg-white/20 text-white'
                    : 'bg-card text-surface-400 border border-surface-700'
                }`}
              >
                {GATE_NOTES.length}
              </span>
            </button>
          </div>
        }
      />

      {/* Live GATE Readiness Telemetry Strip */}
      <MetricStrip>
        <MetricItem
          label="Available Mocks"
          value={tests.length}
          subvalue="Published CS & IT CBT papers"
          icon={Target}
        />
        <MetricItem
          label="Mocks Attempted"
          value={attempts.length}
          subvalue="Evaluated full attempts"
          icon={FileCheck2}
        />
        <MetricItem
          label="Best Score"
          value={analytics.bestScoreLabel}
          subvalue={analytics.bestScoreSub}
          icon={Award}
          accent="brand"
        />
        <MetricItem
          label="Average Accuracy"
          value={analytics.avgAccuracy !== null ? `${analytics.avgAccuracy}%` : '—'}
          subvalue={
            attempts.length > 0
              ? `Across ${attempts.length} mock ${attempts.length === 1 ? 'attempt' : 'attempts'}`
              : 'Complete a mock to benchmark'
          }
          icon={TrendingUp}
          accent="compiler"
        />
      </MetricStrip>

      {/* VIEW 1: MOCK EXAMINATIONS & DIAGNOSTICS */}
      {activeHubTab === 'tests' && (
        <div className="space-y-6 animate-fade-in">
          {/* Revision Insights Panel derived directly from weakTopics in attempts */}
          {analytics.weakTopicCounts.length > 0 && (
            <Card className="p-4 sm:p-5 border-amber-500/30 bg-amber-500/6 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
                  <h2 className="font-display text-sm font-bold text-surface-100">
                    Revision Priorities From Your Attempts
                  </h2>
                </div>
                <span className="font-mono text-[11px] text-surface-400">
                  Topics scoring below 50% accuracy
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {analytics.weakTopicCounts.map(({ topic, count, matchingNote }) => (
                  <div
                    key={topic}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-surface-700 text-xs"
                  >
                    <span className="font-medium text-surface-100">{topic}</span>
                    <span className="font-mono text-[10px] text-amber-700 dark:text-amber-400">
                      ({count}x)
                    </span>
                    {matchingNote && (
                      <button
                        type="button"
                        onClick={() => setSelectedNote(matchingNote)}
                        className="font-mono text-[11px] font-semibold text-brand-700 hover:underline ml-1"
                      >
                        Revise Notes &rarr;
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Test Discovery Filter Bar */}
          <Card className="p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <Input
                  aria-label="Search mock exams"
                  placeholder="Search mock tests by title, subject, or syllabus scope..."
                  value={testSearch}
                  onChange={(e) => setTestSearch(e.target.value)}
                  leftIcon={Search}
                />
              </div>
              {(testSearch || selectedTestSubject !== 'all') && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setTestSearch('');
                    setSelectedTestSubject('all');
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>

            {testSubjects.length > 2 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                {testSubjects.map((subj) => (
                  <button
                    key={subj}
                    type="button"
                    onClick={() => setSelectedTestSubject(subj)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors border whitespace-nowrap ${
                      selectedTestSubject === subj
                        ? 'bg-brand-500 border-brand-500 text-white'
                        : 'bg-elevated/60 border-surface-700 text-surface-300 hover:bg-elevated hover:text-surface-100'
                    }`}
                  >
                    {subj === 'all' ? 'All Subjects' : subj}
                  </button>
                ))}
              </div>
            )}
          </Card>

          {/* Available Mock Tests */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h2 className="font-display text-lg font-bold text-surface-100 tracking-tight">
                Available Mock Tests
              </h2>
              <span className="text-xs font-mono text-surface-400">
                Timed IIT-Pattern CBT Simulations
              </span>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-56 w-full rounded-xl" />
                ))}
              </div>
            ) : filteredTests.length === 0 ? (
              <EmptyState
                icon={Target}
                title={tests.length === 0 ? 'No mock tests published' : 'No matching mock tests'}
                description={
                  tests.length === 0
                    ? 'No mock tests are available right now. Check back soon.'
                    : 'Adjust your search query or subject filter above.'
                }
                actionLabel={tests.length > 0 ? 'Reset Filters' : undefined}
                onAction={
                  tests.length > 0
                    ? () => {
                        setTestSearch('');
                        setSelectedTestSubject('all');
                      }
                    : undefined
                }
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTests.map((test) => {
                  const bestPrior = analytics.bestByTestId.get(test._id);

                  return (
                    <Card
                      key={test._id}
                      hover
                      className="flex flex-col justify-between gap-4 p-5 group"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <Badge variant="cyan" size="sm">
                            {test.subject || 'CS & IT'}
                          </Badge>
                          {bestPrior ? (
                            <Badge variant="compiler" size="sm">
                              Best: {bestPrior.score}/{bestPrior.totalMarksAvailable}
                            </Badge>
                          ) : (
                            <span className="text-[11px] font-mono text-surface-400 shrink-0">
                              {test.totalMarks} Marks
                            </span>
                          )}
                        </div>

                        <div>
                          <h3 className="font-display text-base font-bold text-surface-100 group-hover:text-brand-700 transition-colors line-clamp-1">
                            {test.title}
                          </h3>
                          <p className="text-xs text-surface-400 mt-1 line-clamp-2 leading-relaxed">
                            {test.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 pt-2.5 text-xs font-mono text-surface-400 border-t border-surface-700">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-surface-400" />
                            {test.durationMinutes}m
                          </span>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1">
                            <FileCheck2 className="w-3.5 h-3.5 text-surface-400" />
                            {test.totalQuestions} Qs
                          </span>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1">
                            <Target className="w-3.5 h-3.5 text-surface-400" />
                            {test.totalMarks} Marks
                          </span>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        className="w-full justify-between"
                        rightIcon={ArrowRight}
                        onClick={() => navigate(`/gate/test/${test._id}`)}
                      >
                        {bestPrior ? 'Retake Exam' : 'Start Exam'}
                      </Button>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Past Attempts History */}
          <div className="space-y-4 pt-4 border-t border-surface-700">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h2 className="font-display text-lg font-bold text-surface-100 tracking-tight">
                My Test Attempts &amp; Diagnostics
              </h2>
              <span className="text-xs font-mono text-surface-400">
                Historical performance &amp; solutions
              </span>
            </div>

            {attempts.length === 0 ? (
              <EmptyState
                icon={FileCheck2}
                title="No attempts recorded yet"
                description="Start a mock examination above to generate diagnostic analytics and question solutions."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow hover={false}>
                    <TableHead>Test Title</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Accuracy</TableHead>
                    <TableHead>Weak Topics</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attempts.map((att) => (
                    <TableRow
                      key={att._id}
                      onClick={() => navigate(`/gate/results/${att._id}`)}
                      className="cursor-pointer"
                    >
                      <TableCell className="font-semibold text-surface-100">
                        {att.testId?.title || 'GATE CS Mock Exam'}
                      </TableCell>
                      <TableCell>
                        <span className="font-mono font-bold text-brand-700">
                          {att.score}
                        </span>{' '}
                        <span className="text-xs font-mono text-surface-400">
                          / {att.totalMarksAvailable}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={att.accuracyRate >= 70 ? 'compiler' : 'signal'} size="sm">
                          {att.accuracyRate}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-surface-400">
                        {att.weakTopics?.length > 0
                          ? att.weakTopics.slice(0, 2).join(', ')
                          : 'None'}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-surface-400">
                        {new Date(att.submittedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
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
          <Card className="p-4 space-y-3">
            <Input
              aria-label="Search formulas and notes"
              placeholder="Search formulas, algorithms, or topics (e.g., Paging, Deadlock, BCNF)..."
              value={notesSearch}
              onChange={(e) => setNotesSearch(e.target.value)}
              leftIcon={Search}
            />

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {allNoteTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors border whitespace-nowrap ${
                    selectedTag === tag
                      ? 'bg-brand-500 border-brand-500 text-white'
                      : 'bg-elevated/60 border-surface-700 text-surface-300 hover:bg-elevated hover:text-surface-100'
                  }`}
                >
                  {tag === 'all' ? 'All Subjects' : tag}
                </button>
              ))}
            </div>
          </Card>

          {filteredNotes.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No matching revision notes"
              description="Try clearing the search query or selecting All Subjects above."
              actionLabel="Reset Filter"
              onAction={() => {
                setNotesSearch('');
                setSelectedTag('all');
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredNotes.map((note) => {
                const IconComp = iconMap[note.icon] || BookOpen;
                return (
                  <Card
                    key={note.id}
                    hover
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedNote(note)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedNote(note);
                      }
                    }}
                    className="flex flex-col justify-between gap-4 p-5 cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="w-9 h-9 rounded-lg bg-brand-500/12 border border-brand-500/25 flex items-center justify-center text-brand-700 group-hover:bg-brand-500 group-hover:text-white transition-colors">
                          <IconComp className="w-5 h-5" />
                        </div>
                        <Badge variant="brand" size="sm">
                          {note.weightage}
                        </Badge>
                      </div>

                      <div>
                        <div className="text-[10px] font-mono font-semibold text-brand-700 uppercase tracking-wider">
                          {note.code}
                        </div>
                        <h3 className="font-display text-base font-bold text-surface-100 group-hover:text-brand-700 transition-colors">
                          {note.title}
                        </h3>
                        <p className="text-xs text-surface-400 mt-1 line-clamp-2 leading-relaxed">
                          {note.description}
                        </p>
                      </div>

                      <div className="pt-2.5 border-t border-surface-700 space-y-1.5">
                        <span className="font-mono text-[10px] font-semibold uppercase text-surface-400 tracking-wider block">
                          Key Formulas ({note.formulas.length})
                        </span>
                        <div className="space-y-1">
                          {note.formulas.slice(0, 2).map((f, idx) => (
                            <div
                              key={idx}
                              className="px-2.5 py-1.5 rounded-lg bg-elevated border border-surface-700 font-mono text-[11px] text-surface-100 flex items-center justify-between gap-2"
                            >
                              <span className="truncate font-semibold">{f.formula}</span>
                              <span className="text-[10px] text-surface-400 shrink-0">
                                {f.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-surface-700 flex items-center justify-between text-xs">
                      <span className="font-mono text-surface-400">
                        {note.topicsCount} Core Topics
                      </span>
                      <span className="inline-flex items-center gap-1 font-semibold text-brand-700 group-hover:translate-x-0.5 transition-transform">
                        Read Cheatsheet
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Full-Viewport Subject Notes & Formula Reader */}
      {selectedNote && (
        <GateNotesReader
          note={selectedNote}
          allNotes={GATE_NOTES}
          onClose={() => setSelectedNote(null)}
          onSelectNote={setSelectedNote}
        />
      )}
    </div>
  );
}

export default GateCataloguePage;
