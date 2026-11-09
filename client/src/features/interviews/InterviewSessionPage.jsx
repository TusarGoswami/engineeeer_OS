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
} from 'lucide-react';
import { aiService } from '../../services/ai.service.js';
import { Card } from '../../components/Card.jsx';
import { Badge } from '../../components/Badge.jsx';
import { Button } from '../../components/Button.jsx';
import { Modal } from '../../components/Modal.jsx';
import { StatCard } from '../../components/StatCard.jsx';

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

  const turnsEndRef = useRef(null);

  useEffect(() => {
    fetchSession();
  }, [id]);

  useEffect(() => {
    turnsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.turns]);

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
      // Handled silently
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
      // Error
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
      // Error
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
      <div className="h-[calc(100vh-10rem)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-surface-400">
          <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
          <span className="text-sm font-mono">Loading interview session...</span>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 text-center rounded-2xl border border-surface-700 bg-surface-850">
        <h2 className="text-lg font-bold text-surface-100 mb-2">Session not found</h2>
        <p className="text-xs text-surface-400 mb-6">
          The requested interview session could not be retrieved.
        </p>
        <Button variant="primary" onClick={() => navigate('/interviews')}>
          Back to Studio
        </Button>
      </div>
    );
  }

  const isEvaluated = session.status === 'evaluated';
  const isCompleted = session.status === 'completed';

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)] space-y-3 pb-2 max-w-6xl mx-auto w-full animate-fade-in">
      {/* Top Session Bar */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl border border-surface-700 bg-surface-850 shadow-md flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/interviews')}
            leftIcon={ArrowLeft}
            className="text-xs text-surface-400 hover:text-surface-100"
          >
            Studio
          </Button>
          <div className="h-4 w-[1px] bg-surface-700" />
          <h2 className="text-sm sm:text-base font-bold text-surface-100 tracking-tight">
            {session.targetRole}
          </h2>
          <Badge variant="brand" size="sm" className="capitalize font-mono text-[10px]">
            {session.mode}
          </Badge>
          <Badge
            variant={isEvaluated ? 'compiler' : isCompleted ? 'brand' : 'signal'}
            size="sm"
            className="font-mono text-[10px]"
          >
            {session.status.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>

        {session.status === 'in_progress' && (
          <Button
            variant="danger"
            size="sm"
            onClick={() => setShowFinishConfirm(true)}
            disabled={isFinishing}
          >
            Finish & Evaluate
          </Button>
        )}
      </div>

      {/* Main Container: Chat turns or Evaluation Scorecard */}
      {isEvaluated ? (
        /* Rubric Evaluation Scorecard View */
        <div className="flex-1 overflow-y-auto space-y-5 pr-1 pb-4">
          {/* Hero Overall Score */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <StatCard
              title="Overall Readiness Score"
              value={`${session.evaluation?.overallScore || 0} / 100`}
              subtitle={session.evaluation?.readinessLevel || 'Evaluated'}
              icon={Award}
              variant="brand"
            />

            <Card className="lg:col-span-2 p-5 border-surface-700 bg-surface-850 flex flex-col justify-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-surface-400 font-mono">
                Hiring Committee Executive Summary
              </span>
              <p className="mt-2 text-sm text-surface-200 leading-relaxed font-sans">
                {session.evaluation?.feedbackSummary}
              </p>
            </Card>
          </div>

          {/* Rubric Breakdown Bars */}
          <Card className="p-5 border-surface-700 bg-surface-850 space-y-4">
            <h3 className="text-sm font-bold text-surface-100 uppercase tracking-wider font-mono">
              Rubric Competency Breakdown
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {session.evaluation?.rubricScores && (
                <>
                  <div className="p-3.5 rounded-xl bg-surface-900 border border-surface-700/60 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-surface-300 font-medium">Technical Correctness</span>
                      <strong className="font-mono text-emerald-400">
                        {session.evaluation.rubricScores.technicalCorrectness} / 10
                      </strong>
                    </div>
                    <div className="h-2 rounded-full bg-surface-800 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{
                          width: `${session.evaluation.rubricScores.technicalCorrectness * 10}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-surface-900 border border-surface-700/60 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-surface-300 font-medium">Relevance & Depth</span>
                      <strong className="font-mono text-brand-400">
                        {session.evaluation.rubricScores.relevanceAndDepth} / 10
                      </strong>
                    </div>
                    <div className="h-2 rounded-full bg-surface-800 overflow-hidden">
                      <div
                        className="h-full bg-brand-500 rounded-full"
                        style={{
                          width: `${session.evaluation.rubricScores.relevanceAndDepth * 10}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-surface-900 border border-surface-700/60 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-surface-300 font-medium">Clarity & Communication</span>
                      <strong className="font-mono text-amber-400">
                        {session.evaluation.rubricScores.clarityAndCommunication} / 10
                      </strong>
                    </div>
                    <div className="h-2 rounded-full bg-surface-800 overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{
                          width: `${session.evaluation.rubricScores.clarityAndCommunication * 10}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-surface-900 border border-surface-700/60 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-surface-300 font-medium">Problem Solving</span>
                      <strong className="font-mono text-violet-400">
                        {session.evaluation.rubricScores.problemSolving} / 10
                      </strong>
                    </div>
                    <div className="h-2 rounded-full bg-surface-800 overflow-hidden">
                      <div
                        className="h-full bg-violet-500 rounded-full"
                        style={{
                          width: `${session.evaluation.rubricScores.problemSolving * 10}%`,
                        }}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Strengths & Improvement Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-5 border-surface-700 bg-surface-850 border-l-4 border-l-emerald-500">
              <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4" />
                <span>Demonstrated Strengths</span>
              </h4>
              <ul className="space-y-1.5 list-disc list-inside text-xs sm:text-sm text-surface-200 leading-relaxed">
                {(session.evaluation?.strengths || []).map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </Card>

            <Card className="p-5 border-surface-700 bg-surface-850 border-l-4 border-l-amber-500">
              <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4" />
                <span>Areas for Targeted Growth</span>
              </h4>
              <ul className="space-y-1.5 list-disc list-inside text-xs sm:text-sm text-surface-200 leading-relaxed">
                {(session.evaluation?.areasForImprovement || []).map((a, idx) => (
                  <li key={idx}>{a}</li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Suggested Revision Topics */}
          {session.evaluation?.recommendedTopics &&
            session.evaluation.recommendedTopics.length > 0 && (
              <Card className="p-5 border-surface-700 bg-surface-850">
                <h4 className="text-xs font-bold text-surface-400 uppercase tracking-wider font-mono mb-3">
                  Recommended Syllabus Revision Topics
                </h4>
                <div className="flex gap-2 flex-wrap">
                  {session.evaluation.recommendedTopics.map((top) => (
                    <Badge key={top} variant="brand" size="sm">
                      #{top}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}
        </div>
      ) : isCompleted ? (
        /* Evaluation Pending Animation */
        <Card className="flex-1 flex flex-col items-center justify-center p-8 text-center border-surface-700 bg-surface-850 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-400 flex items-center justify-center border border-brand-500/20">
            <RotateCw className="w-6 h-6 animate-spin" />
          </div>
          <h3 className="text-lg font-bold text-surface-100">Synthesizing Comprehensive Evaluation</h3>
          <p className="text-xs text-surface-400 max-w-md leading-relaxed">
            The AI Hiring Committee is analyzing your full technical transcript, evaluating code
            structure, communication clarity, and rubric scores...
          </p>
        </Card>
      ) : (
        /* Live Multi-Turn Interview Chat */
        <Card className="flex-1 flex flex-col p-0 overflow-hidden border-surface-700 bg-surface-850 shadow-xl">
          {/* Turns message area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {(session.turns || []).map((turn, idx) => {
              const isCandidate = turn.role === 'candidate';
              return (
                <div
                  key={idx}
                  className={`flex flex-col max-w-[85%] sm:max-w-[75%] space-y-1 ${
                    isCandidate ? 'ml-auto items-end' : 'mr-auto items-start'
                  }`}
                >
                  <span className="text-[11px] font-mono text-surface-500 px-1">
                    {isCandidate ? 'You (Candidate)' : 'Lead Technical Interviewer'}
                  </span>
                  <div
                    className={`p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-line shadow-sm ${
                      isCandidate
                        ? 'bg-brand-500 text-white font-medium rounded-tr-none'
                        : 'bg-surface-800 text-surface-100 border border-surface-700 rounded-tl-none'
                    }`}
                  >
                    {turn.message}
                  </div>
                </div>
              );
            })}

            {isSending && (
              <div className="flex flex-col max-w-[75%] space-y-1 mr-auto items-start">
                <span className="text-[11px] font-mono text-surface-500 px-1">
                  Lead Technical Interviewer
                </span>
                <div className="p-3 rounded-2xl bg-surface-800 border border-surface-700 text-surface-400 text-xs flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
                  <span>Evaluating response and preparing next technical probe...</span>
                </div>
              </div>
            )}
            <div ref={turnsEndRef} />
          </div>

          {/* Turn Input Form */}
          <div className="p-4 border-t border-surface-700 bg-surface-900/80">
            <form onSubmit={handleSendTurn} className="flex gap-2.5 items-end">
              <textarea
                placeholder="Type your technical response... (Press Enter to submit)"
                value={candidateMessage}
                onChange={(e) => setCandidateMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendTurn();
                  }
                }}
                disabled={isSending}
                rows={2}
                className="flex-1 rounded-xl bg-surface-950 border border-surface-700 text-surface-100 placeholder-surface-500 text-xs sm:text-sm p-3 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 resize-none transition-colors"
              />
              <Button
                type="button"
                variant={isListening ? 'danger' : 'secondary'}
                onClick={handleToggleSpeech}
                title="Dictate with Microphone"
                leftIcon={isListening ? MicOff : Mic}
                className="shrink-0"
              >
                {isListening ? 'Listening' : 'Mic'}
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSending || !candidateMessage.trim()}
                leftIcon={Send}
                className="shrink-0"
              >
                {isSending ? 'Sending' : 'Reply'}
              </Button>
            </form>
          </div>
        </Card>
      )}

      {/* Confirmation Modal to finish interview */}
      {showFinishConfirm && (
        <Modal
          title="Finish Interview & Submit for Evaluation?"
          isOpen={showFinishConfirm}
          onClose={() => setShowFinishConfirm(false)}
        >
          <div className="space-y-4">
            <p className="text-xs sm:text-sm text-surface-400 leading-relaxed">
              Are you ready to conclude this interview session? Your full dialogue will be reviewed
              by the AI Hiring Committee to generate your comprehensive technical rubric scorecard.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setShowFinishConfirm(false)}>
                Continue Interview
              </Button>
              <Button variant="danger" size="sm" onClick={handleFinishInterview}>
                Conclude & Evaluate
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default InterviewSessionPage;
