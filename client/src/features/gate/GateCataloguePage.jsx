import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Clock,
  Target,
  ArrowRight,
  FileCheck2,
} from 'lucide-react';
import { gateService } from '../../services/gate.service.js';
import { Card } from '../../components/Card.jsx';
import { Badge } from '../../components/Badge.jsx';
import { Button } from '../../components/Button.jsx';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/Table.jsx';

export function GateCataloguePage() {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [testsData, attemptsData] = await Promise.all([
        gateService.getTests(),
        gateService.getMyAttempts(),
      ]);
      setTests(testsData || []);
      setAttempts(attemptsData || []);
    } catch {
      // Handled silently
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12 animate-fade-in">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-surface-700/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-6 h-6 text-brand-500" />
            <span className="text-xs font-mono uppercase tracking-wider text-brand-400">
              National Examination Engine
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            GATE Mock Examination Hub
          </h1>
          <p className="text-sm text-surface-400 mt-1 max-w-2xl leading-relaxed">
            High-yield mock exams matching standard IIT GATE patterns with precise MCQ, MSQ, and NAT
            negative scoring algorithms.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-2 rounded-xl bg-surface-900 border border-surface-700 text-xs text-surface-300 font-mono">
            <span className="text-brand-400 font-bold">{tests.length}</span> Official Mocks
          </div>
        </div>
      </div>

      {/* Available Tests */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span>Available Mock Tests</span>
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
          </h2>
          <span className="text-xs text-surface-400">Timed IIT-Pattern Simulations</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-56 rounded-2xl bg-surface-900/40 border border-surface-700 animate-pulse"
              />
            ))}
          </div>
        ) : tests.length === 0 ? (
          <Card className="p-8 text-center text-surface-400 text-sm">
            No mock tests available at the moment. Check back soon!
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tests.map((test) => (
              <Card
                key={test._id}
                hover
                className="flex flex-col justify-between p-5 border-surface-700 bg-surface-850 shadow-md group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="cyan" size="sm" className="font-mono text-[10px]">
                      {test.subject || 'CS & IT'}
                    </Badge>
                    <span className="text-[11px] font-mono text-surface-400">
                      {test.totalMarks} Marks
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-brand-400 transition-colors line-clamp-1">
                      {test.title}
                    </h3>
                    <p className="text-xs text-surface-400 mt-1 line-clamp-2 leading-relaxed">
                      {test.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 pt-2 text-xs font-mono text-surface-400 border-t border-surface-700/60">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-surface-500" />
                      {test.durationMinutes}m
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <FileCheck2 className="w-3.5 h-3.5 text-surface-500" />
                      {test.totalQuestions} Qs
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Target className="w-3.5 h-3.5 text-surface-500" />
                      {test.totalMarks} Pts
                    </span>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-surface-700">
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full justify-between"
                    rightIcon={ArrowRight}
                    onClick={() => navigate(`/gate/test/${test._id}`)}
                  >
                    Start Exam
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Recent Attempts History */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span>My Test Attempts & Diagnostics</span>
          </h2>
          <span className="text-xs text-surface-400">Historical performance & solutions</span>
        </div>

        {attempts.length === 0 ? (
          <Card className="p-8 text-center text-surface-400 text-sm">
            You haven&apos;t taken any GATE mock exams yet. Take your first test above to evaluate
            your readiness!
          </Card>
        ) : (
          <Table containerClassName="border-surface-700 bg-surface-850">
            <TableHeader className="bg-surface-900 border-surface-700">
              <TableRow hover={false}>
                <TableHead>Test Title</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Accuracy</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-surface-700/80">
              {attempts.map((att) => (
                <TableRow
                  key={att._id}
                  onClick={() => navigate(`/gate/results/${att._id}`)}
                  className="cursor-pointer hover:bg-surface-800/60 transition-colors"
                >
                  <TableCell className="font-semibold text-white">
                    <div className="flex items-center gap-2">
                      <span>{att.testId?.title || 'GATE CS Mock Exam'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono font-bold text-brand-400">
                      {att.score}
                    </span>{' '}
                    <span className="text-xs font-mono text-surface-500">
                      / {att.totalMarksAvailable}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={att.accuracyRate >= 70 ? 'compiler' : 'signal'} size="sm">
                      {att.accuracyRate}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-surface-400">
                    {new Date(att.submittedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/gate/results/${att._id}`);
                      }}
                    >
                      Review Solutions
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

export default GateCataloguePage;
