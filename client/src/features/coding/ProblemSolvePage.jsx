import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { codingService } from '../../services/coding.service.js';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';

export function ProblemSolvePage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('description'); // 'description' | 'submissions'
  const [language, setLanguage] = useState('python');
  const [sourceCode, setSourceCode] = useState('');
  const [submissions, setSubmissions] = useState([]);

  // Execution states
  const [isRunning, setIsRunning] = useState(false);
  const [runResults, setRunResults] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitVerdict, setSubmitVerdict] = useState(null);

  useEffect(() => {
    fetchProblem();
  }, [slug]);

  const fetchProblem = async () => {
    try {
      setLoading(true);
      const data = await codingService.getProblemBySlug(slug);
      setProblem(data);
      const defaultCode = data.starterCode?.[language] || '# Write your solution here\n';
      setSourceCode(defaultCode);
      fetchSubmissions(data._id);
    } catch {
      // Error handling
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async problemId => {
    try {
      const subs = await codingService.getMySubmissions(problemId);
      setSubmissions(subs || []);
    } catch {
      // Handled silently
    }
  };

  const handleLanguageChange = newLang => {
    setLanguage(newLang);
    if (problem?.starterCode?.[newLang]) {
      setSourceCode(problem.starterCode[newLang]);
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
    } catch (err) {
      setRunResults({
        totalSamples: 1,
        passedSamples: 0,
        sampleResults: [
          {
            sampleIndex: 1,
            passed: false,
            actualOutput: err.response?.data?.error?.message || 'Execution error',
          },
        ],
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmitSolution = async () => {
    if (!problem) return;
    try {
      setIsSubmitting(true);
      setSubmitVerdict(null);
      setRunResults(null);

      const res = await codingService.submitSolution(problem._id, sourceCode, language);
      const submissionId = res.submissionId;

      // Poll submission status until finished (accepted, wrong_answer, etc.)
      let attempts = 0;
      const pollInterval = setInterval(async () => {
        attempts++;
        try {
          const status = await codingService.getSubmissionStatus(submissionId);
          if (status.status !== 'queued' && status.status !== 'running') {
            clearInterval(pollInterval);
            setSubmitVerdict(status);
            setIsSubmitting(false);
            fetchSubmissions(problem._id);
          } else if (attempts > 15) {
            clearInterval(pollInterval);
            setIsSubmitting(false);
          }
        } catch {
          clearInterval(pollInterval);
          setIsSubmitting(false);
        }
      }, 1000);
    } catch (err) {
      setIsSubmitting(false);
      setSubmitVerdict({
        status: 'runtime_error',
        compileError: err.response?.data?.error?.message || 'Submission failed',
      });
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading problem workspace...
      </div>
    );
  }

  if (!problem) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center' }}>
        <h2>Problem not found</h2>
        <Button onClick={() => navigate('/coding')}>Back to Problems</Button>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 120px)',
        gap: '1rem',
      }}
    >
      {/* Top Navbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Button variant="ghost" size="sm" onClick={() => navigate('/coding')}>
            ← Problems
          </Button>
          <h2
            style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}
          >
            {problem.title}
          </h2>
          <Badge
            variant={
              problem.difficulty === 'easy'
                ? 'success'
                : problem.difficulty === 'medium'
                  ? 'warning'
                  : 'danger'
            }
          >
            {problem.difficulty}
          </Badge>
        </div>

        {/* Run & Submit Action buttons */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRunSampleTests}
            disabled={isRunning || isSubmitting}
          >
            {isRunning ? 'Running Samples...' : 'Run Samples'}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmitSolution}
            disabled={isRunning || isSubmitting}
          >
            {isSubmitting ? 'Evaluating...' : 'Submit Solution'}
          </Button>
        </div>
      </div>

      {/* Main Workspace Split Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1rem',
          flex: 1,
          minHeight: 0,
        }}
      >
        {/* Left Column: Problem description & Submissions */}
        <Card
          style={{
            display: 'flex',
            flexDirection: 'column',
            padding: 0,
            overflow: 'hidden',
            height: '100%',
          }}
        >
          {/* Tabs */}
          <div
            style={{
              display: 'flex',
              borderBottom: '1px solid var(--border)',
              background: 'rgba(255, 255, 255, 0.02)',
            }}
          >
            <button
              onClick={() => setActiveTab('description')}
              style={{
                padding: '10px 18px',
                border: 'none',
                background: 'transparent',
                fontWeight: 600,
                fontSize: '0.9rem',
                color:
                  activeTab === 'description' ? 'var(--primary, #6366f1)' : 'var(--text-muted)',
                borderBottom:
                  activeTab === 'description' ? '2px solid var(--primary, #6366f1)' : 'none',
                cursor: 'pointer',
              }}
            >
              Description
            </button>
            <button
              onClick={() => setActiveTab('submissions')}
              style={{
                padding: '10px 18px',
                border: 'none',
                background: 'transparent',
                fontWeight: 600,
                fontSize: '0.9rem',
                color:
                  activeTab === 'submissions' ? 'var(--primary, #6366f1)' : 'var(--text-muted)',
                borderBottom:
                  activeTab === 'submissions' ? '2px solid var(--primary, #6366f1)' : 'none',
                cursor: 'pointer',
              }}
            >
              Submissions ({submissions.length})
            </button>
          </div>

          {/* Tab Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
            {activeTab === 'description' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ lineHeight: 1.6, color: 'var(--text-main)', whiteSpace: 'pre-line' }}>
                  {problem.statementMarkdown}
                </div>

                {/* Tags */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {(problem.tags || []).map(t => (
                    <span
                      key={t}
                      style={{
                        fontSize: '0.75rem',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>

                {/* Sample Test Cases */}
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '1rem 0 0.5rem 0' }}>
                    Sample Test Cases
                  </h4>
                  {(problem.sampleTestCases || []).map((sample, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: 'rgba(0, 0, 0, 0.25)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        padding: '0.75rem 1rem',
                        marginBottom: '0.75rem',
                        fontSize: '0.85rem',
                      }}
                    >
                      <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>
                        <strong>Input:</strong>
                        <pre
                          style={{
                            margin: '4px 0',
                            fontFamily: 'monospace',
                            color: 'var(--text-main)',
                          }}
                        >
                          {sample.input}
                        </pre>
                      </div>
                      <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>
                        <strong>Output:</strong>
                        <pre
                          style={{
                            margin: '4px 0',
                            fontFamily: 'monospace',
                            color: 'var(--emerald-400, #34d399)',
                          }}
                        >
                          {sample.output}
                        </pre>
                      </div>
                      {sample.explanation && (
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                          <em>Explanation: {sample.explanation}</em>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Submissions History */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {submissions.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>
                    No submissions yet. Submit your solution to see history!
                  </p>
                ) : (
                  submissions.map(sub => (
                    <div
                      key={sub._id}
                      style={{
                        padding: '10px 14px',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'rgba(255, 255, 255, 0.02)',
                      }}
                    >
                      <div>
                        <Badge
                          variant={
                            sub.status === 'accepted'
                              ? 'success'
                              : sub.status === 'compile_error'
                                ? 'danger'
                                : 'warning'
                          }
                        >
                          {sub.status.toUpperCase()}
                        </Badge>
                        <span
                          style={{
                            fontSize: '0.8rem',
                            color: 'var(--text-muted)',
                            marginLeft: '10px',
                          }}
                        >
                          {sub.language}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {sub.runtimeMs ? `${sub.runtimeMs}ms` : '—'} •{' '}
                        {new Date(sub.submittedAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Right Column: Code Editor & Execution Drawer */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            gap: '1rem',
            minHeight: 0,
          }}
        >
          {/* Editor Header */}
          <Card
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: 0,
              overflow: 'hidden',
              flex: 1,
              minHeight: 0,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 14px',
                borderBottom: '1px solid var(--border)',
                background: 'rgba(255, 255, 255, 0.02)',
              }}
            >
              <select
                value={language}
                onChange={e => handleLanguageChange(e.target.value)}
                style={{
                  background: 'var(--bg-glass, rgba(0, 0, 0, 0.3))',
                  border: '1px solid var(--border)',
                  color: 'var(--text-main)',
                  borderRadius: '4px',
                  padding: '4px 10px',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              >
                <option value="python">Python 3</option>
                <option value="cpp">C++ (GCC)</option>
                <option value="java">Java (OpenJDK)</option>
                <option value="javascript">JavaScript (Node)</option>
              </select>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (problem?.starterCode?.[language]) {
                    setSourceCode(problem.starterCode[language]);
                  }
                }}
              >
                Reset Starter Code
              </Button>
            </div>

            {/* Code Input Area */}
            <textarea
              value={sourceCode}
              onChange={e => setSourceCode(e.target.value)}
              spellCheck="false"
              style={{
                flex: 1,
                width: '100%',
                padding: '1rem',
                border: 'none',
                outline: 'none',
                background: '#0d1117',
                color: '#e6edf3',
                fontFamily: 'Consolas, "Fira Code", monospace',
                fontSize: '0.9rem',
                lineHeight: 1.5,
                resize: 'none',
                boxSizing: 'border-box',
              }}
            />
          </Card>

          {/* Execution Drawer (Sample Runs or Submission Verdict) */}
          {(runResults || submitVerdict) && (
            <Card
              style={{
                maxHeight: '220px',
                overflowY: 'auto',
                background: 'rgba(13, 17, 23, 0.95)',
                border: '1px solid var(--border)',
              }}
            >
              {runResults && (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px',
                    }}
                  >
                    <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700 }}>
                      Sample Test Run Results
                    </h4>
                    <Badge
                      variant={
                        runResults.passedSamples === runResults.totalSamples ? 'success' : 'danger'
                      }
                    >
                      {runResults.passedSamples} / {runResults.totalSamples} Passed
                    </Badge>
                  </div>
                  {runResults.sampleResults.map((sr, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '4px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        marginBottom: '6px',
                        fontSize: '0.8rem',
                      }}
                    >
                      <div>
                        Sample #{sr.sampleIndex}:{' '}
                        <strong
                          style={{
                            color: sr.passed
                              ? 'var(--emerald-400, #34d399)'
                              : 'var(--rose-400, #f87171)',
                          }}
                        >
                          {sr.passed ? 'PASSED' : 'FAILED'}
                        </strong>
                      </div>
                      {!sr.passed && (
                        <div style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
                          Actual: <span style={{ fontFamily: 'monospace' }}>{sr.actualOutput}</span>{' '}
                          | Expected:{' '}
                          <span style={{ fontFamily: 'monospace' }}>{sr.expectedOutput}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {submitVerdict && (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px',
                    }}
                  >
                    <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700 }}>
                      Submission Result
                    </h4>
                    <Badge
                      variant={
                        submitVerdict.status === 'accepted'
                          ? 'success'
                          : submitVerdict.status === 'compile_error'
                            ? 'danger'
                            : 'warning'
                      }
                    >
                      {submitVerdict.status?.toUpperCase()}
                    </Badge>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Passed {submitVerdict.testCasesPassed || 0} /{' '}
                    {submitVerdict.totalTestCases || 0} test cases.
                    {submitVerdict.runtimeMs !== undefined &&
                      ` Runtime: ${submitVerdict.runtimeMs}ms.`}
                  </div>
                  {submitVerdict.compileError && (
                    <pre
                      style={{
                        background: 'rgba(248, 113, 113, 0.1)',
                        border: '1px solid rgba(248, 113, 113, 0.3)',
                        color: 'var(--rose-400, #f87171)',
                        padding: '8px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        overflowX: 'auto',
                        marginTop: '8px',
                      }}
                    >
                      {submitVerdict.compileError}
                    </pre>
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
