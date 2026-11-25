import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  ArrowLeft,
  User,
  Clock,
  CheckCircle2,
  Eye,
  Filter,
  Search,
  Users,
  ShieldCheck,
} from 'lucide-react';
import {
  PageHeader,
  MetricStrip,
  MetricItem,
  Card,
  Button,
  Badge,
  Input,
  Modal,
  Skeleton,
  EmptyState,
  ErrorState,
  useToast,
} from '../../components/index.js';
import { assessmentService } from '../../services/assessment.service.js';

/**
 * Faculty & Content Admin Proctoring Moderation Console.
 * Displays examinee scores, accuracy rates, integrity flag counts, and telemetry modal inspection.
 */
export const AssessmentReviewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [filterOnlyFlagged, setFilterOnlyFlagged] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSignal, setSelectedSignal] = useState(null);
  const [acknowledgedIds, setAcknowledgedIds] = useState(new Set());

  const fetchReviewSignals = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const res = await assessmentService.getReviewSignals(id);
      setSignals(res?.data || []);
    } catch (err) {
      setSignals([]);
      setLoadError(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to fetch examinee review signals.'
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchReviewSignals();
  }, [fetchReviewSignals]);

  const metrics = useMemo(() => {
    const flaggedCount = signals.filter(
      (s) => s.isFlaggedForReview || (s.reviewSignalsCount || 0) > 0
    ).length;
    const cleanCount = signals.length - flaggedCount;
    return { total: signals.length, flaggedCount, cleanCount };
  }, [signals]);

  const displayedSignals = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return signals.filter((s) => {
      const matchesFlag =
        !filterOnlyFlagged || s.isFlaggedForReview || (s.reviewSignalsCount || 0) > 0;
      const matchesSearch =
        !q ||
        (s.userId?.name || '').toLowerCase().includes(q) ||
        (s.userId?.email || '').toLowerCase().includes(q);
      return matchesFlag && matchesSearch;
    });
  }, [signals, filterOnlyFlagged, searchQuery]);

  const handleAcknowledgeSignal = (item) => {
    const key = item._id || item.attemptId;
    setAcknowledgedIds((prev) => new Set(prev).add(key));
    showToast(`Marked attempt by ${item.userId?.name || 'Examinee'} as reviewed`, 'success');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <PageHeader
        eyebrow="~/assessments · Faculty Moderation Console"
        title="Proctoring Audit & Review Signals"
        description="Review examinee scores, auto-submit status, and integrity telemetry logs."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              leftIcon={ArrowLeft}
              onClick={() => navigate('/assessments')}
            >
              Back to Assessments
            </Button>
            <Button
              type="button"
              variant={filterOnlyFlagged ? 'primary' : 'outline'}
              size="sm"
              leftIcon={Filter}
              onClick={() => setFilterOnlyFlagged((prev) => !prev)}
            >
              {filterOnlyFlagged ? 'Showing Flagged Only' : 'Filter Flagged'}
            </Button>
          </div>
        }
      />

      {/* Overview Metrics Strip */}
      <MetricStrip>
        <MetricItem
          label="Total Examinees"
          value={metrics.total}
          subvalue="Recorded assessment attempts"
          icon={Users}
        />
        <MetricItem
          label="Flagged Signals"
          value={metrics.flaggedCount}
          subvalue="Attempts with review flags"
          icon={ShieldAlert}
          accent="brand"
        />
        <MetricItem
          label="Verified Clean"
          value={metrics.cleanCount}
          subvalue="Zero anomaly thresholds hit"
          icon={ShieldCheck}
          accent="compiler"
        />
        <MetricItem
          label="Reviewed Today"
          value={acknowledgedIds.size}
          subvalue="Acknowledged in session"
          icon={CheckCircle2}
        />
      </MetricStrip>

      {/* Search Filter */}
      <Card className="p-4">
        <Input
          aria-label="Search examinees"
          placeholder="Filter by examinee name or university email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={Search}
        />
      </Card>

      {/* Audit List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : loadError ? (
        <ErrorState
          title="Unable to load audit records"
          message={loadError}
          onRetry={fetchReviewSignals}
        />
      ) : displayedSignals.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No examinee submissions found"
          description="No submitted attempts or telemetry signals match your current filters."
          actionLabel={filterOnlyFlagged || searchQuery ? 'Reset Filters' : undefined}
          onAction={
            filterOnlyFlagged || searchQuery
              ? () => {
                  setFilterOnlyFlagged(false);
                  setSearchQuery('');
                }
              : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {displayedSignals.map((item) => {
            const key = item._id || item.attemptId;
            const isAck = acknowledgedIds.has(key);

            return (
              <Card
                key={key}
                className={`p-4 sm:p-5 transition-colors ${
                  item.isFlaggedForReview && !isAck
                    ? 'border-amber-500/40 bg-amber-500/6'
                    : ''
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <User className="w-4 h-4 text-surface-400 shrink-0" />
                      <span className="font-display font-semibold text-surface-100 text-sm">
                        {item.userId?.name || 'Examinee'}
                      </span>
                      {item.userId?.email && (
                        <span className="text-xs font-mono text-surface-400">
                          {item.userId.email}
                        </span>
                      )}
                      {isAck ? (
                        <Badge variant="compiler" size="sm">
                          Reviewed
                        </Badge>
                      ) : item.isFlaggedForReview ? (
                        <Badge variant="warning" size="sm">
                          Flagged ({item.reviewSignalsCount} Signals)
                        </Badge>
                      ) : (
                        <Badge variant="compiler" size="sm">
                          Clean ({item.reviewSignalsCount || 0} Signals)
                        </Badge>
                      )}
                      {item.isAutoSubmitted && (
                        <Badge variant="surface" size="sm">
                          Auto-Submitted
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-surface-400">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {item.submittedAt
                          ? `Submitted: ${new Date(item.submittedAt).toLocaleString()}`
                          : `Status: ${item.status || 'in_progress'}`}
                      </span>
                      <span>·</span>
                      <span className="text-surface-100 font-semibold">
                        Score: {item.score ?? 0} Marks
                      </span>
                      {item.accuracyRate !== undefined && (
                        <>
                          <span>·</span>
                          <span>Accuracy: {item.accuracyRate}%</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      leftIcon={Eye}
                      onClick={() => setSelectedSignal(item)}
                    >
                      View Telemetry
                    </Button>
                    <Button
                      type="button"
                      variant={isAck ? 'ghost' : 'outline'}
                      size="sm"
                      leftIcon={CheckCircle2}
                      disabled={isAck}
                      onClick={() => handleAcknowledgeSignal(item)}
                    >
                      {isAck ? 'Cleared' : 'Clear Review'}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Telemetry Inspector Modal (replaces native browser alert) */}
      <Modal
        isOpen={!!selectedSignal}
        onClose={() => setSelectedSignal(null)}
        title={
          selectedSignal
            ? `Integrity Telemetry — ${selectedSignal.userId?.name || 'Examinee'}`
            : ''
        }
        description={selectedSignal?.userId?.email || ''}
        maxWidth="max-w-lg"
      >
        {selectedSignal && (
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-elevated/65 border border-surface-700 font-mono text-xs text-center">
              <div>
                <div className="text-surface-400 text-[10px] uppercase">Score</div>
                <div className="font-bold text-surface-100 mt-0.5">{selectedSignal.score ?? 0}</div>
              </div>
              <div className="border-x border-surface-700">
                <div className="text-surface-400 text-[10px] uppercase">Accuracy</div>
                <div className="font-bold text-brand-700 mt-0.5">
                  {selectedSignal.accuracyRate ?? 0}%
                </div>
              </div>
              <div>
                <div className="text-surface-400 text-[10px] uppercase">Signals</div>
                <div className="font-bold text-amber-700 dark:text-amber-400 mt-0.5">
                  {selectedSignal.reviewSignalsCount ?? 0}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-surface-400">
                Recorded Audit Events
              </div>
              {selectedSignal.events?.length > 0 ? (
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {selectedSignal.events.map((ev, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between px-3 py-2 rounded-lg bg-elevated/55 border border-surface-700 font-mono text-xs"
                    >
                      <span className="text-surface-100 font-semibold">
                        {(ev.eventType || 'event').replace(/_/g, ' ')}
                      </span>
                      <span className="text-surface-400">
                        {new Date(ev.timestamp || ev.occurredAt).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="p-4 rounded-xl bg-elevated/45 border border-surface-700 text-xs text-surface-400 text-center">
                  No anomaly event timestamps logged; total signal count recorded:{' '}
                  {selectedSignal.reviewSignalsCount ?? 0}.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setSelectedSignal(null)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AssessmentReviewPage;
