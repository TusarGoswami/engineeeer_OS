import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ThumbsUp,
  MessageSquare,
  CheckCircle2,
  Sparkles,
  Send,
  GraduationCap,
  Tag,
  Share2,
  Bookmark,
} from 'lucide-react';
import {
  Card,
  Button,
  Badge,
  Avatar,
  Skeleton,
  EmptyState,
  ErrorState,
  useToast,
} from '../../components/index.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { communityService } from '../../services/community.service.js';
import { MarkdownMessageRenderer } from '../ai-assistant/components/MarkdownMessageRenderer.jsx';

/**
 * Normalizes populated author object from authorId (Mongo) or author.
 */
function getAuthor(item) {
  if (!item) return {};
  if (item.authorId && typeof item.authorId === 'object') return item.authorId;
  if (item.author && typeof item.author === 'object') return item.author;
  return {};
}

/**
 * Safely computes numeric upvote count across Mongo upvoteCount and upvotes arrays.
 */
function getUpvoteCount(item) {
  if (typeof item?.upvoteCount === 'number') return item.upvoteCount;
  if (Array.isArray(item?.upvotes)) return item.upvotes.length;
  return Number(item?.upvotes || 0);
}

/**
 * Full Community Discussion Detail view with Markdown/code rendering, live upvotes,
 * bookmarking, sharing, emoji reactions, accepted answer resolution, and live-preview composer.
 */
