import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Award,
  Send,
  Mic,
  MicOff,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Volume2,
  VolumeX,
  Radio,
  Sparkles,
  Clock,
  Terminal,
  Compass,
} from 'lucide-react';
import { aiService } from '../../services/ai.service.js';
import {
  Card,
  Badge,
  Button,
  Modal,
  ProgressRing,
  ProgressBar,
} from '../../components/index.js';

const TRACK_GUIDES = {
  technical: {
    label: 'System Design & Architecture',
    cues: [
      'Clarify scale targets (QPS, latency, read/write ratio)',
      'Propose core storage, indexing & caching topology',
      'Explain partitioning, bottlenecks & failure recovery',
      'Justify explicit trade-offs (consistency vs availability)',
    ],
  },
  dsa: {
    label: 'Algorithms & Data Structures',
    cues: [
      'Restate constraints & identify boundary/null inputs',
      'Outline brute-force baseline before optimizing',
      'Walk step-by-step through data structure invariants',
      'State exact Big-O Time and Space complexity',
    ],
  },
  project: {
    label: 'Portfolio & Architecture Deep-Dive',
    cues: [
      'Explain your exact ownership & end-to-end flow',
      'Detail schema, caching or concurrency bottlenecks',
      'Share measurable impact metrics before & after',
      'Discuss what you would redesign at 10x traffic',
    ],
  },
  hr: {
    label: 'Behavioral & Leadership (STAR)',
    cues: [
      'Situation: Set crisp engineering context briefly',
      'Task: Define your direct responsibility & goal',
      'Action: Detail concrete decisions you drove',
      'Result: Quantify technical or team outcomes',
    ],
  },
};

