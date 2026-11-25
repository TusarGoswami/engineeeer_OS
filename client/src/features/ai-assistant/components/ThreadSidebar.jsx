import { useState, useMemo } from 'react';
import { Plus, BookOpen, MessageSquare, Search } from 'lucide-react';
import { Button, Select, Input, Skeleton } from '../../../components/index.js';

/**
 * Conversation history rail and syllabus-grounding selector for AI Academic Assistant.
 */
export function ThreadSidebar({
  conversations = [],
  activeConversationId,
  subjects = [],
  selectedSubjectId,
  onSelectSubject,
  onSelectConversation,
  onStartNewChat,
  isLoading = false,
}) {
  const [threadSearch, setThreadSearch] = useState('');

  const subjectOptions = useMemo(
    () => [
      { value: '', label: 'All Engineering Subjects' },
      ...subjects.map((s) => ({
        value: s._id,
        label: `${s.code}: ${s.name}`,
      })),
    ],
    [subjects]
  );

  const filteredConversations = useMemo(() => {
    const q = threadSearch.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(
      (c) =>
        (c.title || '').toLowerCase().includes(q) ||
        (c.subjectId?.name || '').toLowerCase().includes(q) ||
        (c.subjectId?.code || '').toLowerCase().includes(q)
    );
  }, [conversations, threadSearch]);

  return (
    <div className="flex flex-col h-full gap-4">
      <Button
        type="button"
        variant="primary"
        onClick={onStartNewChat}
        leftIcon={Plus}
        className="w-full justify-center shrink-0"
      >
        New Study Thread
      </Button>

      {/* Syllabus Context Grounding */}
      <div className="space-y-1.5 shrink-0">
        <Select
          label="Ground in Syllabus"
          aria-label="Ground in syllabus subject"
          value={selectedSubjectId}
          onChange={(e) => onSelectSubject(e.target.value)}
          leftIcon={BookOpen}
          options={subjectOptions}
          className="text-xs py-2"
        />
        <p className="text-[11px] text-surface-400 leading-snug">
          Answers retrieve citations from verified notes &amp; PYQs in the selected syllabus scope.
        </p>
      </div>

      {/* Filter & Recent Threads */}
      <div className="flex flex-col flex-1 min-h-0 gap-2.5 pt-2 border-t border-surface-700">
        <div className="flex items-center justify-between px-0.5">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-surface-400">
            Recent Threads ({conversations.length})
          </span>
        </div>

        {conversations.length > 0 && (
          <Input
            aria-label="Filter study threads"
            placeholder="Filter threads..."
            value={threadSearch}
            onChange={(e) => setThreadSearch(e.target.value)}
            leftIcon={Search}
            className="text-xs py-1.5"
          />
        )}

        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {isLoading ? (
            <div className="space-y-2 py-1">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-11 w-full rounded-lg" />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <p className="text-xs text-surface-400 py-6 text-center px-2">
              No previous threads. Ask an engineering question to start!
            </p>
          ) : filteredConversations.length === 0 ? (
            <p className="text-xs text-surface-400 py-6 text-center px-2">
              No matching threads found.
            </p>
          ) : (
            filteredConversations.map((c) => {
              const isActive = activeConversationId === c._id;
              const dateLabel = c.lastActiveAt || c.updatedAt;
              return (
                <button
                  key={c._id}
                  type="button"
                  onClick={() => onSelectConversation(c._id)}
                  className={`w-full flex flex-col gap-1 px-3 py-2.5 rounded-lg text-left transition-colors border ${
                    isActive
                      ? 'bg-brand-500/12 border-brand-500/35 text-brand-700'
                      : 'bg-transparent border-transparent text-surface-300 hover:bg-elevated hover:text-surface-100'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-75" />
                    <span className="text-xs font-medium truncate flex-1">
                      {c.title || 'Untitled Thread'}
                    </span>
                  </div>
                  {(c.subjectId?.code || dateLabel) && (
                    <div className="flex items-center justify-between gap-2 pl-5 text-[10px] font-mono text-surface-400">
                      <span className="truncate">{c.subjectId?.code || 'General'}</span>
                      {dateLabel && (
                        <span className="shrink-0">
                          {new Date(dateLabel).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default ThreadSidebar;

