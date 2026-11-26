import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import {
  Code2,
  Play,
  Send,
  RotateCcw,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Save,
  Terminal,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Cpu,
  Lock,
} from 'lucide-react';
import { codingService } from '../../services/coding.service.js';
import {
  Badge,
  Button,
  useToast,
} from '../../components/index.js';
import { useTheme } from '../../context/ThemeContext.jsx';
import { invalidateProgressQueries } from '../../utils/queryInvalidation.js';

const LANGUAGE_LABELS = {
  python: 'Python 3',
  cpp: 'C++ (GCC)',
  java: 'Java (OpenJDK)',
  javascript: 'JavaScript (Node)',
};

/**
 * Full-featured Coding IDE workspace with problem description, Monaco editor,
 * custom stdin/sample testcases, live Judge0 execution & polling verdict console.
 */
export function ProblemSolvePage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { isDark } = useTheme();

  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('description'); // 'description' | 'submissions'
  const [language, setLanguage] = useState(() => localStorage.getItem('engineeros_code_lang') || 'python');
  const [sourceCode, setSourceCode] = useState('');
  const [submissions, setSubmissions] = useState([]);
  const [lastSavedTime, setLastSavedTime] = useState(null);

  // Execution & Console states
  const [isRunning, setIsRunning] = useState(false);
  const [runResults, setRunResults] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitVerdict, setSubmitVerdict] = useState(null);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [consoleTab, setConsoleTab] = useState('result'); // 'testcase' | 'result'
  const [selectedCaseIdx, setSelectedCaseIdx] = useState(0);
  const [customInput, setCustomInput] = useState('');
  const [editorTheme, setEditorTheme] = useState(() => localStorage.getItem('engineeros_editor_theme') || '');

  const editorRef = useRef(null);

  const fetchSubmissions = async (problemId) => {
    try {
      const subs = await codingService.getMySubmissions(problemId);
      setSubmissions(subs || []);
    } catch {
      // Handled silently
    }
  };

  const fetchProblem = async () => {
    try {
      setLoading(true);
      const data = await codingService.getProblemBySlug(slug);
      setProblem(data);

      const draftKey = `code_draft_${slug}_${language}`;
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) {
        setSourceCode(savedDraft);
        setLastSavedTime('Restored from draft');
      } else {
        const defaultCode =
          data.starterCode?.[language] ||
          (language === 'python'
            ? '# Write your solution here\n'
            : language === 'cpp'
            ? '#include <iostream>\n\n// Write your solution here\n'
            : '// Write your solution here\n');
        setSourceCode(defaultCode);
      }

      fetchSubmissions(data._id);
    } catch {
      showToast('Problem not found', 'error');
      navigate('/coding');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProblem();
  }, [slug]);

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    localStorage.setItem('engineeros_code_lang', newLang);
    const draftKey = `code_draft_${slug}_${newLang}`;
    const savedDraft = localStorage.getItem(draftKey);

    if (savedDraft) {
      setSourceCode(savedDraft);
      setLastSavedTime('Restored from draft');
    } else if (problem?.starterCode?.[newLang]) {
      setSourceCode(problem.starterCode[newLang]);
      setLastSavedTime(null);
    } else {
      setSourceCode('// Write your solution here\n');
      setLastSavedTime(null);
    }
  };

  const handleCodeChange = (val) => {
    const code = val || '';
    setSourceCode(code);
    const draftKey = `code_draft_${slug}_${language}`;
    localStorage.setItem(draftKey, code);
    setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  };

  const handleResetStarterCode = () => {
    if (problem?.starterCode?.[language]) {
      setSourceCode(problem.starterCode[language]);
      localStorage.removeItem(`code_draft_${slug}_${language}`);
      setLastSavedTime('Reset to starter');
      showToast('Starter code restored', 'info');
    }
  };

  const handleRunSampleTests = async () => {
    if (!problem) return;
    try {
      setConsoleOpen(true);
      setConsoleTab('result');
      if (selectedCaseIdx !== 'custom') {
        setSelectedCaseIdx(0);
      }
      setIsRunning(true);
      setRunResults(null);
      setSubmitVerdict(null);
      const passedCustom =
        selectedCaseIdx === 'custom' && customInput.trim() ? customInput.trim() : null;
      const res = await codingService.runSampleTest(problem._id, sourceCode, language, passedCustom);
      setRunResults(res);
      if (res.passedSamples === res.totalSamples) {
        showToast('All sample test cases passed!', 'success');
      } else {
        showToast(`${res.passedSamples}/${res.totalSamples} samples passed`, 'info');
      }
    } catch (err) {
      setRunResults({
        totalSamples: 1,
        passedSamples: 0,
        sampleResults: [
          {
            sampleIndex: 1,
            passed: false,
            actualOutput: err.response?.data?.message || err.message || 'Execution error',
          },
        ],
      });
      showToast('Execution error', 'error');
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmitSolution = async () => {
    if (!problem) return;
    try {
      setConsoleOpen(true);
      setConsoleTab('result');
      setSelectedCaseIdx(0);
      setIsSubmitting(true);
      setRunResults(null);
      setSubmitVerdict(null);

      const res = await codingService.submitSolution(problem._id, sourceCode, language);

      if (res.verdict) {
        setSubmitVerdict(res.verdict);
        setIsSubmitting(false);
        fetchSubmissions(problem._id);
        invalidateProgressQueries();
        if (res.verdict.status === 'accepted') {
          showToast('Accepted! Problem solved successfully.', 'success');
        } else {
          showToast(`Verdict: ${res.verdict.status.toUpperCase()}`, 'error');
        }
      } else if (res.submissionId) {
        let attempts = 0;
        const interval = setInterval(async () => {
          attempts++;
          try {
            const sub = await codingService.getSubmissionById(res.submissionId);
            const isEvaluating =
              sub.status === 'queued' || sub.status === 'pending' || sub.status === 'running';

            if (!isEvaluating) {
              clearInterval(interval);
              setSubmitVerdict(sub);
              setIsSubmitting(false);
              fetchSubmissions(problem._id);
              invalidateProgressQueries();
              if (sub.status === 'accepted') {
                showToast('Accepted! Problem solved.', 'success');
              } else {
                showToast(`Verdict: ${sub.status.toUpperCase()}`, 'error');
              }
            } else if (attempts >= 30) {
              clearInterval(interval);
              setIsSubmitting(false);
              showToast('Evaluation is taking longer than expected. Check the Submissions tab.', 'info');
              fetchSubmissions(problem._id);
            }
          } catch (err) {
            clearInterval(interval);
            setIsSubmitting(false);
            showToast(err.response?.data?.message || 'Failed to check submission status', 'error');
          }
        }, 1200);
      } else {
        setIsSubmitting(false);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit solution', 'error');
      setIsSubmitting(false);
    }
  };

  // Keyboard shortcuts (Ctrl+Enter to Run, Ctrl+Shift+Enter to Submit, Ctrl+' to Toggle Console)
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleRunSampleTests();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();
        handleSubmitSolution();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === '`' || e.key === "'")) {
        e.preventDefault();
        setConsoleOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [problem, sourceCode, language, selectedCaseIdx, customInput]);

  const getMonacoLang = (lang) => {
    if (lang === 'cpp') return 'cpp';
    if (lang === 'python') return 'python';
    if (lang === 'java') return 'java';
    return 'javascript';
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-surface-400">
          <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
          <span className="font-mono text-sm">Loading Judge0 coding workspace...</span>
        </div>
      </div>
    );
  }

  const problemStatement = problem?.statementMarkdown || problem?.description || '';
  const hasArrayConstraints = Array.isArray(problem?.constraints) && problem.constraints.length > 0;
  const hasObjectConstraints =
    problem?.constraints && !Array.isArray(problem.constraints) && typeof problem.constraints === 'object';

  return (
    <div className="flex flex-col min-h-[calc(100vh-9rem)] lg:h-[calc(100vh-6rem)] space-y-3 pb-2 w-full">
      {/* Top IDE Workspace Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border border-surface-700 bg-card shadow-[var(--shadow-card)] shrink-0">
        <div className="flex flex-wrap items-center gap-2.5 min-w-0">
          <Link
            to="/coding"
            aria-label="Back to coding catalogue"
            className="p-1.5 rounded-lg border border-surface-700 bg-elevated/70 text-surface-300 hover:text-surface-100 hover:border-surface-600 transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="font-display text-base sm:text-lg font-bold text-surface-100 tracking-tight truncate">
            {problem?.title}
          </h1>
          <Badge
            variant={
              problem?.difficulty === 'easy'
                ? 'success'
                : problem?.difficulty === 'medium'
                ? 'warning'
                : 'danger'
            }
            size="sm"
            className="capitalize"
          >
            {problem?.difficulty}
          </Badge>
          {hasObjectConstraints && problem.constraints.timeLimitMs && (
            <span className="hidden md:inline-flex items-center gap-1 font-mono text-[11px] text-surface-400 px-2 py-0.5 rounded bg-elevated border border-surface-700">
              <Cpu className="w-3 h-3 text-brand-500" />
              {problem.constraints.timeLimitMs}ms
            </span>
          )}
        </div>

        {/* Execution Action Controls (Run vs Submit clearly distinguished) */}
        <div className="flex items-center gap-2 shrink-0">
          {lastSavedTime && (
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-mono text-surface-400 mr-1">
              <Save className="w-3 h-3 badge-compiler" />
              <span>{lastSavedTime}</span>
            </span>
          )}

          <Button
            size="sm"
            variant="secondary"
            onClick={handleRunSampleTests}
            isLoading={isRunning}
            disabled={isSubmitting}
            leftIcon={Play}
            title="Run sample tests (Ctrl+Enter)"
          >
            Run
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={handleSubmitSolution}
            isLoading={isSubmitting}
            disabled={isRunning}
            leftIcon={Send}
            title="Submit solution for grading (Ctrl+Shift+Enter)"
          >
            Submit
          </Button>
        </div>
      </div>

      {/* Main Split Workspace: Problem Description (5) | Monaco Editor & Console (7) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0">
        {/* Left Column: Problem Tabs (Description, Submissions) */}
        <div className="lg:col-span-5 flex flex-col min-h-[340px] lg:min-h-0 rounded-xl border border-surface-700 bg-card overflow-hidden shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between border-b border-surface-700 bg-elevated/55 px-3 shrink-0">
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => setActiveTab('description')}
                className={`px-3 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                  activeTab === 'description'
                    ? 'border-brand-500 text-surface-100'
                    : 'border-transparent text-surface-400 hover:text-surface-200'
                }`}
              >
                Description
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('submissions')}
                className={`px-3 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === 'submissions'
                    ? 'border-brand-500 text-surface-100'
                    : 'border-transparent text-surface-400 hover:text-surface-200'
                }`}
              >
                <span>Submissions</span>
                {submissions.length > 0 && (
                  <span className="text-[10px] bg-card border border-surface-700 text-surface-200 px-1.5 py-0.5 rounded-full font-mono tabular-nums">
                    {submissions.length}
                  </span>
                )}
              </button>
            </div>
            <span className="font-mono text-[10px] text-surface-400 uppercase hidden sm:inline">
              {LANGUAGE_LABELS[language] || language}
            </span>
          </div>

          <div className="flex-1 p-5 overflow-y-auto space-y-5 text-sm text-surface-200 leading-relaxed">
            {activeTab === 'description' ? (
              <>
                <div className="whitespace-pre-line text-xs sm:text-sm text-surface-200 leading-relaxed">
                  {problemStatement}
                </div>

                {/* Sample Test Cases */}
                {problem?.sampleTestCases?.length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-surface-700">
                    <h2 className="font-mono text-[11px] font-bold uppercase tracking-wider text-surface-400">
                      Sample Test Cases
                    </h2>
                    {problem.sampleTestCases.map((tc, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-lg bg-elevated/60 border border-surface-700 space-y-2.5 font-mono text-xs"
                      >
                        <div>
                          <span className="text-surface-400 text-[10px] uppercase tracking-wider block mb-0.5">
                            Example {idx + 1} · Input
                          </span>
                          <pre className="text-surface-100 whitespace-pre-wrap">{tc.input}</pre>
                        </div>
                        <div>
                          <span className="badge-compiler text-[10px] uppercase tracking-wider block mb-0.5 font-semibold">
                            Expected Output
                          </span>
                          <pre className="text-surface-100 whitespace-pre-wrap">
                            {tc.output ?? tc.expectedOutput}
                          </pre>
                        </div>
                        {tc.explanation && (
                          <div className="text-xs text-surface-300 font-sans pt-2 border-t border-surface-700/70">
                            <strong className="text-surface-100">Explanation:</strong> {tc.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Constraints (supports both object schema & legacy array) */}
                {(hasArrayConstraints || hasObjectConstraints) && (
                  <div className="space-y-2 pt-4 border-t border-surface-700">
                    <h2 className="font-mono text-[11px] font-bold uppercase tracking-wider text-surface-400">
                      Constraints & Limits
                    </h2>
                    {hasArrayConstraints ? (
                      <ul className="list-disc list-inside space-y-1 text-xs text-surface-300 font-mono">
                        {problem.constraints.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2 text-xs font-mono">
                          {problem.constraints.timeLimitMs && (
                            <span className="px-2.5 py-1 rounded-md bg-elevated border border-surface-700 text-surface-200">
                              Time: {problem.constraints.timeLimitMs} ms
                            </span>
                          )}
                          {problem.constraints.memoryLimitKb && (
                            <span className="px-2.5 py-1 rounded-md bg-elevated border border-surface-700 text-surface-200">
                              Memory: {Math.round(problem.constraints.memoryLimitKb / 1024)} MB
                            </span>
                          )}
                        </div>
                        {problem.constraints.customNotes && (
                          <p className="text-xs font-mono text-surface-300 whitespace-pre-line">
                            {problem.constraints.customNotes}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Topic Tags */}
                {problem?.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {problem.tags.map((t) => (
                      <span
                        key={t}
                        className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-elevated text-surface-300 border border-surface-700"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </>
            ) : (
              /* Submissions History */
              <div className="space-y-2">
                {submissions.length === 0 ? (
                  <p className="text-xs text-surface-400 py-8 text-center">
                    No submissions made yet for this problem.
                  </p>
                ) : (
                  submissions.map((sub) => (
                    <div
                      key={sub._id}
                      className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg border border-surface-700 bg-elevated/55"
                    >
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            sub.status === 'accepted'
                              ? 'success'
                              : sub.status === 'compile_error'
                              ? 'danger'
                              : 'warning'
                          }
                          size="sm"
                          className="uppercase"
                        >
                          {sub.status.replace('_', ' ')}
                        </Badge>
                        <span className="text-xs font-mono text-surface-300">
                          {sub.language}
                        </span>
                      </div>
                      <div className="text-xs font-mono text-surface-400 tabular-nums">
                        {sub.runtimeMs !== undefined && sub.runtimeMs !== null
                          ? `${sub.runtimeMs}ms`
                          : '—'}{' '}
                        · {new Date(sub.submittedAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Monaco Code Editor & Execution Console */}
        <div className="lg:col-span-7 flex flex-col min-h-[480px] lg:min-h-0 gap-3">
          {/* Code Editor Surface */}
          <div
            className={`flex flex-col min-h-0 rounded-xl border border-surface-700 bg-card overflow-hidden shadow-[var(--shadow-card)] transition-all duration-150 ${
              consoleOpen ? 'h-[52%] min-h-[260px]' : 'flex-1 min-h-[360px]'
            }`}
          >
            {/* Editor Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-surface-700 bg-elevated/55 shrink-0">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-brand-500 shrink-0" />
                <select
                  aria-label="Programming language"
                  value={language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="rounded-lg bg-card border border-surface-600 text-xs text-surface-100 px-2.5 py-1 focus:outline-none focus:border-brand-500 font-mono cursor-pointer"
                >
                  <option value="python">Python 3</option>
                  <option value="cpp">C++ (GCC)</option>
                  <option value="java">Java (OpenJDK)</option>
                  <option value="javascript">JavaScript (Node)</option>
                </select>

                <select
                  aria-label="Editor theme"
                  value={editorTheme || (isDark ? 'vs-dark' : 'vs')}
                  onChange={(e) => {
                    setEditorTheme(e.target.value);
                    localStorage.setItem('engineeros_editor_theme', e.target.value);
                  }}
                  className="rounded-lg bg-card border border-surface-600 text-xs text-surface-200 px-2 py-1 focus:outline-none focus:border-brand-500 font-mono hidden sm:inline-block cursor-pointer"
                >
                  <option value="vs-dark">Dark Theme</option>
                  <option value="hc-black">High Contrast</option>
                  <option value="vs">Light Theme</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetStarterCode}
                  leftIcon={RotateCcw}
                >
                  Reset Starter
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setConsoleOpen((prev) => !prev);
                    if (!consoleOpen) {
                      setConsoleTab(submitVerdict || runResults ? 'result' : 'testcase');
                    }
                  }}
                  leftIcon={Terminal}
                  rightIcon={consoleOpen ? ChevronDown : ChevronUp}
                >
                  Console
                </Button>
              </div>
            </div>

            {/* Monaco Editor Mount */}
            <div className="flex-1 w-full min-h-0">
              <Editor
                height="100%"
                language={getMonacoLang(language)}
                value={sourceCode}
                theme={editorTheme || (isDark ? 'vs-dark' : 'vs')}
                onChange={handleCodeChange}
                onMount={(editor, monaco) => {
                  editorRef.current = editor;
                  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
                    handleRunSampleTests();
                  });
                  editor.addCommand(
                    monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter,
                    () => {
                      handleSubmitSolution();
                    }
                  );
                }}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 4,
                  fontFamily: 'JetBrains Mono, Menlo, Monaco, monospace',
                }}
              />
            </div>

            {/* Keyboard Shortcuts Status Bar */}
            <div className="px-3.5 py-1.5 border-t border-surface-700 bg-elevated/45 flex items-center justify-between gap-2 text-[11px] text-surface-400 font-mono shrink-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-card border border-surface-700 text-surface-200 text-[10px]">
                    Ctrl+Enter
                  </kbd>
                  <span>Run</span>
                </span>
                <span className="text-surface-500">·</span>
                <span className="inline-flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-card border border-surface-700 text-surface-200 text-[10px]">
                    Ctrl+Shift+Enter
                  </kbd>
                  <span>Submit</span>
                </span>
                <span className="text-surface-500 hidden sm:inline">·</span>
                <span className="hidden sm:inline-flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-card border border-surface-700 text-surface-200 text-[10px]">
                    Ctrl+&apos;
                  </kbd>
                  <span>Console</span>
                </span>
              </div>
              <span className="hidden sm:inline text-surface-400">Sandboxed Runtime</span>
            </div>
          </div>

          {/* Bottom Console Drawer: Sample Testcases & Execution Verdicts */}
          {consoleOpen && (
            <div className="h-[48%] min-h-[240px] flex flex-col rounded-xl border border-surface-700 bg-card overflow-hidden shadow-[var(--shadow-elevated)] animate-fade-in">
              {/* Console Header */}
              <div className="flex items-center justify-between gap-2 px-3.5 py-2 border-b border-surface-700 bg-elevated/55 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-surface-200">
                    <Terminal className="w-3.5 h-3.5 text-brand-500" />
                    <span className="hidden sm:inline">Console</span>
                  </div>

                  <div className="flex items-center gap-1 bg-canvas p-0.5 rounded-lg border border-surface-700">
                    <button
                      type="button"
                      onClick={() => setConsoleTab('testcase')}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                        consoleTab === 'testcase'
                          ? 'bg-card text-surface-100 shadow-2xs border border-surface-700'
                          : 'text-surface-400 hover:text-surface-100'
                      }`}
                    >
                      Testcase
                    </button>
                    <button
                      type="button"
                      onClick={() => setConsoleTab('result')}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                        consoleTab === 'result'
                          ? 'bg-card text-surface-100 shadow-2xs border border-surface-700'
                          : 'text-surface-400 hover:text-surface-100'
                      }`}
                    >
                      <span>Test Result</span>
                      {(isRunning || isSubmitting) && (
                        <span className="w-2 h-2 rounded-full bg-brand-500 animate-ping" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {submitVerdict && (
                    <Badge
                      variant={
                        submitVerdict.status === 'accepted'
                          ? 'success'
                          : submitVerdict.status === 'compile_error'
                          ? 'danger'
                          : 'warning'
                      }
                      size="sm"
                      className="uppercase"
                    >
                      {submitVerdict.status.replace('_', ' ')}
                    </Badge>
                  )}
                  {runResults && !submitVerdict && (
                    <Badge
                      variant={
                        runResults.passedSamples === runResults.totalSamples
                          ? 'success'
                          : 'warning'
                      }
                      size="sm"
                    >
                      {runResults.passedSamples}/{runResults.totalSamples} Passed
                    </Badge>
                  )}

                  <button
                    type="button"
                    onClick={() => setConsoleOpen(false)}
                    title="Minimize Console"
                    aria-label="Minimize console"
                    className="p-1 rounded-lg text-surface-400 hover:text-surface-100 hover:bg-elevated transition-colors"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Console Body */}
              <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
                {/* 1. TESTCASE TAB */}
                {consoleTab === 'testcase' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {problem?.sampleTestCases?.map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedCaseIdx(idx)}
                          className={`px-3 py-1 rounded-lg text-xs font-medium font-mono transition-colors border shrink-0 ${
                            selectedCaseIdx === idx
                              ? 'bg-brand-500/12 border-brand-500/35 text-brand-700'
                              : 'bg-elevated/60 border-surface-700 text-surface-300 hover:text-surface-100'
                          }`}
                        >
                          Case {idx + 1}
                        </button>
                      ))}

                      <button
                        type="button"
                        onClick={() => setSelectedCaseIdx('custom')}
                        className={`px-3 py-1 rounded-lg text-xs font-medium font-mono transition-colors border shrink-0 ${
                          selectedCaseIdx === 'custom'
                            ? 'bg-compiler-500/12 border-compiler-500/35 badge-compiler'
                            : 'bg-elevated/60 border-surface-700 text-surface-300 hover:text-surface-100'
                        }`}
                      >
                        + Custom Input
                      </button>
                    </div>

                    {selectedCaseIdx === 'custom' ? (
                      <div className="space-y-2 font-mono text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-surface-400 uppercase tracking-wider">
                            Custom Standard Input (stdin)
                          </span>
                          <span className="text-[10px] text-surface-400">
                            Passed directly to your program
                          </span>
                        </div>
                        <textarea
                          value={customInput}
                          onChange={(e) => setCustomInput(e.target.value)}
                          rows={4}
                          placeholder="Type or paste custom input values here..."
                          className="w-full p-3 rounded-lg bg-auth-input border border-surface-600 text-surface-100 placeholder:text-surface-500 font-mono text-xs focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 resize-none"
                        />
                      </div>
                    ) : (
                      problem?.sampleTestCases?.[selectedCaseIdx] && (
                        <div className="space-y-2.5 font-mono text-xs">
                          <div>
                            <span className="text-[11px] font-semibold text-surface-400 uppercase tracking-wider block mb-1">
                              Input
                            </span>
                            <pre className="p-3 rounded-lg bg-elevated/65 border border-surface-700 text-surface-100 whitespace-pre-wrap">
                              {problem.sampleTestCases[selectedCaseIdx].input}
                            </pre>
                          </div>
                          <div>
                            <span className="text-[11px] font-semibold text-surface-400 uppercase tracking-wider block mb-1">
                              Expected Output
                            </span>
                            <pre className="p-3 rounded-lg bg-elevated/65 border border-surface-700 text-surface-100 whitespace-pre-wrap">
                              {problem.sampleTestCases[selectedCaseIdx].output ??
                                problem.sampleTestCases[selectedCaseIdx].expectedOutput}
                            </pre>
                          </div>
                          {problem.sampleTestCases[selectedCaseIdx].explanation && (
                            <div>
                              <span className="text-[11px] font-semibold text-surface-400 uppercase tracking-wider block mb-1">
                                Explanation
                              </span>
                              <div className="p-2.5 rounded-lg bg-elevated/40 border border-surface-700 text-surface-200 font-sans text-xs">
                                {problem.sampleTestCases[selectedCaseIdx].explanation}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    )}
                  </div>
                )}

                {/* 2. TEST RESULT TAB */}
                {consoleTab === 'result' && (
                  <div className="space-y-3">
                    {(isRunning || isSubmitting) && (
                      <div className="flex items-center gap-3 p-4 rounded-xl border border-brand-500/30 bg-brand-500/8 text-xs font-mono text-brand-700">
                        <div className="w-4 h-4 rounded-full border-2 border-brand-500 border-t-transparent animate-spin shrink-0" />
                        <div>
                          <div className="font-semibold text-surface-100">
                            {isSubmitting
                              ? 'Evaluating Submission...'
                              : 'Executing Sample Test Cases...'}
                          </div>
                          <div className="text-[11px] text-surface-400 mt-0.5">
                            {isSubmitting
                              ? 'Evaluating code against complete test matrix & hidden edge cases via sandboxed Judge0...'
                              : 'Compiling source code and executing against sample test cases...'}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SUBMISSION VERDICT */}
                    {submitVerdict && !isSubmitting && (
                      <div className="space-y-3">
                        <div
                          className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            submitVerdict.status === 'accepted'
                              ? 'border-compiler-500/30 bg-compiler-500/10'
                              : submitVerdict.status === 'compile_error'
                              ? 'border-rose-500/35 bg-rose-500/10'
                              : 'border-amber-500/35 bg-amber-500/10'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {submitVerdict.status === 'accepted' ? (
                              <CheckCircle2 className="w-6 h-6 badge-compiler shrink-0" />
                            ) : submitVerdict.status === 'compile_error' ? (
                              <AlertCircle className="w-6 h-6 text-rose-700 dark:text-rose-400 shrink-0" />
                            ) : (
                              <XCircle className="w-6 h-6 text-rose-700 dark:text-rose-400 shrink-0" />
                            )}
                            <div>
                              <div
                                className={`text-base font-bold font-mono tracking-tight ${
                                  submitVerdict.status === 'accepted'
                                    ? 'badge-compiler'
                                    : 'text-rose-700 dark:text-rose-400'
                                }`}
                              >
                                {submitVerdict.status === 'accepted'
                                  ? 'Accepted'
                                  : submitVerdict.status === 'compile_error'
                                  ? 'Compile Error'
                                  : submitVerdict.status === 'wrong_answer'
                                  ? 'Wrong Answer'
                                  : submitVerdict.status === 'tle'
                                  ? 'Time Limit Exceeded'
                                  : 'Runtime Error'}
                              </div>
                              <div className="text-xs text-surface-300 font-mono mt-0.5">
                                Passed:{' '}
                                <strong className="text-surface-100">
                                  {submitVerdict.testCasesPassed ?? submitVerdict.passedCount ?? 0}
                                </strong>{' '}
                                / {submitVerdict.totalTestCases || 0} Test Cases
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-xs font-mono text-surface-200">
                            {submitVerdict.runtimeMs !== undefined && (
                              <div className="flex items-center gap-1.5 bg-card px-2.5 py-1 rounded-lg border border-surface-700">
                                <Clock className="w-3.5 h-3.5 text-brand-500" />
                                <span>{submitVerdict.runtimeMs} ms</span>
                              </div>
                            )}
                            {submitVerdict.memoryKb !== undefined && submitVerdict.memoryKb > 0 && (
                              <div className="flex items-center gap-1.5 bg-card px-2.5 py-1 rounded-lg border border-surface-700">
                                <span>{Math.round(submitVerdict.memoryKb / 1024)} MB</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {(submitVerdict.compileError || submitVerdict.compileOutput) && (
                          <div>
                            <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wider block mb-1">
                              Compiler Diagnostic
                            </span>
                            <pre className="p-3 rounded-lg bg-rose-500/8 border border-rose-500/30 text-rose-700 dark:text-rose-300 font-mono text-xs whitespace-pre-wrap">
                              {submitVerdict.compileError || submitVerdict.compileOutput}
                            </pre>
                          </div>
                        )}

                        {submitVerdict.executionTrace?.length > 0 && (
                          <div className="space-y-2">
                            <span className="text-[11px] font-semibold text-surface-400 uppercase tracking-wider block">
                              Test Cases Evaluation Breakdown
                            </span>

                            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                              {submitVerdict.executionTrace.map((tc, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => setSelectedCaseIdx(idx)}
                                  className={`px-3 py-1 rounded-lg text-xs font-medium font-mono transition-colors flex items-center gap-1.5 border shrink-0 ${
                                    selectedCaseIdx === idx
                                      ? 'bg-elevated border-surface-600 text-surface-100'
                                      : 'bg-card border-surface-700 text-surface-400 hover:text-surface-100'
                                  }`}
                                >
                                  {tc.statusId === 3 || tc.statusDescription === 'Accepted' ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 badge-compiler" />
                                  ) : (
                                    <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                                  )}
                                  <span>Case {tc.testCaseIndex || idx + 1}</span>
                                  {tc.isHidden && (
                                    <span className="text-[10px] text-surface-400">(Hidden)</span>
                                  )}
                                </button>
                              ))}
                            </div>

                            {submitVerdict.executionTrace[selectedCaseIdx] && (
                              <div className="p-3.5 rounded-lg border border-surface-700 bg-elevated/55 space-y-2.5 font-mono text-xs">
                                {submitVerdict.executionTrace[selectedCaseIdx].isHidden ? (
                                  <div className="flex items-center gap-2 text-surface-400 text-xs italic py-1.5">
                                    <Lock className="w-3.5 h-3.5 shrink-0" />
                                    <span>
                                      Hidden system test case used for validation. Inputs and outputs are redacted.
                                    </span>
                                  </div>
                                ) : (
                                  <>
                                    {submitVerdict.executionTrace[selectedCaseIdx].input && (
                                      <div>
                                        <span className="text-[11px] font-semibold text-surface-400 uppercase tracking-wider block mb-1">
                                          Input
                                        </span>
                                        <pre className="p-2.5 rounded-lg bg-card border border-surface-700 text-surface-100 whitespace-pre-wrap">
                                          {submitVerdict.executionTrace[selectedCaseIdx].input}
                                        </pre>
                                      </div>
                                    )}
                                    <div>
                                      <span className="text-[11px] font-semibold text-surface-400 uppercase tracking-wider block mb-1">
                                        Your Output
                                      </span>
                                      <pre className="p-2.5 rounded-lg bg-card border border-surface-700 text-surface-100 whitespace-pre-wrap">
                                        {submitVerdict.executionTrace[selectedCaseIdx].stdout || '(Empty stdout)'}
                                      </pre>
                                    </div>
                                    {submitVerdict.executionTrace[selectedCaseIdx].expectedOutput && (
                                      <div>
                                        <span className="text-[11px] font-semibold text-surface-400 uppercase tracking-wider block mb-1">
                                          Expected Output
                                        </span>
                                        <pre className="p-2.5 rounded-lg bg-card border border-surface-700 text-surface-100 whitespace-pre-wrap">
                                          {submitVerdict.executionTrace[selectedCaseIdx].expectedOutput}
                                        </pre>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* SAMPLE RUN RESULTS */}
                    {runResults && !submitVerdict && !isRunning && (
                      <div className="space-y-3">
                        <div
                          className={`p-3.5 rounded-xl border flex items-center justify-between ${
                            runResults.passedSamples === runResults.totalSamples
                              ? 'border-compiler-500/30 bg-compiler-500/10'
                              : 'border-rose-500/35 bg-rose-500/10'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {runResults.passedSamples === runResults.totalSamples ? (
                              <CheckCircle2 className="w-5 h-5 badge-compiler" />
                            ) : (
                              <XCircle className="w-5 h-5 text-rose-700 dark:text-rose-400" />
                            )}
                            <span
                              className={`text-sm font-bold font-mono ${
                                runResults.passedSamples === runResults.totalSamples
                                  ? 'badge-compiler'
                                  : 'text-rose-700 dark:text-rose-400'
                              }`}
                            >
                              {runResults.passedSamples === runResults.totalSamples
                                ? 'All Sample Test Cases Passed!'
                                : `${runResults.passedSamples}/${runResults.totalSamples} Passed`}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                          {runResults.sampleResults?.map((sr, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setSelectedCaseIdx(idx)}
                              className={`px-3 py-1 rounded-lg text-xs font-medium font-mono transition-colors flex items-center gap-1.5 border shrink-0 ${
                                selectedCaseIdx === idx
                                  ? 'bg-elevated border-surface-600 text-surface-100'
                                  : 'bg-card border-surface-700 text-surface-400 hover:text-surface-100'
                              }`}
                            >
                              {sr.passed ? (
                                <CheckCircle2 className="w-3.5 h-3.5 badge-compiler" />
                              ) : (
                                <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                              )}
                              <span>Case {sr.sampleIndex || idx + 1}</span>
                              {sr.runtime ? (
                                <span className="text-[10px] text-surface-400">
                                  {Math.round(sr.runtime * 1000)}ms
                                </span>
                              ) : null}
                            </button>
                          ))}
                        </div>

                        {runResults.sampleResults?.[selectedCaseIdx] && (
                          <div className="p-3.5 rounded-lg border border-surface-700 bg-elevated/55 space-y-2.5 font-mono text-xs">
                            {runResults.sampleResults[selectedCaseIdx].input && (
                              <div>
                                <span className="text-[11px] font-semibold text-surface-400 uppercase tracking-wider block mb-1">
                                  Input
                                </span>
                                <pre className="p-2.5 rounded-lg bg-card border border-surface-700 text-surface-100 whitespace-pre-wrap">
                                  {runResults.sampleResults[selectedCaseIdx].input}
                                </pre>
                              </div>
                            )}

                            <div>
                              <span className="text-[11px] font-semibold text-surface-400 uppercase tracking-wider block mb-1">
                                Your Output
                              </span>
                              <pre
                                className={`p-2.5 rounded-lg bg-card border whitespace-pre-wrap ${
                                  runResults.sampleResults[selectedCaseIdx].passed
                                    ? 'border-compiler-500/35 badge-compiler'
                                    : 'border-rose-500/35 text-rose-700 dark:text-rose-300'
                                }`}
                              >
                                {runResults.sampleResults[selectedCaseIdx].actualOutput || '(Empty stdout)'}
                              </pre>
                            </div>

                            {runResults.sampleResults[selectedCaseIdx].expectedOutput && (
                              <div>
                                <span className="text-[11px] font-semibold text-surface-400 uppercase tracking-wider block mb-1">
                                  Expected Output
                                </span>
                                <pre className="p-2.5 rounded-lg bg-card border border-surface-700 text-surface-100 whitespace-pre-wrap">
                                  {runResults.sampleResults[selectedCaseIdx].expectedOutput}
                                </pre>
                              </div>
                            )}

                            {runResults.sampleResults[selectedCaseIdx].compileError && (
                              <div>
                                <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wider block mb-1">
                                  Compiler Output
                                </span>
                                <pre className="p-2.5 rounded-lg bg-rose-500/8 border border-rose-500/30 text-rose-700 dark:text-rose-300 whitespace-pre-wrap">
                                  {runResults.sampleResults[selectedCaseIdx].compileError}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* EMPTY STATE */}
                    {!runResults && !submitVerdict && !isRunning && !isSubmitting && (
                      <div className="py-8 text-center text-surface-400 space-y-2">
                        <Terminal className="w-7 h-7 mx-auto text-surface-400 opacity-70" />
                        <div className="text-xs font-mono">
                          Press <strong className="text-surface-100">Run</strong> or{' '}
                          <strong className="text-surface-100">Submit</strong> (or Ctrl+Enter) to evaluate your code.
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProblemSolvePage;
