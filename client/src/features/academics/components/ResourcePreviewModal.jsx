import { ExternalLink, FileText, User, Calendar, Tag, BookOpen } from 'lucide-react';
import { Modal, Badge, Button } from '../../../components/index.js';

const RESOURCE_BADGE_MAP = {
  notes: { label: 'NOTES', variant: 'brand' },
  pyq: { label: 'PYQ', variant: 'purple' },
  lecture: { label: 'LECTURE', variant: 'cyan' },
  syllabus: { label: 'SYLLABUS', variant: 'compiler' },
  quiz: { label: 'QUIZ', variant: 'warning' },
};

/**
 * Accessible modal reader for lecture notes, PYQ papers, syllabi, and external academic links.
 */
export function ResourcePreviewModal({ resource, topics = [], onClose }) {
  const badgeConfig = RESOURCE_BADGE_MAP[resource?.type] || {
    label: (resource?.type || 'RESOURCE').toUpperCase(),
    variant: 'brand',
  };

  const matchedTopic = resource?.topicId
    ? topics.find((t) => t.topicId === resource.topicId)
    : null;

  return (
    <Modal
      isOpen={!!resource}
      onClose={onClose}
      title={resource ? resource.title : ''}
      description={
        resource ? `${badgeConfig.label} • Verified Course Repository Resource` : ''
      }
      maxWidth="max-w-3xl"
      footer={
        <>
          {resource?.contentUrl && (
            <a
              href={resource.contentUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-white transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open Full Document
            </a>
          )}
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </>
      }
    >
      {resource && (
        <div className="space-y-4">
          {/* Document Metadata Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-elevated/70 border border-surface-700 text-xs">
            <div className="flex flex-wrap items-center gap-2.5">
              <Badge variant={badgeConfig.variant}>{badgeConfig.label}</Badge>
              {resource.year && (
                <span className="inline-flex items-center gap-1 font-mono text-surface-300">
                  <Calendar className="w-3.5 h-3.5 text-surface-400" />
                  Exam Year: {resource.year}
                </span>
              )}
              {resource.author && (
                <span className="inline-flex items-center gap-1 text-surface-300">
                  <User className="w-3.5 h-3.5 text-surface-400" />
                  {resource.author}
                </span>
              )}
              {matchedTopic && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-card border border-surface-700 text-surface-200 font-medium">
                  <BookOpen className="w-3 h-3 text-brand-700" />
                  {matchedTopic.title}
                </span>
              )}
            </div>

            {resource.contentUrl && (
              <a
                href={resource.contentUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-card hover:bg-elevated border border-surface-700 text-brand-700 text-xs font-semibold transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Direct Link
              </a>
            )}
          </div>

          {/* Document Body */}
          <div className="p-5 rounded-xl bg-elevated/45 border border-surface-700 max-h-96 overflow-y-auto font-sans leading-relaxed text-xs sm:text-sm text-surface-200 whitespace-pre-wrap">
            {resource.textContent ? (
              resource.textContent
            ) : (
              <div className="py-10 text-center text-surface-400 space-y-2.5">
                <FileText className="w-8 h-8 mx-auto text-surface-400 opacity-75" />
                <p>Document content is indexed from the official university repository.</p>
                {resource.contentUrl && (
                  <a
                    href={resource.contentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-brand-700 underline font-semibold"
                  >
                    Open full PDF / Drive document
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Resource Tags */}
          {resource.tags?.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <Tag className="w-3.5 h-3.5 text-surface-400 mr-0.5" />
              {resource.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-elevated border border-surface-700 text-surface-300"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

export default ResourcePreviewModal;

