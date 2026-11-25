import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Clock,
  FileText,
  AlertTriangle,
  Play,
  Eye,
  CheckCircle2,
  Search,
  Calendar,
  Award,
  Layers,
} from 'lucide-react';
import {
  PageHeader,
  MetricStrip,
  MetricItem,
  Card,
  Badge,
  Button,
  Input,
  Modal,
  Skeleton,
  EmptyState,
  ErrorState,
} from '../../components/index.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { assessmentService } from '../../services/assessment.service.js';

/**
 * Computes real schedule status from scheduledStartTime and scheduledEndTime if provided.
 */
function getScheduleStatus(assessment) {
  const now = Date.now();
  const start = assessment.scheduledStartTime
    ? new Date(assessment.scheduledStartTime).getTime()
    : null;
  const end = assessment.scheduledEndTime
    ? new Date(assessment.scheduledEndTime).getTime()
    : null;

  if (start && start > now) {
    return { key: 'upcoming', label: 'Upcoming', variant: 'warning' };
  }
  if (end && end < now) {
    return { key: 'closed', label: 'Window Closed', variant: 'surface' };
  }
  return { key: 'active', label: 'Available Now', variant: 'compiler' };
}

/**
 * Assessments Hub dashboard displaying published proctored evaluations, integrity rules,
 * instructions checklist dialog, and faculty moderation entry points.
 */
