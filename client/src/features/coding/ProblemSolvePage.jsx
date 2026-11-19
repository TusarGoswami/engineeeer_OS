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
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { codingService } from '../../services/coding.service.js';
import Card from '../../components/Card.jsx';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import { useToast } from '../../components/Toast.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';

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

  const editorRef = useRef(null);

  const fetchSubmissions = async problemId => {
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

      // Check localStorage for autosaved draft first
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

  const handleLanguageChange = newLang => {
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

  const handleCodeChange = val => {
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
      setSelectedCaseIdx(0);
      setIsRunning(true);
      setRunResults(null);
      setSubmitVerdict(null);
      const res = await codingService.runSampleTest(problem._id, sourceCode, language);
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
        if (res.verdict.status === 'accepted') {
          showToast('Accepted! Problem solved successfully.', 'success');
        } else {
          showToast(`Verdict: ${res.verdict.status.toUpperCase()}`, 'error');
        }
      } else if (res.submissionId) {
        // Poll for worker evaluation
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

  // Keyboard shortcut listener (Ctrl+Enter to Run, Ctrl+Shift+Enter to Submit, Ctrl+' to Toggle Console)
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
        setConsoleOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [problem, sourceCode, language]);

  const getMonacoLang = lang => {
    if (lang === 'cpp') return 'cpp';
    if (lang === 'python') return 'python';
    if (lang === 'java') return 'java';
    return 'javascript';
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-surface-400">
          <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
          <span className="text-sm">Loading problem workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)] space-y-3 pb-2">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-3">
          <Link
            to="/coding"
            className="p-1.5 rounded-xl border border-surface-700 bg-surface-850 text-surface-400 hover:text-surface-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2" title="Sandboxed Execution Environment">
            <h1 className="text-base sm:text-lg font-bold text-surface-100 tracking-tight">
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
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {lastSavedTime && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-surface-500">
              <Save className="w-3 h-3 text-emerald-500" />
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
          >
            Submit
          </Button>
        </div>
      </div>

      {/* Main Split Layout: Description on Left, Editor on Right */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0">
        {/* Left Column: Problem Tabs (Description, Submissions) */}
        <div className="lg:col-span-5 flex flex-col h-full min-h-0 rounded-2xl border border-surface-700 bg-surface-850 overflow-hidden shadow-lg">
          <div className="flex items-center border-b border-surface-700 bg-surface-900 px-3 pt-2">
            <button
              type="button"
              onClick={() => setActiveTab('description')}
              className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
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
              className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'submissions'
                  ? 'border-brand-500 text-surface-100'
                  : 'border-transparent text-surface-400 hover:text-surface-200'
              }`}
            >
              <span>Submissions</span>
              {submissions.length > 0 && (
                <span className="text-[10px] bg-surface-800 text-surface-300 px-1.5 py-0.2 rounded-full font-mono">
                  {submissions.length}
                </span>
              )}
            </button>
          </div>

          <div className="flex-1 p-5 overflow-y-auto space-y-5 text-sm text-surface-200 leading-relaxed">
            {activeTab === 'description' ? (
              <>
                <div className="prose prose-invert max-w-none text-xs sm:text-sm">
                  <p>{problem?.description}</p>
                </div>

                {/* Sample Test Cases */}
                {problem?.sampleTestCases?.length > 0 && (
                  <div className="space-y-3 pt-3 border-t border-surface-800/80">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-surface-400">
                      Sample Test Cases
                    </h4>
                    {problem.sampleTestCases.map((tc, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-surface-950/80 border border-surface-800 space-y-2 font-mono text-xs"
                      >
                        <div>
                          <span className="text-surface-500 text-[11px] block">Input:</span>
                          <code className="text-emerald-400">{tc.input}</code>
                        </div>
                        <div>
                          <span className="text-surface-500 text-[11px] block">Output:</span>
                          <code className="text-cyan-400">{tc.expectedOutput}</code>
                        </div>
                        {tc.explanation && (
                          <div className="text-[11px] text-surface-400 font-sans pt-1 border-t border-surface-800/50">
                            <strong>Explanation:</strong> {tc.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Constraints */}
                {problem?.constraints?.length > 0 && (
                  <div className="space-y-2 pt-3 border-t border-surface-800/80">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-surface-400">
                      Constraints
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-xs text-surface-400 font-mono">
                      {problem.constraints.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Tags */}
                {problem?.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {problem.tags.map(t => (
                      <span
                        key={t}
                        className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface-800 text-surface-300 border border-surface-700/60"
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
                  submissions.map(sub => (
                    <div
                      key={sub._id}
                      className="flex items-center justify-between p-3 rounded-xl border border-surface-800 bg-surface-950/60"
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
                          className="font-mono text-[10px]"
                        >
                          {sub.status.toUpperCase()}
                        </Badge>
                        <span className="text-xs font-mono text-surface-400">
                          {sub.language}
                        </span>
                      </div>
                      <div className="text-xs font-mono text-surface-500">
                        {sub.runtimeMs ? `${sub.runtimeMs}ms` : '—'} •{' '}
                        {new Date(sub.submittedAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Monaco Code Editor & Execution Results Drawer */}
        <div className="lg:col-span-7 flex flex-col h-full min-h-0 gap-3">
          {/* Editor Container */}
          <div
            className={`flex flex-col min-h-0 rounded-2xl border border-surface-700 bg-surface-850 overflow-hidden shadow-lg transition-all duration-200 ${
              consoleOpen ? 'h-[50%]' : 'flex-1'
            }`}
          >
            {/* Editor Action Bar */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-surface-700 bg-surface-900">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-brand-400" />
                <select
                  value={language}
                  onChange={e => handleLanguageChange(e.target.value)}
                  className="rounded-lg bg-surface-850 border border-surface-700 text-xs text-surface-100 px-2.5 py-1 focus:outline-none focus:border-brand-500 font-mono"
                >
                  <option value="python">Python 3</option>
                  <option value="cpp">C++ (GCC)</option>
                  <option value="java">Java (OpenJDK)</option>
                  <option value="javascript">JavaScript (Node)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetStarterCode}
                  leftIcon={RotateCcw}
                  className="text-xs text-surface-400 hover:text-surface-200"
                >
                  Reset Starter
                </Button>
                {!consoleOpen && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setConsoleOpen(true);
                      setConsoleTab(submitVerdict || runResults ? 'result' : 'testcase');
                    }}
                    leftIcon={Terminal}
                    className="text-xs text-surface-400 hover:text-surface-200"
                  >
                    Console
                  </Button>
                )}
              </div>
            </div>

            {/* Monaco Editor Mount */}
            <div className="flex-1 w-full min-h-0">
              <Editor
                height="100%"
                language={getMonacoLang(language)}
                value={sourceCode}
                theme={isDark ? 'vs-dark' : 'light'}
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
          </div>

          {/* Bottom Half: Console & Proper Test Cases Viewer */}
          {consoleOpen && (
            <div className="h-[50%] flex flex-col min-h-0 rounded-2xl border border-surface-700 bg-surface-850 overflow-hidden shadow-xl animate-fade-in">
              {/* Console Header Bar */}
              <div className="flex items-center justify-between px-3.5 py-2 border-b border-surface-700 bg-surface-900">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="flex items-center gap-1.5 mr-2 text-xs font-bold text-surface-300">
                    <Terminal className="w-3.5 h-3.5 text-brand-400" />
                    <span className="hidden sm:inline">Console</span>
                  </div>

                  {/* Tabs */}
                  <div className="flex items-center gap-1 bg-surface-800/80 p-0.5 rounded-lg border border-surface-700/60">
                    <button
                      type="button"
                      onClick={() => setConsoleTab('testcase')}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                        consoleTab === 'testcase'
                          ? 'bg-surface-700 text-surface-100 shadow-sm'
                          : 'text-surface-400 hover:text-surface-200'
                      }`}
                    >
                      Testcase
                    </button>
                    <button
                      type="button"
                      onClick={() => setConsoleTab('result')}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                        consoleTab === 'result'
                          ? 'bg-surface-700 text-surface-100 shadow-sm'
                          : 'text-surface-400 hover:text-surface-200'
                      }`}
                    >
                      <span>Test Result</span>
                      {(isRunning || isSubmitting) && (
                        <div className="w-2 h-2 rounded-full bg-brand-400 animate-ping" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Verdict Badge in Header */}
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
                      className="font-mono text-xs uppercase"
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
                      className="font-mono text-xs"
                    >
                      {runResults.passedSamples}/{runResults.totalSamples} Passed
                    </Badge>
                  )}

                  <button
                    type="button"
                    onClick={() => setConsoleOpen(false)}
                    title="Minimize Console"
                    className="p-1 rounded-lg text-surface-400 hover:text-surface-200 hover:bg-surface-800 transition-colors"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Console Body */}
              <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
                {/* 1. TESTCASE TAB (Sample inputs defined for problem) */}
                {consoleTab === 'testcase' && (
                  <div className="space-y-3">
                    {/* Case selector chips */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {problem?.sampleTestCases?.map((tc, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedCaseIdx(idx)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium font-mono transition-all border ${
                            selectedCaseIdx === idx
                              ? 'bg-brand-500/20 border-brand-500/50 text-brand-300 shadow-sm'
                              : 'bg-surface-800/80 border-surface-700/80 text-surface-400 hover:text-surface-200'
                          }`}
                        >
                          Case {idx + 1}
                        </button>
                      ))}
                    </div>

                    {/* Selected Sample Case Input & Output */}
                    {problem?.sampleTestCases?.[selectedCaseIdx] && (
                      <div className="space-y-2.5 font-mono text-xs">
                        <div>
                          <span className="text-[11px] font-semibold text-surface-400 uppercase tracking-wider block mb-1">
                            Input
                          </span>
                          <pre className="p-3 rounded-xl bg-surface-900 border border-surface-750 text-surface-200 whitespace-pre-wrap selection:bg-brand-500/30">
                            {problem.sampleTestCases[selectedCaseIdx].input}
                          </pre>
                        </div>
                        <div>
                          <span className="text-[11px] font-semibold text-surface-400 uppercase tracking-wider block mb-1">
                            Expected Output
                          </span>
                          <pre className="p-3 rounded-xl bg-surface-900 border border-surface-750 text-surface-200 whitespace-pre-wrap selection:bg-brand-500/30">
                            {problem.sampleTestCases[selectedCaseIdx].output}
                          </pre>
                        </div>
                        {problem.sampleTestCases[selectedCaseIdx].explanation && (
                          <div>
                            <span className="text-[11px] font-semibold text-surface-400 uppercase tracking-wider block mb-1">
                              Explanation
                            </span>
                            <div className="p-2.5 rounded-xl bg-surface-800/40 border border-surface-750 text-surface-300 font-sans text-xs">
                              {problem.sampleTestCases[selectedCaseIdx].explanation}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 2. TEST RESULT TAB (Active runs, sample run results, or submission verdict) */}
                {consoleTab === 'result' && (
                  <div className="space-y-3">
                    {/* Running / Submitting In-Progress Banner */}
                    {(isRunning || isSubmitting) && (
                      <div className="flex items-center gap-3 p-4 rounded-xl border border-brand-500/30 bg-brand-500/10 text-xs font-mono text-brand-300 animate-pulse">
                        <div className="w-4 h-4 rounded-full border-2 border-brand-400 border-t-transparent animate-spin flex-shrink-0" />
                        <div>
                          <div className="font-semibold text-brand-200">
                            {isSubmitting
                              ? 'Evaluating Submission...'
                              : 'Executing Sample Test Cases...'}
                          </div>
                          <div className="text-[11px] text-brand-400/80 mt-0.5">
                            {isSubmitting
                              ? 'Evaluating code against complete test matrix & hidden edge cases via sandboxed Judge0...'
                              : 'Compiling source code and executing against sample test cases...'}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SUBMISSION VERDICT VIEW */}
                    {submitVerdict && !isSubmitting && (
                      <div className="space-y-3">
                        {/* Verdict Header Card */}
                        <div
                          className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            submitVerdict.status === 'accepted'
                              ? 'border-emerald-500/30 bg-emerald-500/10'
                              : submitVerdict.status === 'compile_error'
                              ? 'border-rose-500/30 bg-rose-500/10'
                              : 'border-amber-500/30 bg-amber-500/10'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {submitVerdict.status === 'accepted' ? (
                              <CheckCircle2 className="w-7 h-7 text-emerald-400 flex-shrink-0" />
                            ) : submitVerdict.status === 'compile_error' ? (
                              <AlertCircle className="w-7 h-7 text-rose-400 flex-shrink-0" />
                            ) : (
                              <XCircle className="w-7 h-7 text-rose-400 flex-shrink-0" />
                            )}
                            <div>
                              <div
                                className={`text-base font-bold font-mono tracking-tight ${
                                  submitVerdict.status === 'accepted'
                                    ? 'text-emerald-400'
                                    : 'text-rose-400'
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

                          {/* Metrics (Runtime & Memory) */}
                          <div className="flex items-center gap-3 text-xs font-mono text-surface-300">
                            {submitVerdict.runtimeMs !== undefined && (
                              <div className="flex items-center gap-1.5 bg-surface-900/60 px-3 py-1.5 rounded-lg border border-surface-700/60">
                                <Clock className="w-3.5 h-3.5 text-brand-400" />
                                <span>{submitVerdict.runtimeMs} ms</span>
                              </div>
                            )}
                            {submitVerdict.memoryKb !== undefined && submitVerdict.memoryKb > 0 && (
                              <div className="flex items-center gap-1.5 bg-surface-900/60 px-3 py-1.5 rounded-lg border border-surface-700/60">
                                <span>{Math.round(submitVerdict.memoryKb / 1024)} MB</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Compile Error Output if present */}
                        {(submitVerdict.compileError || submitVerdict.compileOutput) && (
                          <div>
                            <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider block mb-1">
                              Compiler Diagnostic
                            </span>
                            <pre className="p-3 rounded-xl bg-surface-900 border border-rose-500/30 text-rose-300 font-mono text-xs whitespace-pre-wrap">
                              {submitVerdict.compileError || submitVerdict.compileOutput}
                            </pre>
                          </div>
                        )}

                        {/* Test Case Traces (if available) */}
                        {submitVerdict.executionTrace?.length > 0 && (
                          <div className="space-y-2">
                            <span className="text-[11px] font-semibold text-surface-400 uppercase tracking-wider block">
                              Test Cases Evaluation Breakdown
                            </span>

                            {/* Case selector pills */}
                            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                              {submitVerdict.executionTrace.map((tc, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => setSelectedCaseIdx(idx)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-medium font-mono transition-all flex items-center gap-1.5 border ${
                                    selectedCaseIdx === idx
                                      ? 'bg-surface-700 border-surface-500 text-surface-100 shadow-sm'
                                      : 'bg-surface-850 border-surface-700/70 text-surface-400 hover:text-surface-200'
                                  }`}
                                >
                                  {tc.statusId === 3 || tc.statusDescription === 'Accepted' ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                  ) : (
                                    <XCircle className="w-3.5 h-3.5 text-rose-400" />
                                  )}
                                  <span>Case {tc.testCaseIndex || idx + 1}</span>
                                  {tc.isHidden && (
                                    <span className="text-[10px] text-surface-500">(Hidden)</span>
                                  )}
                                </button>
                              ))}
                            </div>

                            {/* Selected Trace Details */}
                            {submitVerdict.executionTrace[selectedCaseIdx] && (
                              <div className="p-3.5 rounded-xl border border-surface-700 bg-surface-900 space-y-2.5 font-mono text-xs">
                                {submitVerdict.executionTrace[selectedCaseIdx].isHidden ? (
                                  <div className="text-surface-400 text-xs italic py-2">
                                    🔒 Hidden system test case used for validation. Inputs and outputs are redacted to prevent hardcoding.
                                  </div>
                                ) : (
                                  <>
                                    {submitVerdict.executionTrace[selectedCaseIdx].input && (
                                      <div>
                                        <span className="text-[11px] font-semibold text-surface-400 uppercase tracking-wider block mb-1">
                                          Input
                                        </span>
                                        <pre className="p-2.5 rounded-lg bg-surface-950 border border-surface-800 text-surface-200 whitespace-pre-wrap">
                                          {submitVerdict.executionTrace[selectedCaseIdx].input}
                                        </pre>
                                      </div>
                                    )}
                                    <div>
                                      <span className="text-[11px] font-semibold text-surface-400 uppercase tracking-wider block mb-1">
                                        Your Output
                                      </span>
                                      <pre className="p-2.5 rounded-lg bg-surface-950 border border-surface-800 text-surface-200 whitespace-pre-wrap">
                                        {submitVerdict.executionTrace[selectedCaseIdx].stdout || '(Empty stdout)'}
                                      </pre>
                                    </div>
                                    {submitVerdict.executionTrace[selectedCaseIdx].expectedOutput && (
                                      <div>
                                        <span className="text-[11px] font-semibold text-surface-400 uppercase tracking-wider block mb-1">
                                          Expected Output
                                        </span>
                                        <pre className="p-2.5 rounded-lg bg-surface-950 border border-surface-800 text-surface-200 whitespace-pre-wrap">
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

                    {/* SAMPLE RUN RESULTS VIEW */}
                    {runResults && !submitVerdict && !isRunning && (
                      <div className="space-y-3">
                        {/* Sample Run Header */}
                        <div
                          className={`p-3.5 rounded-xl border flex items-center justify-between ${
                            runResults.passedSamples === runResults.totalSamples
                              ? 'border-emerald-500/30 bg-emerald-500/10'
                              : 'border-rose-500/30 bg-rose-500/10'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {runResults.passedSamples === runResults.totalSamples ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            ) : (
                              <XCircle className="w-5 h-5 text-rose-400" />
                            )}
                            <span
                              className={`text-sm font-bold font-mono ${
                                runResults.passedSamples === runResults.totalSamples
                                  ? 'text-emerald-400'
                                  : 'text-rose-400'
                              }`}
                            >
                              {runResults.passedSamples === runResults.totalSamples
                                ? 'All Sample Test Cases Passed!'
                                : `${runResults.passedSamples}/${runResults.totalSamples} Passed`}
                            </span>
                          </div>
                        </div>

                        {/* Horizontal Case Selector Pills */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                          {runResults.sampleResults?.map((sr, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setSelectedCaseIdx(idx)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium font-mono transition-all flex items-center gap-1.5 border ${
                                selectedCaseIdx === idx
                                  ? 'bg-surface-700 border-surface-500 text-surface-100 shadow-sm'
                                  : 'bg-surface-850 border-surface-700/70 text-surface-400 hover:text-surface-200'
                              }`}
                            >
                              {sr.passed ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <XCircle className="w-3.5 h-3.5 text-rose-400" />
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

                        {/* Selected Sample Case Details */}
                        {runResults.sampleResults?.[selectedCaseIdx] && (
                          <div className="p-3.5 rounded-xl border border-surface-700 bg-surface-900 space-y-2.5 font-mono text-xs">
                            {runResults.sampleResults[selectedCaseIdx].input && (
                              <div>
                                <span className="text-[11px] font-semibold text-surface-400 uppercase tracking-wider block mb-1">
                                  Input
                                </span>
                                <pre className="p-2.5 rounded-lg bg-surface-950 border border-surface-800 text-surface-200 whitespace-pre-wrap">
                                  {runResults.sampleResults[selectedCaseIdx].input}
                                </pre>
                              </div>
                            )}

                            <div>
                              <span className="text-[11px] font-semibold text-surface-400 uppercase tracking-wider block mb-1">
                                Your Output
                              </span>
                              <pre
                                className={`p-2.5 rounded-lg bg-surface-950 border whitespace-pre-wrap ${
                                  runResults.sampleResults[selectedCaseIdx].passed
                                    ? 'border-emerald-500/30 text-emerald-300'
                                    : 'border-rose-500/30 text-rose-300'
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
                                <pre className="p-2.5 rounded-lg bg-surface-950 border border-surface-800 text-surface-200 whitespace-pre-wrap">
                                  {runResults.sampleResults[selectedCaseIdx].expectedOutput}
                                </pre>
                              </div>
                            )}

                            {runResults.sampleResults[selectedCaseIdx].compileError && (
                              <div>
                                <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider block mb-1">
                                  Compiler Output
                                </span>
                                <pre className="p-2.5 rounded-lg bg-surface-950 border border-rose-500/30 text-rose-300 whitespace-pre-wrap">
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
                        <Terminal className="w-8 h-8 mx-auto text-surface-500 opacity-60" />
                        <div className="text-xs font-mono">
                          Press <strong className="text-surface-200">Run</strong> or{' '}
                          <strong className="text-surface-200">Submit</strong> (or Ctrl+Enter) to evaluate your code.
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
