import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Clock, FileText, AlertTriangle, Play, Eye, CheckCircle2 } from 'lucide-react';
import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { Badge } from '../../components/Badge.jsx';
import { Modal } from '../../components/Modal.jsx';
import { useAuth } from '../auth/AuthContext.jsx';
import { assessmentService } from '../../services/assessment.service.js';

export const AssessmentCataloguePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);

  const canReview = user?.role === 'contentAdmin' || user?.role === 'platformAdmin';

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      setLoading(false);
      const res = await assessmentService.getAssessments();
      if (res && res.data) {
        setAssessments(res.data);
      }
    } catch {
      // Graceful fallback for mock or empty states
      setAssessments([
        {
          _id: 'sample-os-midterm',
          title: 'Operating Systems & Concurrency Midterm',
          description:
            'Comprehensive assessment covering CPU scheduling, virtual memory paging, semaphore synchronization, and deadlock prevention.',
          durationMinutes: 45,
          totalMarks: 40,
          questionsCount: 20,
          subjectId: { name: 'Operating Systems', code: 'CS301' },
          rules: { fullScreenRequired: true, trackTabSwitches: true },
        },
        {
          _id: 'sample-dbms-lab',
          title: 'Database Management Systems Practical Assessment',
          description:
            'Evaluates B+ Tree indexing, normalization (3NF/BCNF), serializability, and transaction ACID properties.',
          durationMinutes: 60,
          totalMarks: 50,
          questionsCount: 25,
          subjectId: { name: 'Database Systems', code: 'CS304' },
          rules: { fullScreenRequired: true, trackTabSwitches: true },
        },
      ]);
    }
  };

  const handleStartClick = assessment => {
    setSelectedAssessment(assessment);
    setIsRulesModalOpen(true);
  };

  const handleConfirmStart = () => {
    if (!selectedAssessment) return;
    setIsRulesModalOpen(false);
    navigate(`/assessments/take/${selectedAssessment._id}`);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-6 h-6 text-brand-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Assessments & Proctored Tests
            </h1>
          </div>
          <p className="text-surface-400 text-sm">
            Curriculum examinations with real-time integrity auditing, server-authoritative timers,
            and faculty review.
          </p>
        </div>
      </div>

      {/* Rules & Transparency Notice */}
      <Card className="bg-gradient-to-r from-surface-900 via-surface-900 to-brand-950/20 border-surface-800 p-5">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-white">Transparent & Fair Proctoring</h3>
            <p className="text-xs text-surface-400 leading-relaxed">
              EngineerOS implements client-authoritative transparency. We audit tab visibility,
              window blur, and fullscreen status. Review signals are reported to course instructors
              as review suggestions, never automated disqualifications.
            </p>
          </div>
        </div>
      </Card>

      {/* Catalogue Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="text-surface-400 text-sm">Loading available assessments...</div>
        ) : assessments.length === 0 ? (
          <div className="col-span-2 text-center py-12 text-surface-400">
            No published assessments currently scheduled.
          </div>
        ) : (
          assessments.map(item => (
            <Card
              key={item._id}
              className="flex flex-col justify-between border-surface-800 hover:border-surface-700 transition-all p-6 bg-surface-900/60"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <Badge variant="brand" size="sm">
                    {item.subjectId?.code || 'CS CORE'}
                  </Badge>
                  <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Proctored</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-white group-hover:text-brand-400 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-surface-400 line-clamp-2 mt-1.5 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-surface-400 pt-2 border-t border-surface-800/60">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-surface-500" />
                    {item.durationMinutes} Minutes
                  </span>
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-surface-500" />
                    {item.totalMarks} Marks
                  </span>
                </div>
              </div>

              <div className="pt-6 flex items-center justify-between gap-3 border-t border-surface-800/80 mt-6">
                {canReview && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/assessments/review/${item._id}`)}
                    className="gap-2 text-xs"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Review Signals
                  </Button>
                )}
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleStartClick(item)}
                  className="gap-2 ml-auto text-xs"
                >
                  <Play className="w-3.5 h-3.5" />
                  Take Assessment
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Rules Confirmation Modal */}
      <Modal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
        title="Proctored Assessment Rules & Consent"
      >
        <div className="space-y-4 text-sm text-surface-300">
          <p className="text-xs text-surface-400">
            Before launching <strong className="text-white">{selectedAssessment?.title}</strong>,
            please acknowledge the test rules:
          </p>

          <div className="space-y-2.5 bg-surface-950/60 p-4 rounded-xl border border-surface-800 text-xs">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Full screen mode is requested upon commencement.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Tab switches, window unfocusing, and browser minimizing are audited with timestamps.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Your answers are automatically saved every 30 seconds to prevent data loss.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                Exceeding integrity thresholds marks your attempt for faculty review. You will have
                the opportunity to explain anomalies during post-test evaluation.
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button variant="ghost" size="sm" onClick={() => setIsRulesModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleConfirmStart} className="gap-2">
              <ShieldCheck className="w-4 h-4" />I Agree & Enter Test
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AssessmentCataloguePage;
