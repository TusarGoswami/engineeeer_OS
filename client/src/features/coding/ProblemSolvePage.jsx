import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { codingService } from '../../services/coding.service.js';
import Card from '../../components/Card.jsx';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import { useToast } from '../../components/Toast.jsx';

export function ProblemSolvePage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('description'); // 'description' | 'submissions'
  const [language, setLanguage] = useState('python');
  const [sourceCode, setSourceCode] = useState('');
  const [submissions, setSubmissions] = useState([]);
  const [lastSavedTime, setLastSavedTime] = useState(null);

  // Execution states
  const [isRunning, setIsRunning] = useState(false);
  const [runResults, setRunResults] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitVerdict, setSubmitVerdict] = useState(null);

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
      setIsSubmitting(true);
      setRunResults(null);
      setSubmitVerdict(null);

      const res = await codingService.submitSolution(problem._id, sourceCode, language);

      if (res.verdict) {
        setSubmitVerdict(res.verdict);
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
            if (sub.status !== 'pending' && sub.status !== 'running') {
              clearInterval(interval);
              setSubmitVerdict(sub);
              setIsSubmitting(false);
              fetchSubmissions(problem._id);
              if (sub.status === 'accepted') {
                showToast('Accepted! Problem solved.', 'success');
              } else {
                showToast(`Verdict: ${sub.status.toUpperCase()}`, 'error');
              }
            } else if (attempts > 15) {
              clearInterval(interval);
              setIsSubmitting(false);
              showToast('Evaluation timed out. Check Submissions tab.', 'info');
            }
          } catch {
            clearInterval(interval);
            setIsSubmitting(false);
          }
        }, 1000);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit solution', 'error');
      setIsSubmitting(false);
    }
  };

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
            className="p-1.5 rounded-xl border border-surface-800 bg-surface-900 text-surface-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
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
        <div className="lg:col-span-5 flex flex-col h-full min-h-0 rounded-2xl border border-surface-800 bg-surface-900/60 overflow-hidden shadow-lg">
          <div className="flex items-center border-b border-surface-800 bg-surface-950/40 px-3 pt-2">
            <button
              type="button"
              onClick={() => setActiveTab('description')}
              className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === 'description'
                  ? 'border-brand-500 text-white'
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
                  ? 'border-brand-500 text-white'
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
        <div className="lg:col-span-7 flex flex-col h-full min-h-0 space-y-2">
          {/* Editor Container */}
          <div className="flex-1 flex flex-col min-h-0 rounded-2xl border border-surface-800 bg-[#1e1e1e] overflow-hidden shadow-lg">
            {/* Editor Action Bar */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-surface-800 bg-surface-950/70">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-brand-400" />
                <select
                  value={language}
                  onChange={e => handleLanguageChange(e.target.value)}
                  className="rounded-lg bg-surface-900 border border-surface-700 text-xs text-white px-2.5 py-1 focus:outline-none focus:border-brand-500 font-mono"
                >
                  <option value="python">Python 3</option>
                  <option value="cpp">C++ (GCC)</option>
                  <option value="java">Java (OpenJDK)</option>
                  <option value="javascript">JavaScript (Node)</option>
                </select>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetStarterCode}
                leftIcon={RotateCcw}
                className="text-xs text-surface-400 hover:text-surface-200"
              >
                Reset Starter
              </Button>
            </div>

            {/* Monaco Editor Mount */}
            <div className="flex-1 w-full min-h-0">
              <Editor
                height="100%"
                language={getMonacoLang(language)}
                value={sourceCode}
                theme="vs-dark"
                onChange={handleCodeChange}
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

          {/* Execution Drawer (Sample Runs or Submission Verdict) */}
          {(runResults || submitVerdict) && (
            <Card className="max-h-60 overflow-y-auto p-4 border-surface-800 bg-surface-950/90 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-surface-300">
                    {submitVerdict ? 'Submission Verdict' : 'Sample Run Results'}
                  </span>
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
                      className="font-mono text-xs"
                    >
                      {submitVerdict.status.toUpperCase()}
                    </Badge>
                  )}
                  {runResults && (
                    <span className="text-xs font-mono text-surface-400">
                      {runResults.passedSamples}/{runResults.totalSamples} Passed
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setRunResults(null);
                    setSubmitVerdict(null);
                  }}
                  className="text-xs text-surface-500 hover:text-surface-300"
                >
                  Dismiss
                </button>
              </div>

              {/* Sample Test Results List */}
              {runResults?.sampleResults && (
                <div className="space-y-2">
                  {runResults.sampleResults.map((sr, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-xl border text-xs font-mono space-y-1 ${
                        sr.passed
                          ? 'border-emerald-500/30 bg-emerald-500/10'
                          : 'border-rose-500/30 bg-rose-500/10'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold flex items-center gap-1.5">
                          {sr.passed ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-rose-400" />
                          )}
                          Case {sr.sampleIndex || idx + 1}
                        </span>
                        <span className="text-[11px] opacity-70">
                          {sr.runtimeMs ? `${sr.runtimeMs}ms` : ''}
                        </span>
                      </div>
                      {!sr.passed && sr.actualOutput && (
                        <div className="pt-1 text-[11px] text-rose-300">
                          <strong>Output:</strong> {sr.actualOutput}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Submission Verdict Details */}
              {submitVerdict && (
                <div className="text-xs space-y-1.5 font-mono">
                  <div className="flex items-center gap-4 text-surface-300">
                    <span>
                      Passed:{' '}
                      <strong className="text-white">
                        {submitVerdict.passedCount || 0} / {submitVerdict.totalTestCases || 0}
                      </strong>
                    </span>
                    {submitVerdict.runtimeMs && (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {submitVerdict.runtimeMs}ms
                      </span>
                    )}
                  </div>
                  {submitVerdict.compileOutput && (
                    <div className="p-2 rounded bg-surface-900 border border-surface-800 text-rose-400 font-mono text-[11px] whitespace-pre-wrap">
                      {submitVerdict.compileOutput}
                    </div>
                  )}
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProblemSolvePage;