export const PostDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const currentUserId = user?.id || user?._id;
  const bookmarkKey = `engineeros_bookmarks_${currentUserId || 'guest'}`;

  const [post, setPost] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [composerTab, setComposerTab] = useState('write'); // 'write' | 'preview'
  const [reactionCounts, setReactionCounts] = useState({});
  const [isBookmarked, setIsBookmarked] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(bookmarkKey) || '[]');
      return saved.includes(id);
    } catch {
      return false;
    }
  });

  const fetchPostAndReplies = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const postRes = await communityService.getPostById(id);
      const postData = postRes?.data;
      if (!postData) {
        throw new Error('Discussion not found.');
      }
      setPost(postData);

      if (Array.isArray(postData.replies)) {
        setReplies(postData.replies);
      } else {
        const repliesRes = await communityService.getReplies(id);
        setReplies(repliesRes?.data || []);
      }
    } catch (err) {
      setPost(null);
      setLoadError(
        err?.response?.data?.message ||
          err?.message ||
          'Unable to load this discussion thread.'
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPostAndReplies();
  }, [fetchPostAndReplies]);

  const handleToggleBookmark = () => {
    try {
      const saved = new Set(JSON.parse(localStorage.getItem(bookmarkKey) || '[]'));
      if (saved.has(id)) {
        saved.delete(id);
        setIsBookmarked(false);
        showToast('Removed from saved threads', 'info');
      } else {
        saved.add(id);
        setIsBookmarked(true);
        showToast('Saved discussion for later reference', 'success');
      }
      localStorage.setItem(bookmarkKey, JSON.stringify([...saved]));
    } catch {
      // Safe fallback
    }
  };

  const handleSharePost = () => {
    const shareUrl = `${window.location.origin}/community/${id}`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(shareUrl);
      showToast('Discussion link copied to clipboard', 'success');
    } else {
      showToast('Share link ready', 'info');
    }
  };

  const handleToggleReaction = (replyId, emoji) => {
    setReactionCounts((prev) => {
      const key = `${replyId}_${emoji}`;
      return {
        ...prev,
        [key]: (prev[key] || 0) + 1,
      };
    });
  };

  const handleUpvotePost = async () => {
    try {
      const res = await communityService.upvotePost(id);
      const serverData = res?.data;
      setPost((prev) => {
        if (!prev) return null;
        if (serverData?.upvoteCount !== undefined) {
          return {
            ...prev,
            upvoteCount: serverData.upvoteCount,
            hasUpvotedByMe: serverData.hasUpvoted,
          };
        }
        return { ...prev, upvoteCount: getUpvoteCount(prev) + 1, hasUpvotedByMe: true };
      });
    } catch (err) {
      showToast(err?.response?.data?.message || 'Unable to register upvote', 'error');
    }
  };

  const handleUpvoteReply = async (replyId) => {
    try {
      const res = await communityService.upvoteReply(replyId);
      const serverData = res?.data;
      setReplies((prev) =>
        prev.map((r) => {
          if (r._id !== replyId) return r;
          if (serverData?.upvoteCount !== undefined) {
            return {
              ...r,
              upvoteCount: serverData.upvoteCount,
              hasUpvotedByMe: serverData.hasUpvoted,
            };
          }
          return { ...r, upvoteCount: getUpvoteCount(r) + 1, hasUpvotedByMe: true };
        })
      );
    } catch (err) {
      showToast(err?.response?.data?.message || 'Unable to upvote reply', 'error');
    }
  };

  const handleAcceptReply = async (replyId) => {
    try {
      await communityService.acceptReply(id, replyId);
      setReplies((prev) =>
        prev.map((r) => ({
          ...r,
          isAccepted: r._id === replyId,
        }))
      );
      setPost((prev) =>
        prev ? { ...prev, isResolved: true, acceptedReplyId: replyId } : prev
      );
      showToast('Marked reply as accepted solution', 'success');
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to accept solution', 'error');
    }
  };

  const handleAddReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await communityService.addReply(id, { content: replyContent.trim() });
      if (res?.data) {
        setReplies((prev) => [...prev, res.data]);
        setPost((prev) =>
          prev ? { ...prev, repliesCount: (prev.repliesCount || 0) + 1 } : prev
        );
      }
      setReplyContent('');
      setComposerTab('write');
      showToast('Reply posted to discussion', 'success');
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to publish reply', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-5 py-4">
        <Skeleton className="h-8 w-40 rounded-lg" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (loadError || !post) {
    return (
      <div className="max-w-2xl mx-auto my-12 space-y-4">
        <ErrorState
          title="Unable to load discussion"
          message={loadError || 'Discussion thread not found.'}
          onRetry={fetchPostAndReplies}
        />
        <div className="text-center">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            leftIcon={ArrowLeft}
            onClick={() => navigate('/community')}
          >
            Back to Discussions
          </Button>
        </div>
      </div>
    );
  }

  const postAuthor = getAuthor(post);
  const postAuthorId = postAuthor?._id || post?.authorId;
  const isAuthor = Boolean(
    currentUserId &&
      ((postAuthorId && String(postAuthorId) === String(currentUserId)) ||
        (postAuthor?.name && user?.name && postAuthor.name === user.name))
  );
  const postUpvoteTotal = getUpvoteCount(post);
  const isPostSenior = postAuthor?.role === 'senior' || Boolean(postAuthor?.isAlumni);
  const isResolved = Boolean(post.isResolved || replies.some((r) => r.isAccepted));
  const upvotedPostByMe =
    post.hasUpvotedByMe ||
    (Array.isArray(post.upvotes) &&
      currentUserId &&
      post.upvotes.some((uid) => String(uid) === String(currentUserId)));

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Navigation Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          leftIcon={ArrowLeft}
          onClick={() => navigate('/community')}
        >
          Back to Discussions
        </Button>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={isBookmarked ? 'secondary' : 'ghost'}
            size="sm"
            leftIcon={Bookmark}
            onClick={handleToggleBookmark}
          >
            {isBookmarked ? 'Saved' : 'Save'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            leftIcon={Share2}
            onClick={handleSharePost}
          >
            Share
          </Button>
        </div>
      </div>

      {/* Main Post Thread Card */}
      <Card className="p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          {post.isAskSenior && (
            <Badge variant="warning" size="sm">
              <Sparkles className="w-3 h-3" />
              Ask a Senior
            </Badge>
          )}
          <Badge variant="brand" size="sm">
            {post.category}
          </Badge>
          {isResolved && (
            <Badge variant="compiler" size="sm">
              <CheckCircle2 className="w-3 h-3" />
              Resolved
            </Badge>
          )}
        </div>

        <h1 className="font-display text-xl sm:text-2xl font-bold text-surface-100 leading-snug">
          {post.title}
        </h1>

        <div className="flex flex-wrap items-center gap-3 text-xs text-surface-400 pb-4 border-b border-surface-700">
          <Avatar name={postAuthor?.name || 'Member'} size="sm" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {postAuthor?.username ? (
                <Link
                  to={`/u/${postAuthor.username}`}
                  className="font-semibold text-surface-100 hover:text-brand-700 transition-colors"
                >
                  {postAuthor.name}
                </Link>
              ) : (
                <span className="font-semibold text-surface-100">
                  {postAuthor?.name || 'Community Member'}
                </span>
              )}
              {isPostSenior && (
                <Badge variant="gold" size="sm">
                  <GraduationCap className="w-3 h-3" />
                  Alumni / Senior
                </Badge>
              )}
            </div>
            <span className="text-[11px] font-mono text-surface-400 block mt-0.5">
              {postAuthor?.university ? `${postAuthor.university} · ` : ''}
              Posted on {new Date(post.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Formatted Post Content */}
        <div className="text-surface-100 leading-relaxed">
          <MarkdownMessageRenderer content={post.content} />
        </div>

        {/* Tags & Upvote Footer */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-surface-700">
          <div className="flex flex-wrap items-center gap-1.5">
            {(post.tags || []).map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 text-[11px] font-mono text-surface-300 bg-elevated px-2.5 py-0.5 rounded-md border border-surface-700"
              >
                <Tag className="w-2.5 h-2.5 text-surface-400" />
                {t}
              </span>
            ))}
          </div>

          <Button
            type="button"
            variant={upvotedPostByMe ? 'primary' : 'secondary'}
            size="sm"
            leftIcon={ThumbsUp}
            onClick={handleUpvotePost}
          >
            Upvote ({postUpvoteTotal})
          </Button>
        </div>
      </Card>

      {/* Replies Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base sm:text-lg font-bold text-surface-100 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-brand-700" />
            <span>
              {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
            </span>
          </h2>
        </div>

        {replies.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No replies yet"
            description="Be the first senior mentor or peer to share guidance on this thread."
          />
        ) : (
          <div className="space-y-3.5">
            {replies.map((reply) => {
              const replyAuthor = getAuthor(reply);
              const replyUpvotes = getUpvoteCount(reply);
              const isReplySenior =
                replyAuthor?.role === 'senior' || Boolean(replyAuthor?.isAlumni);
              const upvotedReplyByMe =
                reply.hasUpvotedByMe ||
                (Array.isArray(reply.upvotes) &&
                  currentUserId &&
                  reply.upvotes.some((uid) => String(uid) === String(currentUserId)));

              return (
                <Card
                  key={reply._id}
                  className={`p-5 space-y-3.5 ${
                    reply.isAccepted ? 'border-compiler-500/45 bg-compiler-500/6' : ''
                  }`}
                >
                  {reply.isAccepted && (
                    <Badge variant="compiler" size="sm">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Accepted Best Answer
                    </Badge>
                  )}

                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar name={replyAuthor?.name || 'Member'} size="sm" />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {replyAuthor?.username ? (
                            <Link
                              to={`/u/${replyAuthor.username}`}
                              className="font-semibold text-surface-100 text-xs sm:text-sm hover:text-brand-700"
                            >
                              {replyAuthor.name}
                            </Link>
                          ) : (
                            <span className="font-semibold text-surface-100 text-xs sm:text-sm">
                              {replyAuthor?.name || 'Community Member'}
                            </span>
                          )}
                          {isReplySenior && (
                            <Badge variant="gold" size="sm">
                              <GraduationCap className="w-3 h-3" />
                              Verified Senior / Alumni
                            </Badge>
                          )}
                        </div>
                        <span className="text-[11px] font-mono text-surface-400">
                          {replyAuthor?.university ? `${replyAuthor.university} · ` : ''}
                          {new Date(reply.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {isAuthor && !reply.isAccepted && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          leftIcon={CheckCircle2}
                          onClick={() => handleAcceptReply(reply._id)}
                        >
                          Accept as Solution
                        </Button>
                      )}

                      {/* Reaction Pills */}
                      <div className="flex items-center gap-1">
                        {['💡', '🚀', '❤️'].map((emoji) => {
                          const count = reactionCounts[`${reply._id}_${emoji}`] || 0;
                          return (
                            <button
                              key={emoji}
                              type="button"
                              aria-label={`React ${emoji} to reply`}
                              onClick={() => handleToggleReaction(reply._id, emoji)}
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] transition-colors ${
                                count > 0
                                  ? 'bg-brand-500/12 border-brand-500/35 text-brand-700'
                                  : 'bg-elevated/60 border-surface-700 text-surface-300 hover:bg-elevated'
                              }`}
                            >
                              <span>{emoji}</span>
                              {count > 0 && (
                                <span className="font-mono text-[10px] font-bold">{count}</span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      <Button
                        type="button"
                        variant={upvotedReplyByMe ? 'primary' : 'secondary'}
                        size="sm"
                        leftIcon={ThumbsUp}
                        onClick={() => handleUpvoteReply(reply._id)}
                        aria-label={`Upvote reply by ${replyAuthor?.name || 'member'}`}
                      >
                        {replyUpvotes}
                      </Button>
                    </div>
                  </div>

                  {/* Formatted Reply Content */}
                  <div className="pl-0 sm:pl-9">
                    <MarkdownMessageRenderer content={reply.content} />
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Reply Composer with Live Markdown Preview */}
        <Card className="p-5">
          <form onSubmit={handleAddReply} className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="reply-composer"
                className="font-display text-sm font-semibold text-surface-100"
              >
                Write a Mentorship / Peer Response
              </label>

              <div className="flex items-center gap-1 bg-elevated p-0.5 rounded-lg border border-surface-700 text-xs">
                <button
                  type="button"
                  onClick={() => setComposerTab('write')}
                  className={`px-3 py-1 rounded-md font-medium transition-colors ${
                    composerTab === 'write'
                      ? 'bg-card text-surface-100 shadow-2xs'
                      : 'text-surface-400 hover:text-surface-100'
                  }`}
                >
                  Write
                </button>
                <button
                  type="button"
                  onClick={() => setComposerTab('preview')}
                  className={`px-3 py-1 rounded-md font-medium transition-colors ${
                    composerTab === 'preview'
                      ? 'bg-card text-surface-100 shadow-2xs'
                      : 'text-surface-400 hover:text-surface-100'
                  }`}
                >
                  Live Preview
                </button>
              </div>
            </div>

            {composerTab === 'write' ? (
              <textarea
                id="reply-composer"
                rows={4}
                placeholder="Share your structured insights, code references (use ```code```), or interview guidance..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                required
                className="w-full rounded-lg bg-auth-input border border-surface-600 p-3.5 text-xs sm:text-sm text-surface-100 placeholder:text-surface-500 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 font-mono leading-relaxed resize-y"
              />
            ) : (
              <div className="w-full min-h-[112px] p-4 rounded-lg bg-elevated/55 border border-surface-700 text-xs sm:text-sm">
                {replyContent ? (
                  <MarkdownMessageRenderer content={replyContent} />
                ) : (
                  <span className="text-surface-400 italic">
                    Type your response in the Write tab to see live preview...
                  </span>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <span className="text-[11px] text-surface-400 font-mono">
                Supports Markdown headings, lists &amp; highlighted code blocks
              </span>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isSubmitting || !replyContent.trim()}
                isLoading={isSubmitting}
                leftIcon={Send}
              >
                Post Reply
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default PostDetailPage;