export const AssessmentCataloguePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [scheduleFilter, setScheduleFilter] = useState('all'); // 'all' | 'active' | 'upcoming'

  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [rulesAcknowledged, setRulesAcknowledged] = useState(false);

  const canReview = user?.role === 'contentAdmin' || user?.role === 'platformAdmin';

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const res = await assessmentService.getAssessments();
      setAssessments(res?.data || []);
    } catch (err) {
      setAssessments([]);
      setLoadError(
        err?.response?.data?.message ||
          err?.message ||
          'Unable to load scheduled assessments from the server.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, []);

  const enrichedAssessments = useMemo(
    () =>
      assessments.map((item) => ({
        ...item,
        scheduleInfo: getScheduleStatus(item),
      })),
    [assessments]
  );

  const stats = useMemo(() => {
    const activeCount = enrichedAssessments.filter(
      (a) => a.scheduleInfo.key === 'active'
    ).length;
    const upcomingCount = enrichedAssessments.filter(
      (a) => a.scheduleInfo.key === 'upcoming'
    ).length;
    const totalMarksSum = enrichedAssessments.reduce(
      (sum, a) => sum + (a.totalMarks || 0),
      0
    );
    return { activeCount, upcomingCount, totalMarksSum };
  }, [enrichedAssessments]);

  const filteredAssessments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return enrichedAssessments.filter((item) => {
      const matchesFilter =
        scheduleFilter === 'all' || item.scheduleInfo.key === scheduleFilter;
      const matchesSearch =
        !q ||
        (item.title || '').toLowerCase().includes(q) ||
        (item.description || '').toLowerCase().includes(q) ||
        (item.subjectId?.name || '').toLowerCase().includes(q) ||
        (item.subjectId?.code || '').toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [enrichedAssessments, searchQuery, scheduleFilter]);

  const handleStartClick = (assessment) => {
    setSelectedAssessment(assessment);
    setRulesAcknowledged(false);
    setIsRulesModalOpen(true);
  };

  const handleConfirmStart = () => {
    if (!selectedAssessment) return;
    setIsRulesModalOpen(false);
    navigate(`/assessments/take/${selectedAssessment._id}`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <PageHeader
        eyebrow="~/assessments · Proctored Examination Studio"
        title="Assessments & Proctored Tests"
        description="Curriculum examinations with real-time integrity telemetry, server-authoritative countdown timers, and faculty review."
      />

      {/* Live Telemetry Strip */}
      <MetricStrip>
        <MetricItem
          label="Total Assessments"
          value={assessments.length}
          subvalue="Published curriculum papers"
          icon={FileText}
        />
        <MetricItem
          label="Available Now"
          value={stats.activeCount}
          subvalue="Open examination windows"
          icon={Play}
          accent="compiler"
        />
        <MetricItem
          label="Upcoming"
          value={stats.upcomingCount}
          subvalue="Scheduled windows"
          icon={Calendar}
          accent="brand"
        />
        <MetricItem
          label="Cumulative Marks"
          value={stats.totalMarksSum}
          subvalue="Across active catalogue"
          icon={Award}
        />
      </MetricStrip>

      {/* Transparent Proctoring Policy Notice */}
      <Card className="p-4 sm:p-5 border-brand-500/25 bg-brand-500/6">
        <div className="flex items-start gap-3.5">
          <div className="p-2 rounded-lg bg-brand-500/12 border border-brand-500/25 text-brand-700 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h2 className="font-display text-sm font-semibold text-surface-100">
              Transparent &amp; Fair Integrity Monitoring
            </h2>
            <p className="text-xs text-surface-300 leading-relaxed">
              EngineerOS implements auditable examination proctoring. Fullscreen status, webcam
              presence, screen share continuity, and tab focus transitions are logged strictly as
              review signals for course faculty — never automated disqualifications.
            </p>
          </div>
        </div>
      </Card>

      {/* Discovery Filter & Search Bar */}
      <Card className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <Input
            aria-label="Search assessments"
            placeholder="Search assessment title, subject code, or syllabus topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={Search}
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap shrink-0">
          {[
            { id: 'all', label: `All (${assessments.length})` },
            { id: 'active', label: `Available (${stats.activeCount})` },
            { id: 'upcoming', label: `Upcoming (${stats.upcomingCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setScheduleFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                scheduleFilter === tab.id
                  ? 'bg-brand-500 border-brand-500 text-white'
                  : 'bg-elevated/60 border-surface-700 text-surface-300 hover:bg-elevated hover:text-surface-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Assessments Catalogue Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-56 w-full rounded-xl" />
          ))}
        </div>
      ) : loadError ? (
        <ErrorState
          title="Unable to load assessments"
          message={loadError}
          onRetry={fetchAssessments}
        />
      ) : filteredAssessments.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={
            assessments.length === 0
              ? 'No published assessments'
              : 'No assessments match your filter'
          }
          description={
            assessments.length === 0
              ? 'No curriculum assessments are currently scheduled.'
              : 'Adjust your search query or schedule filter to view other examinations.'
          }
          actionLabel={assessments.length > 0 ? 'Reset Filters' : undefined}
          onAction={
            assessments.length > 0
              ? () => {
                  setSearchQuery('');
                  setScheduleFilter('all');
                }
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAssessments.map((item) => {
            const isClosed = item.scheduleInfo.key === 'closed';
            const isUpcoming = item.scheduleInfo.key === 'upcoming';

            return (
              <Card
                key={item._id}
                hover
                className="flex flex-col justify-between gap-4 p-5 sm:p-6 group"
              >
                <div className="space-y-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge variant="brand" size="sm">
                        {item.subjectId?.code || 'CS CORE'}
                      </Badge>
                      {item.subjectId?.name && (
                        <span className="text-xs font-medium text-surface-400 truncate">
                          {item.subjectId.name}
                        </span>
                      )}
                    </div>

                    <Badge variant={item.scheduleInfo.variant} size="sm">
                      {item.scheduleInfo.label}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="font-display text-base sm:text-lg font-bold text-surface-100 group-hover:text-brand-700 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-surface-400 line-clamp-2 mt-1 leading-relaxed">
                      {item.description || 'Timed proctored curriculum examination.'}
                    </p>
                  </div>

                  {/* Duration, Marks & Schedule metadata */}
                  <div className="flex flex-wrap items-center gap-3.5 text-xs font-mono text-surface-300 pt-2.5 border-t border-surface-700">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-brand-700" />
                      <span>{item.durationMinutes} min</span>
                    </span>
                    <span className="text-surface-500">·</span>
                    <span className="inline-flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-brand-700" />
                      <span>{item.totalMarks} Marks</span>
                    </span>
                    <span className="text-surface-500">·</span>
                    <span className="inline-flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 badge-compiler" />
                      <span>
                        {item.rules?.fullScreenRequired !== false ? 'Fullscreen Proctored' : 'Monitored'}
                      </span>
                    </span>
                  </div>

                  {(item.scheduledStartTime || item.scheduledEndTime) && (
                    <div className="flex items-center gap-2 text-[11px] font-mono text-surface-400">
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {item.scheduledStartTime
                          ? `Starts: ${new Date(item.scheduledStartTime).toLocaleString()}`
                          : ''}
                        {item.scheduledStartTime && item.scheduledEndTime ? ' · ' : ''}
                        {item.scheduledEndTime
                          ? `Ends: ${new Date(item.scheduledEndTime).toLocaleString()}`
                          : ''}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-surface-700 flex flex-wrap items-center justify-between gap-2.5">
                  {canReview && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      leftIcon={Eye}
                      onClick={() => navigate(`/assessments/review/${item._id}`)}
                    >
                      Review Signals
                    </Button>
                  )}

                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    leftIcon={Play}
                    disabled={isClosed || isUpcoming}
                    onClick={() => handleStartClick(item)}
                    className="ml-auto"
                  >
                    {isUpcoming
                      ? 'Scheduled Later'
                      : isClosed
                      ? 'Window Closed'
                      : 'Take Assessment'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pre-Exam Instructions & Consent Checklist Modal */}
      <Modal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
        title="Proctored Assessment Instructions & Consent"
        description={
          selectedAssessment
            ? `${selectedAssessment.subjectId?.code || 'ASSESSMENT'} · ${selectedAssessment.durationMinutes} Minutes · ${selectedAssessment.totalMarks} Marks`
            : ''
        }
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-surface-300">
            Review the examination parameters and proctoring rules before launching{' '}
            <strong className="text-surface-100">{selectedAssessment?.title}</strong>:
          </p>

          {/* Exam Specs Summary */}
          <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-elevated/65 border border-surface-700 font-mono text-xs text-center">
            <div>
              <div className="text-surface-400 text-[10px] uppercase">Duration</div>
              <div className="font-bold text-surface-100 mt-0.5">
                {selectedAssessment?.durationMinutes || 60}m
              </div>
            </div>
            <div className="border-x border-surface-700">
              <div className="text-surface-400 text-[10px] uppercase">Total Marks</div>
              <div className="font-bold text-brand-700 mt-0.5">
                {selectedAssessment?.totalMarks || 20}
              </div>
            </div>
            <div>
              <div className="text-surface-400 text-[10px] uppercase">Resumption</div>
              <div className="font-bold badge-compiler mt-0.5">
                {selectedAssessment?.rules?.allowResumption !== false ? 'Allowed' : 'Strict'}
              </div>
            </div>
          </div>

          {/* Mandatory Pre-Exam Checklist */}
          <div className="space-y-2.5 bg-elevated/45 p-4 rounded-xl border border-surface-700 text-xs">
            <div className="flex items-start gap-2.5 text-surface-200">
              <CheckCircle2 className="w-4 h-4 badge-compiler shrink-0 mt-0.5" />
              <span>
                Webcam presence verification, full screen share, and fullscreen lockdown are
                configured on the next step.
              </span>
            </div>
            <div className="flex items-start gap-2.5 text-surface-200">
              <CheckCircle2 className="w-4 h-4 badge-compiler shrink-0 mt-0.5" />
              <span>
                Tab switches, window focus loss, and fullscreen exits are logged with timestamps as
                auditable integrity events.
              </span>
            </div>
            <div className="flex items-start gap-2.5 text-surface-200">
              <CheckCircle2 className="w-4 h-4 badge-compiler shrink-0 mt-0.5" />
              <span>
                Selected answers are automatically synchronized to the server every 30 seconds.
              </span>
            </div>
            <div className="flex items-start gap-2.5 text-amber-800 dark:text-amber-300">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Accumulating 3 or more integrity signals flags your submission for faculty review.
              </span>
            </div>
          </div>

          <label className="flex items-start gap-2.5 p-3 rounded-lg border border-surface-700 bg-card cursor-pointer text-xs text-surface-200">
            <input
              type="checkbox"
              checked={rulesAcknowledged}
              onChange={(e) => setRulesAcknowledged(e.target.checked)}
              className="mt-0.5 rounded border-surface-600 text-brand-500 focus:ring-brand-500"
            />
            <span>
              I have read and agree to abide by the assessment timer, auto-save, and integrity
              monitoring guidelines.
            </span>
          </label>

          <div className="flex justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsRulesModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={!rulesAcknowledged}
              leftIcon={Layers}
              onClick={handleConfirmStart}
            >
              I Agree &amp; Enter Test
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AssessmentCataloguePage;
