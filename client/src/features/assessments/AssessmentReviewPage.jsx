import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, User, Clock, CheckCircle, Eye, Filter } from 'lucide-react';
import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { Badge } from '../../components/Badge.jsx';
import { assessmentService } from '../../services/assessment.service.js';

export const AssessmentReviewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterOnlyFlagged, setFilterOnlyFlagged] = useState(false);

  useEffect(() => {
    fetchReviewSignals();
  }, [id]);

  const fetchReviewSignals = async () => {
    try {
      setLoading(false);
      const res = await assessmentService.getReviewSignals(id);
      if (res && res.data) {
        setSignals(res.data);
      }
    } catch {
      // Demo mock signals for faculty preview
      setSignals([
        {
          attemptId: 'att-1',
          userId: { name: 'Aditya Verma', email: 'aditya.v@iitb.ac.in' },
          score: 34,
          status: 'submitted',
          reviewSignalsCount: 4,
          isFlaggedForReview: true,
          submittedAt: new Date(Date.now() - 3600000).toISOString(),
          events: [
            { eventType: 'tab_hidden', timestamp: new Date(Date.now() - 3500000).toISOString() },
            { eventType: 'window_blur', timestamp: new Date(Date.now() - 3400000).toISOString() },
            {
              eventType: 'fullscreen_exit',
              timestamp: new Date(Date.now() - 3300000).toISOString(),
            },
          ],
        },
        {
          attemptId: 'att-2',
          userId: { name: 'Priya Sharma', email: 'priya.s@iitb.ac.in' },
          score: 38,
          status: 'submitted',
          reviewSignalsCount: 0,
          isFlaggedForReview: false,
          submittedAt: new Date(Date.now() - 7200000).toISOString(),
          events: [],
        },
      ]);
    }
  };

  const displayedSignals = filterOnlyFlagged
    ? signals.filter(s => s.isFlaggedForReview || s.reviewSignalsCount > 0)
    : signals;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-800 pb-6">
        <div>
          <button
            onClick={() => navigate('/assessments')}
            className="flex items-center gap-1.5 text-xs text-surface-400 hover:text-white mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Assessments</span>
          </button>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-amber-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Proctoring Audit & Review Signals
            </h1>
          </div>
          <p className="text-surface-400 text-xs mt-1">
            Faculty moderation console. Review telemetry signals, student context, and audit logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={filterOnlyFlagged ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilterOnlyFlagged(!filterOnlyFlagged)}
            className="gap-2 text-xs"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{filterOnlyFlagged ? 'Showing Flagged Only' : 'Filter Flagged'}</span>
          </Button>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-surface-800 p-4 bg-surface-900/60">
          <span className="text-xs text-surface-400 font-medium">Total Examinees</span>
          <div className="text-2xl font-bold text-white mt-1">{signals.length}</div>
        </Card>
        <Card className="border-surface-800 p-4 bg-surface-900/60">
          <span className="text-xs text-surface-400 font-medium">Flagged for Faculty Review</span>
          <div className="text-2xl font-bold text-amber-400 mt-1">
            {signals.filter(s => s.isFlaggedForReview).length}
          </div>
        </Card>
        <Card className="border-surface-800 p-4 bg-surface-900/60">
          <span className="text-xs text-surface-400 font-medium">Verified Clean Attempts</span>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            {signals.filter(s => !s.isFlaggedForReview).length}
          </div>
        </Card>
      </div>

      {/* Review Table / Card List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-surface-400 text-sm">Loading audit records...</div>
        ) : displayedSignals.length === 0 ? (
          <Card className="border-surface-800 p-8 text-center text-surface-400 text-xs">
            No submissions matching filter criteria.
          </Card>
        ) : (
          displayedSignals.map(item => (
            <Card
              key={item.attemptId}
              className={`border p-5 transition-all bg-surface-900/60 ${
                item.isFlaggedForReview
                  ? 'border-amber-500/40 bg-amber-500/5'
                  : 'border-surface-800 hover:border-surface-700'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-surface-400" />
                    <span className="font-semibold text-white text-sm">
                      {item.userId?.name || 'Anonymous Student'}
                    </span>
                    <span className="text-xs text-surface-400">({item.userId?.email})</span>
                    {item.isFlaggedForReview ? (
                      <Badge variant="warning" size="sm">
                        Flagged ({item.reviewSignalsCount} Signals)
                      </Badge>
                    ) : (
                      <Badge variant="success" size="sm">
                        Clean
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-surface-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-surface-500" />
                      Submitted: {new Date(item.submittedAt || Date.now()).toLocaleTimeString()}
                    </span>
                    <span className="font-medium text-surface-300">Score: {item.score} Marks</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() =>
                      alert(
                        `Review Signals for ${item.userId?.name}:\n${
                          item.events?.length
                            ? item.events
                                .map(
                                  e =>
                                    `• ${e.eventType} at ${new Date(e.timestamp).toLocaleTimeString()}`
                                )
                                .join('\n')
                            : 'No recorded telemetry violations.'
                        }`
                      )
                    }
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View Telemetry
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-xs text-emerald-400 hover:text-emerald-300"
                    onClick={() => alert(`Marked attempt ${item.attemptId} as cleared.`)}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Clear Review
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AssessmentReviewPage;
