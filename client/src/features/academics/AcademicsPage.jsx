import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthContext.jsx';
import { academicsService } from '../../services/academics.service.js';
import { Card, CardTitle, CardDescription } from '../../components/Card.jsx';
import { Badge } from '../../components/Badge.jsx';
import { Modal } from '../../components/Modal.jsx';
import { Skeleton } from '../../components/Skeleton.jsx';
import { EmptyState } from '../../components/EmptyState.jsx';
import {
  GraduationCap,
  BookOpen,
  CheckCircle,
  Circle,
  FileText,
  Search,
  ExternalLink,
  Clock,
} from 'lucide-react';

export const AcademicsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedSemester, setSelectedSemester] = useState(user?.semester || 1);
  const [selectedBranch, setSelectedBranch] = useState(
    user?.branch || 'Computer Science and Engineering'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubject, setActiveSubject] = useState(null);
  const [activeTab, setActiveTab] = useState('topics'); // 'topics' | 'resources'

  // Query: Fetch subjects
  const { data: subjectsData, isLoading } = useQuery({
    queryKey: ['academics-subjects', selectedSemester, selectedBranch, searchQuery],
    queryFn: () =>
      academicsService.getSubjects({
        semester: selectedSemester,
        branch: selectedBranch,
        search: searchQuery || undefined,
      }),
  });

  // Query: Fetch active subject details & progress
  const { data: subjectDetails, isLoading: isDetailsLoading } = useQuery({
    queryKey: ['academics-subject-details', activeSubject?._id],
    queryFn: () => academicsService.getSubjectById(activeSubject._id),
    enabled: !!activeSubject?._id,
  });

  // Query: Fetch subject resources
  const { data: subjectResources } = useQuery({
    queryKey: ['academics-subject-resources', activeSubject?._id],
    queryFn: () => academicsService.getResources(activeSubject._id),
    enabled: !!activeSubject?._id && activeTab === 'resources',
  });

  // Mutation: Toggle topic completion
  const toggleMutation = useMutation({
    mutationFn: ({ subjectId, topicId }) => academicsService.toggleTopic(subjectId, topicId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['academics-subject-details', activeSubject?._id],
      });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });

  const subjects = subjectsData?.data || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-surface-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <GraduationCap className="w-6 h-6 text-brand-400" />
            <span>Academic Curriculum Hub</span>
          </h1>
          <p className="text-sm text-surface-400 mt-1">
            Structured syllabus, verified lecture notes, and PYQs for{' '}
            {user?.university || 'Engineering University'}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedBranch}
            onChange={e => setSelectedBranch(e.target.value)}
            className="rounded-xl bg-surface-900 border border-surface-800 text-xs text-surface-200 px-3 py-2 focus:outline-none focus:border-brand-500"
          >
            <option value="Computer Science and Engineering">
              Computer Science and Engineering
            </option>
            <option value="Electronics and Communication">Electronics and Communication</option>
            <option value="Mechanical Engineering">Mechanical Engineering</option>
          </select>
        </div>
      </div>

      {/* Semester Tab Switcher */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
          <button
            key={sem}
            onClick={() => setSelectedSemester(sem)}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all select-none whitespace-nowrap ${
              selectedSemester === sem
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                : 'bg-surface-900/60 text-surface-400 hover:text-surface-100 hover:bg-surface-800'
            }`}
          >
            Semester {sem}
            {sem === user?.semester && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-brand-400/20 text-[10px] text-brand-300">
                Current
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-surface-500" />
        <input
          type="text"
          placeholder="Search subjects or syllabus topics..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-xl bg-surface-900/80 border border-surface-800 text-xs text-surface-100 placeholder-surface-500 focus:outline-none focus:border-brand-500"
        />
      </div>

      {/* Subjects Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : subjects.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No subjects found"
          description={`No curriculum entries recorded for Semester ${selectedSemester} in ${selectedBranch}.`}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map(subject => {
            const topicCount = subject.topics?.length || 0;

            return (
              <Card
                key={subject._id}
                hover
                className="flex flex-col justify-between border-surface-800/80 bg-surface-900/50 cursor-pointer"
                onClick={() => {
                  setActiveSubject(subject);
                  setActiveTab('topics');
                }}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="brand">{subject.code}</Badge>
                    <span className="text-xs text-surface-400 font-medium">
                      {subject.credits || 4} Credits
                    </span>
                  </div>
                  <CardTitle className="text-base text-white line-clamp-1">
                    {subject.name}
                  </CardTitle>
                  <CardDescription className="line-clamp-2 mt-1">
                    {subject.description ||
                      'Comprehensive curriculum with theory, laboratory, and PYQs.'}
                  </CardDescription>
                </div>

                <div className="mt-5 pt-4 border-t border-surface-800/60">
                  <div className="flex items-center justify-between text-xs text-surface-400 mb-2">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-brand-400" />
                      {topicCount} Topics
                    </span>
                    <span className="text-brand-400 font-medium">Syllabus & Notes &rarr;</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Subject Detail & Topic Checklist Modal */}
      <Modal
        isOpen={!!activeSubject}
        onClose={() => setActiveSubject(null)}
        title={activeSubject ? `${activeSubject.code} — ${activeSubject.name}` : ''}
        description={activeSubject?.description}
        maxWidth="max-w-2xl"
      >
        {isDetailsLoading ? (
          <div className="space-y-3 py-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <div className="space-y-5">
            {/* Completion Progress Bar */}
            <div className="p-4 rounded-xl bg-surface-950 border border-surface-800">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-surface-300 font-medium">Topic Completion Progress</span>
                <span className="text-brand-400 font-bold">
                  {subjectDetails?.completionPercentage || 0}% Complete
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-surface-800 overflow-hidden">
                <div
                  className="h-full bg-brand-500 rounded-full transition-all duration-300"
                  style={{ width: `${subjectDetails?.completionPercentage || 0}%` }}
                />
              </div>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-surface-800 text-xs">
              <button
                onClick={() => setActiveTab('topics')}
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                  activeTab === 'topics'
                    ? 'border-brand-500 text-brand-400'
                    : 'border-transparent text-surface-400 hover:text-white'
                }`}
              >
                Topics Checklist ({subjectDetails?.topics?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('resources')}
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                  activeTab === 'resources'
                    ? 'border-brand-500 text-brand-400'
                    : 'border-transparent text-surface-400 hover:text-white'
                }`}
              >
                Study Resources & PYQs
              </button>
            </div>

            {/* Tab: Topics Checklist */}
            {activeTab === 'topics' && (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {subjectDetails?.topics?.map((topic, index) => {
                  const isDone = subjectDetails?.completedTopicIds?.includes(topic.topicId);

                  return (
                    <div
                      key={topic.topicId}
                      onClick={() =>
                        toggleMutation.mutate({
                          subjectId: activeSubject._id,
                          topicId: topic.topicId,
                        })
                      }
                      className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                        isDone
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200'
                          : 'bg-surface-950/60 border-surface-800 hover:border-surface-700 text-surface-200'
                      }`}
                    >
                      <button className="mt-0.5 shrink-0 focus:outline-none">
                        {isDone ? (
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Circle className="w-4 h-4 text-surface-500 hover:text-surface-300" />
                        )}
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p
                            className={`text-xs font-semibold ${isDone ? 'line-through text-surface-400' : 'text-white'}`}
                          >
                            {index + 1}. {topic.title}
                          </p>
                          <span className="text-[10px] text-surface-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {topic.estimatedHours || 2}h
                          </span>
                        </div>
                        {topic.description && (
                          <p className="text-[11px] text-surface-400 mt-0.5">{topic.description}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Tab: Study Resources & PYQs */}
            {activeTab === 'resources' && (
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {subjectResources?.length === 0 ? (
                  <p className="text-xs text-surface-400 text-center py-6">
                    No resources uploaded yet for this subject.
                  </p>
                ) : (
                  subjectResources?.map(res => (
                    <div
                      key={res._id}
                      className="p-3.5 rounded-xl border border-surface-800 bg-surface-950/70 flex items-start justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400 border border-brand-500/20 shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-white">{res.title}</p>
                          <p className="text-[11px] text-surface-400 mt-0.5 line-clamp-2">
                            {res.textContent || 'Verified academic resource.'}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant={res.type === 'pyq' ? 'purple' : 'brand'}>
                              {res.type.toUpperCase()}
                            </Badge>
                            {res.year && (
                              <span className="text-[10px] text-surface-400">Year {res.year}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {res.contentUrl && (
                        <a
                          href={res.contentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg text-surface-400 hover:text-brand-400 hover:bg-surface-800 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AcademicsPage;