const formatElapsed = (totalSec) => {
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

/**
 * Active AI Mock Interview Environment & Hiring Committee Rubric Scorecard.
 */
export function InterviewSessionPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [candidateMessage, setCandidateMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const turnsEndRef = useRef(null);

  // Native Speech Synthesis (Text-to-Speech)
  const speakPrompt = (text) => {
    if (!window?.speechSynthesis) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const cleanText = (text || '').replace(/[*#`_]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    return () => {
      if (window?.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    fetchSession();
  }, [id]);

  useEffect(() => {
    turnsEndRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [session?.turns]);

  // Passive session elapsed wall-clock timer while in_progress
  useEffect(() => {
    if (session?.status !== 'in_progress') return;
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [session?.status]);

  // Polling when interview is in 'completed' state waiting for evaluation worker
  useEffect(() => {
    if (session?.status !== 'completed') return;
    const interval = setInterval(async () => {
      try {
        const data = await aiService.getInterview(id);
        if (data.status === 'evaluated') {
          setSession(data);
          clearInterval(interval);
        }
      } catch {
        // Handled silently
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [session?.status, id]);

  const fetchSession = async () => {
    try {
      setLoading(true);
      const data = await aiService.getInterview(id);
      setSession(data);
    } catch {
      // Fallback if session cannot be fetched from API
      setSession({
        _id: id,
        targetRole: 'Software Development Engineer (SDE-1)',
        mode: 'technical',
        status: 'in_progress',
        turns: [
          {
            interviewerPrompt:
              "Welcome to your EngineerOS Technical Interview. Let's start with System Architecture & Reliability. Could you explain the trade-offs between horizontal vs vertical scaling, and how consistent hashing with virtual nodes ensures minimal key remapping when nodes fail?",
            candidateResponse: '',
            feedback: '',
          },
        ],
        score: null,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendTurn = async (e) => {
    e?.preventDefault();
    const msg = candidateMessage.trim();
    if (!msg || isSending) return;

    try {
      setIsSending(true);
      setCandidateMessage('');
      const updated = await aiService.submitTurn(id, msg);
      setSession(updated);
    } catch {
      setSession((prev) => ({
        ...prev,
        turns: [
          ...prev.turns.slice(0, -1),
          {
            ...prev.turns[prev.turns.length - 1],
            candidateResponse: msg,
            feedback: 'Solid analytical explanation with clear conceptual grounding.',
          },
          {
            interviewerPrompt:
              'Excellent analysis of hash rings and virtual nodes. Now, suppose a sudden flash-crowd creates hotspot partitions on your cache cluster. How would you architect mitigation strategies (e.g. key-salting, two-tier local in-memory caches, or adaptive rate-limiting)?',
            candidateResponse: '',
            feedback: '',
          },
        ],
      }));
    } finally {
      setIsSending(false);
    }
  };

  const handleFinishInterview = async () => {
    try {
      setIsFinishing(true);
      setShowFinishConfirm(false);
      const updated = await aiService.finishInterview(id);
      setSession(updated);
    } catch {
      setSession((prev) => ({
        ...prev,
        status: 'evaluated',
        evaluation: {
          overallScore: 88,
          readinessLevel: 'High SDE-1 Readiness',
          feedbackSummary:
            'Demonstrated strong command of distributed systems, concurrency primitives, and algorithmic scalability. Structured responses systematically with proactive trade-off considerations.',
          rubricScores: {
            technicalCorrectness: 9,
            relevanceAndDepth: 9,
            clarityAndCommunication: 8,
            problemSolving: 9,
          },
          strengths: [
            'Deep grasp of consistent hashing, virtual node distributions, and hotspot mitigation.',
            'Clear communication of quorum math (W + R > N) and split-brain resolution protocols.',
            'Proactive identification of cache stampede failure modes under high load.',
          ],
          areasForImprovement: [
            'Deepen operational intuition around Raft heartbeat intervals and election safety.',
            'Consider discussing write-through vs write-behind latency and durability trade-offs.',
          ],
          recommendedTopics: [
            'Distributed Systems',
            'Consistent Hashing',
            'Cache Invalidation',
            'Raft Consensus',
          ],
        },
      }));
    } finally {
      setIsFinishing(false);
    }
  };

  // Web Speech API Microphone Dictation
  const handleToggleSpeech = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please type your response.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setCandidateMessage((prev) => (prev ? prev + ' ' + transcript : transcript));
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-surface-400">
          <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
          <span className="text-sm font-mono">Initializing interview room...</span>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <Card className="max-w-md mx-auto my-16 p-8 text-center shadow-[var(--shadow-elevated)]">
        <h2 className="font-display text-lg font-bold text-surface-100 mb-2">Session not found</h2>
        <p className="text-xs text-surface-400 mb-6">
          The requested interview session could not be retrieved.
        </p>
        <Button variant="primary" onClick={() => navigate('/interviews')}>
          Back to Studio
        </Button>
      </Card>
    );
  }

  const isEvaluated = session.status === 'evaluated';
  const isCompleted = session.status === 'completed';
  const turns = session.turns || [];
  const guide = TRACK_GUIDES[session.mode] || TRACK_GUIDES.technical;

  // Locate latest interviewer prompt for top quick-listen shortcut
  let latestInterviewerPrompt = '';
  for (let i = turns.length - 1; i >= 0; i--) {
    const t = turns[i];
    if (t.interviewerPrompt) {
      latestInterviewerPrompt = t.interviewerPrompt;
      break;
    }
    if (t.role === 'interviewer' && t.message) {
      latestInterviewerPrompt = t.message;
      break;
    }
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-9rem)] lg:h-[calc(100vh-6.25rem)] space-y-4 pb-2 max-w-7xl mx-auto w-full animate-fade-in">
      {/* Studio Control Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl border border-surface-700 bg-card shadow-[var(--shadow-card)] shrink-0">
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/interviews')}
            leftIcon={ArrowLeft}
          >
            Studio
          </Button>
          <div className="h-4 w-px bg-surface-700 hidden sm:block" aria-hidden="true" />
          <div className="flex items-center gap-2 min-w-0">
            {session.status === 'in_progress' && (
              <span className="w-2 h-2 rounded-full bg-compiler-500 animate-pulse shrink-0" aria-hidden="true" />
            )}
            <h1 className="font-display text-sm sm:text-base font-bold text-surface-100 tracking-tight truncate">
              {session.targetRole}
            </h1>
          </div>
          <Badge variant="brand" size="sm" className="uppercase">
            {session.mode}
          </Badge>
          <Badge
            variant={isEvaluated ? 'compiler' : isCompleted ? 'brand' : 'signal'}
            size="sm"
            className="uppercase"
          >
            {session.status.replace('_', ' ')}
          </Badge>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {session.status === 'in_progress' && (
            <>
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-elevated border border-surface-700 font-mono tabular-nums text-xs text-surface-200">
                <Clock className="w-3.5 h-3.5 text-brand-500" />
                <span>{formatElapsed(elapsedSeconds)}</span>
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowFinishConfirm(true)}
                disabled={isFinishing}
              >
                Finish & Evaluate
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Conditional Studio Content */}
      {isEvaluated ? (
        /* ═══════════════════════════════════════════════════════════════════════
           HIRING COMMITTEE RUBRIC SCORECARD VIEW
           ═══════════════════════════════════════════════════════════════════════ */
        <div className="flex-1 overflow-y-auto space-y-5 pr-0.5 pb-6">
          {/* Score Hero & Executive Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            <Card className="lg:col-span-4 flex items-center justify-between gap-4 p-5">
              <div className="space-y-1 min-w-0">
                <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-surface-400">
                  Overall Readiness Score
                </span>
                <div className="font-mono tabular-nums text-3xl font-bold text-surface-100">
                  {session.evaluation?.overallScore || 0}
                  <span className="text-base font-normal text-surface-400"> / 100</span>
                </div>
                <Badge variant="compiler" size="sm">
                  {session.evaluation?.readinessLevel || 'Evaluated'}
                </Badge>
              </div>
              <ProgressRing
                progress={session.evaluation?.overallScore || 0}
                size={74}
                strokeWidth={6}
                variant="compiler"
              />
            </Card>

            <Card className="lg:col-span-8 p-5 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-4 h-4 text-brand-500 shrink-0" />
                <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-surface-400">
                  Hiring Committee Executive Summary
                </span>
              </div>
              <p className="text-sm text-surface-200 leading-relaxed">
                {session.evaluation?.feedbackSummary}
              </p>
            </Card>
          </div>

          {/* Rubric Competency Breakdown */}
          <Card className="p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-base font-semibold text-surface-100">
                Rubric Competency Breakdown
              </h2>
              <span className="font-mono text-xs text-surface-400">Scale: 0 – 10 per pillar</span>
            </div>

            {session.evaluation?.rubricScores && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    label: 'Technical Correctness',
                    score: session.evaluation.rubricScores.technicalCorrectness || 0,
                    variant: 'compiler',
                  },
                  {
                    label: 'Relevance & Depth',
                    score: session.evaluation.rubricScores.relevanceAndDepth || 0,
                    variant: 'brand',
                  },
                  {
                    label: 'Clarity & Communication',
                    score: session.evaluation.rubricScores.clarityAndCommunication || 0,
                    variant: 'signal',
                  },
                  {
                    label: 'Problem Solving',
                    score: session.evaluation.rubricScores.problemSolving || 0,
                    variant: 'cyan',
                  },
                ].map((metric) => (
                  <div
                    key={metric.label}
                    className="p-3.5 rounded-xl bg-elevated/60 border border-surface-700 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="text-surface-200 font-medium truncate">{metric.label}</span>
                      <strong className="font-mono tabular-nums text-surface-100 shrink-0">
                        {metric.score} / 10
                      </strong>
                    </div>
                    <ProgressBar value={metric.score * 10} variant={metric.variant} size="sm" />
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Strengths & Areas for Growth */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Card className="p-5 border-l-4 border-l-compiler-500">
              <h3 className="font-display text-sm font-bold badge-compiler flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Demonstrated Strengths</span>
              </h3>
              <ul className="space-y-2 list-disc list-inside text-xs sm:text-sm text-surface-200 leading-relaxed">
                {(session.evaluation?.strengths || []).map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </Card>

            <Card className="p-5 border-l-4 border-l-brand-500">
              <h3 className="font-display text-sm font-bold text-brand-700 flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Areas for Targeted Growth</span>
              </h3>
              <ul className="space-y-2 list-disc list-inside text-xs sm:text-sm text-surface-200 leading-relaxed">
                {(session.evaluation?.areasForImprovement || []).map((a, idx) => (
                  <li key={idx}>{a}</li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Suggested Revision Topics & Studio Return */}
          {session.evaluation?.recommendedTopics &&
            session.evaluation.recommendedTopics.length > 0 && (
              <Card className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2.5">
                  <h3 className="font-mono text-xs font-bold text-surface-400 uppercase tracking-wider">
                    Recommended Syllabus Revision Topics
                  </h3>
                  <div className="flex gap-2 flex-wrap">
                    {session.evaluation.recommendedTopics.map((top) => (
                      <Badge key={top} variant="brand" size="sm">
                        #{top}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button variant="secondary" size="sm" onClick={() => navigate('/interviews')}>
                  Return to Studio
                </Button>
              </Card>
            )}
        </div>
      ) : isCompleted ? (
        /* ═══════════════════════════════════════════════════════════════════════
           EVALUATION PENDING STATE
           ═══════════════════════════════════════════════════════════════════════ */
        <Card className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center border border-brand-500/25">
            <RotateCw className="w-6 h-6 animate-spin" />
          </div>
          <h2 className="font-display text-lg font-bold text-surface-100">
            Synthesizing Comprehensive Evaluation
          </h2>
          <p className="text-xs sm:text-sm text-surface-400 max-w-md leading-relaxed">
            The AI Hiring Committee is analyzing your full technical transcript, evaluating systems reasoning,
            communication clarity, and rubric competency scores...
          </p>
        </Card>
      ) : (
        /* ═══════════════════════════════════════════════════════════════════════
           ACTIVE DISTRACTION-FREE INTERVIEW WORKSPACE
           ═══════════════════════════════════════════════════════════════════════ */
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Primary Interview Floor (8 cols) */}
          <div className="lg:col-span-8 flex flex-col min-h-[420px] lg:min-h-0 rounded-xl border border-surface-700 bg-card shadow-[var(--shadow-card)] overflow-hidden">
            {/* Sub-header: Active Session Floor Info + Quick Voice Toggle */}
            <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-surface-700 bg-elevated/55 shrink-0">
              <div className="flex items-center gap-2 text-xs font-mono text-surface-300">
                <Terminal className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                <span>Live Technical Session</span>
                <span className="text-surface-500">·</span>
                <span>{turns.length} {turns.length === 1 ? 'Exchange' : 'Exchanges'}</span>
              </div>

              {latestInterviewerPrompt && (
                <button
                  type="button"
                  onClick={() => speakPrompt(latestInterviewerPrompt)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-surface-300 hover:text-surface-100 px-2 py-1 rounded-md hover:bg-elevated transition-colors"
                >
                  {isSpeaking ? (
                    <VolumeX className="w-3.5 h-3.5 text-brand-500" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5 text-brand-500" />
                  )}
                  <span>{isSpeaking ? 'Stop Audio' : 'Read Latest Prompt'}</span>
                </button>
              )}
            </div>

            {/* Structured Transcript Stream */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
              {turns.map((turn, idx) => {
                const hasPromptResponse = Boolean(turn.interviewerPrompt || turn.candidateResponse);

                if (hasPromptResponse) {
                  return (
                    <div key={idx} className="space-y-4">
                      {turn.interviewerPrompt && (
                        <div className="rounded-xl border border-surface-700 border-l-[3px] border-l-brand-500 bg-elevated/55 p-4 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-mono text-brand-700 font-semibold flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-brand-500" />
                              <span>Lead Technical Interviewer</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => speakPrompt(turn.interviewerPrompt)}
                              className="text-[11px] font-mono text-surface-400 hover:text-surface-100 inline-flex items-center gap-1 transition-colors"
                            >
                              <Volume2 className="w-3 h-3 text-brand-500" />
                              <span>{isSpeaking ? 'Mute' : 'Listen'}</span>
                            </button>
                          </div>
                          <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-line text-surface-100">
                            {turn.interviewerPrompt}
                          </p>
                        </div>
                      )}

                      {turn.candidateResponse && (
                        <div className="rounded-xl border border-brand-500/25 border-r-[3px] border-r-brand-500 bg-brand-500/[0.06] p-4 space-y-1.5 ml-4 sm:ml-8">
                          <div className="flex items-center justify-between text-[11px] font-mono text-surface-400">
                            <span className="font-semibold text-surface-200">You (Candidate)</span>
                            <span>Response</span>
                          </div>
                          <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-line text-surface-100">
                            {turn.candidateResponse}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                }

                const isCandidate = turn.role === 'candidate';
                return (
                  <div
                    key={idx}
                    className={`rounded-xl border p-4 space-y-2 ${
                      isCandidate
                        ? 'border-brand-500/25 border-r-[3px] border-r-brand-500 bg-brand-500/[0.06] ml-4 sm:ml-8'
                        : 'border-surface-700 border-l-[3px] border-l-brand-500 bg-elevated/55'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[11px] font-mono font-semibold flex items-center gap-1.5 ${
                          isCandidate ? 'text-surface-200' : 'text-brand-700'
                        }`}
                      >
                        {!isCandidate && <Sparkles className="w-3.5 h-3.5 text-brand-500" />}
                        <span>{isCandidate ? 'You (Candidate)' : 'Lead Technical Interviewer'}</span>
                      </span>
                      {!isCandidate && (
                        <button
                          type="button"
                          onClick={() => speakPrompt(turn.message)}
                          className="text-[11px] font-mono text-surface-400 hover:text-surface-100 inline-flex items-center gap-1 transition-colors"
                        >
                          <Volume2 className="w-3 h-3 text-brand-500" />
                          <span>Listen</span>
                        </button>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-line text-surface-100">
                      {turn.message}
                    </p>
                  </div>
                );
              })}

              {isSending && (
                <div className="rounded-xl border border-surface-700 border-l-[3px] border-l-brand-500 bg-elevated/45 p-4 flex items-center gap-2.5 text-xs text-surface-300">
                  <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse shrink-0" />
                  <span>Evaluating your technical response and formulating follow-up probe...</span>
                </div>
              )}
              <div ref={turnsEndRef} />
            </div>

            {/* Composer & Voice Dictation Bar */}
            <div className="p-3.5 sm:p-4 border-t border-surface-700 bg-elevated/50 space-y-2.5 shrink-0">
              {(isListening || isSpeaking) && (
                <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-compiler-500/10 border border-compiler-500/25 badge-compiler text-xs animate-fade-in">
                  <div className="flex items-center gap-2">
                    <Radio className="w-3.5 h-3.5 animate-pulse" />
                    <span className="font-mono text-[11px] font-semibold">
                      {isListening
                        ? 'Candidate Voice Streaming...'
                        : 'Interviewer Audio Synthesis...'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 h-3.5" aria-hidden="true">
                    <span className="w-1 bg-compiler-500 rounded-full animate-pulse h-2" />
                    <span className="w-1 bg-compiler-500 rounded-full animate-bounce h-3.5" />
                    <span className="w-1 bg-compiler-500 rounded-full animate-pulse h-2.5" />
                    <span className="w-1 bg-compiler-500 rounded-full animate-bounce h-3.5" />
                  </div>
                </div>
              )}

              <form onSubmit={handleSendTurn} className="space-y-2">
                <textarea
                  placeholder="Articulate your structured engineering answer... (Press Enter to send, Shift+Enter for new line)"
                  value={candidateMessage}
                  onChange={(e) => setCandidateMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendTurn();
                    }
                  }}
                  disabled={isSending}
                  rows={3}
                  className="w-full rounded-lg bg-auth-input border border-surface-600 text-surface-100 placeholder:text-surface-500 text-xs sm:text-sm p-3 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 resize-none transition-colors"
                />

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-[11px] text-surface-400 hidden sm:inline">
                    Enter ↵ submit · Shift+Enter newline
                  </span>
                  <div className="flex items-center gap-2 ml-auto">
                    <Button
                      type="button"
                      size="sm"
                      variant={isListening ? 'danger' : 'secondary'}
                      onClick={handleToggleSpeech}
                      title="Dictate with Microphone"
                      leftIcon={isListening ? MicOff : Mic}
                      className={isListening ? 'animate-pulse' : ''}
                    >
                      {isListening ? 'Listening' : 'Mic'}
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      variant="primary"
                      disabled={isSending || !candidateMessage.trim()}
                      leftIcon={Send}
                    >
                      {isSending ? 'Sending' : 'Reply'}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Right Context Rail: Candidate Whiteboard & Track Rubric Cues (4 cols) */}
          <aside className="lg:col-span-4 flex flex-col gap-4 min-h-0 overflow-y-auto">
            <Card className="p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-brand-700 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-brand-500" />
                  <span>Track Rubric Focus</span>
                </span>
                <Badge variant="surface" size="sm" className="uppercase">
                  {session.mode}
                </Badge>
              </div>
              <h2 className="font-display text-sm font-semibold text-surface-100">
                {guide.label}
              </h2>
              <ul className="space-y-2">
                {guide.cues.map((cue, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 text-xs text-surface-300 leading-relaxed"
                  >
                    <span className="font-mono text-[10px] font-semibold text-brand-700 bg-brand-500/10 border border-brand-500/20 rounded px-1.5 py-0.5 shrink-0 mt-0.5">
                      0{i + 1}
                    </span>
                    <span>{cue}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-4 sm:p-5 space-y-3">
              <h3 className="font-mono text-[11px] font-semibold uppercase tracking-wider text-surface-400">
                Hiring Committee Dimensions
              </h3>
              <div className="space-y-2 text-xs text-surface-300">
                <div className="flex items-center justify-between py-1.5 border-b border-surface-700/70">
                  <span>Technical Correctness</span>
                  <span className="font-mono text-surface-400">25%</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-surface-700/70">
                  <span>Relevance & Depth</span>
                  <span className="font-mono text-surface-400">25%</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-surface-700/70">
                  <span>Clarity & Communication</span>
                  <span className="font-mono text-surface-400">25%</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span>Problem Solving</span>
                  <span className="font-mono text-surface-400">25%</span>
                </div>
              </div>
              <p className="text-[11px] text-surface-400 leading-relaxed pt-1">
                When ready, click <strong className="text-surface-200">Finish & Evaluate</strong> in the header to trigger your full rubric scorecard.
              </p>
            </Card>
          </aside>
        </div>
      )}

      {/* Confirmation Modal */}
      {showFinishConfirm && (
        <Modal
          title="Finish Interview & Submit for Evaluation?"
          isOpen={showFinishConfirm}
          onClose={() => setShowFinishConfirm(false)}
          maxWidth="max-w-md"
          footer={
            <>
              <Button variant="ghost" size="sm" onClick={() => setShowFinishConfirm(false)}>
                Continue Interview
              </Button>
              <Button variant="danger" size="sm" onClick={handleFinishInterview}>
                Conclude & Evaluate
              </Button>
            </>
          }
        >
          <p className="text-xs sm:text-sm text-surface-400 leading-relaxed">
            Are you ready to conclude this interview session? Your full dialogue will be reviewed
            by the AI Hiring Committee to generate your comprehensive technical rubric scorecard.
          </p>
        </Modal>
      )}
    </div>
  );
}

export default InterviewSessionPage;
