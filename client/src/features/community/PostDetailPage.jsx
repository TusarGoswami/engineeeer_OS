import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ThumbsUp,
  MessageSquare,
  CheckCircle2,
  Sparkles,
  Send,
  GraduationCap,
  Tag,
} from 'lucide-react';
import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { Badge } from '../../components/Badge.jsx';
import { useAuth } from '../auth/AuthContext.jsx';
import { communityService } from '../../services/community.service.js';

export const PostDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [post, setPost] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchPostAndReplies();
  }, [id]);

  const fetchPostAndReplies = async () => {
    try {
      setLoading(false);
      const postRes = await communityService.getPostById(id);
      if (postRes && postRes.data) {
        setPost(postRes.data);
      }
      const repliesRes = await communityService.getReplies(id);
      if (repliesRes && repliesRes.data) {
        setReplies(repliesRes.data || []);
      }
    } catch {
      // Demo mock fallback
      setPost({
        _id: id,
        title:
          'How should juniors prepare for distributed systems and LLD rounds at top tier product firms?',
        content: `I'm a 3rd year CSE student preparing for upcoming summer internships and off-campus full-time rounds. 
I have completed DSA (graphs, trees, DP), but I'm looking for structured senior guidance on:

1. Recommended reading for distributed consensus: Raft vs Paxos.
2. How deeply to study storage engine internals (LSM Trees vs B+ Trees) for entry-level SDE roles.
3. Common Low-Level Design (LLD) interview patterns like Rate Limiters, Cache with TTL, and Notification Services.`,
        author: {
          _id: 'user-aryan',
          name: 'Aryan Mehta',
          role: 'student',
          university: 'IIT Delhi',
          branch: 'CSE',
        },
        category: 'Placements',
        tags: ['distributed-systems', 'placements', 'lld'],
        isAskSenior: true,
        upvotes: 18,
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      });

      setReplies([
        {
          _id: 'reply-1',
          content: `Here is the roadmap I used when preparing for Google and Uber SDE-1 interviews:

1. **Distributed Systems**: For entry-level, focus on understanding *Designing Data-Intensive Applications* (DDIA) Chapters 5-9 (Replication, Partitioning, Transactions, Consensus). You don't need to implement Paxos from scratch, but you must know why Split-Brain happens and quorum math (W + R > N).
2. **LLD**: Master Clean Architecture, Strategy Pattern, Factory Pattern, and Thread-Safe Concurrency (e.g. read-write locks, double-checked locking). Practice designing a Rate Limiter with Sliding Window Counter.
3. Don't stress too much on deep LSM compaction algorithms unless applying for infra roles. Focus 70% on DSA + LLD and 30% on High-Level distributed fundamentals.`,
          author: {
            name: 'Vikramaditya Rao',
            role: 'senior',
            isAlumni: true,
            university: 'IIT Bombay (Alumni SDE-2 @ Stripe)',
          },
          isAccepted: true,
          upvotes: 14,
          createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        },
      ]);
    }
  };

  const handleUpvotePost = async () => {
    try {
      await communityService.upvotePost(id);
      setPost(prev => (prev ? { ...prev, upvotes: prev.upvotes + 1 } : null));
    } catch {
      setPost(prev => (prev ? { ...prev, upvotes: prev.upvotes + 1 } : null));
    }
  };

  const handleUpvoteReply = async replyId => {
    try {
      await communityService.upvoteReply(replyId);
      setReplies(prev => prev.map(r => (r._id === replyId ? { ...r, upvotes: r.upvotes + 1 } : r)));
    } catch {
      setReplies(prev => prev.map(r => (r._id === replyId ? { ...r, upvotes: r.upvotes + 1 } : r)));
    }
  };

  const handleAcceptReply = async replyId => {
    try {
      await communityService.acceptReply(replyId);
      setReplies(prev =>
        prev.map(r => ({
          ...r,
          isAccepted: r._id === replyId,
        }))
      );
    } catch {
      setReplies(prev =>
        prev.map(r => ({
          ...r,
          isAccepted: r._id === replyId,
        }))
      );
    }
  };

  const handleAddReply = async e => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await communityService.addReply(id, { content: replyContent.trim() });
      if (res && res.data) {
        setReplies(prev => [...prev, res.data]);
      } else {
        setReplies(prev => [
          ...prev,
          {
            _id: `reply-${Date.now()}`,
            content: replyContent.trim(),
            author: { name: user?.name || 'You', role: user?.role || 'student' },
            isAccepted: false,
            upvotes: 0,
            createdAt: new Date().toISOString(),
          },
        ]);
      }
      setReplyContent('');
    } catch {
      setReplies(prev => [
        ...prev,
        {
          _id: `reply-${Date.now()}`,
          content: replyContent.trim(),
          author: { name: user?.name || 'You', role: user?.role || 'student' },
          isAccepted: false,
          upvotes: 0,
          createdAt: new Date().toISOString(),
        },
      ]);
      setReplyContent('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAuthor =
    user?.id === post?.author?._id ||
    user?._id === post?.author?._id ||
    post?.author?.name === user?.name;

  if (loading || !post) {
    return <div className="p-8 text-center text-surface-400">Loading discussion thread...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate('/community')}
          className="flex items-center gap-1.5 text-xs text-surface-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Discussions</span>
        </button>
      </div>

      {/* Main Post Card */}
      <Card className="border-surface-800 p-6 bg-surface-900/70 space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          {post.isAskSenior && (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
              <Sparkles className="w-3 h-3" />
              Ask a Senior
            </span>
          )}
          <Badge variant="brand" size="sm">
            {post.category}
          </Badge>
        </div>

        <h1 className="text-xl font-bold text-white leading-snug">{post.title}</h1>

        <div className="flex items-center gap-3 text-xs text-surface-400 pb-4 border-b border-surface-800">
          <div className="w-8 h-8 rounded-full bg-brand-600/30 text-brand-300 font-bold flex items-center justify-center text-xs border border-brand-500/30">
            {post.author?.name?.[0] || 'U'}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-white">{post.author?.name}</span>
              {post.author?.role === 'senior' && (
                <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                  <GraduationCap className="w-2.5 h-2.5" />
                  Alumni / Senior
                </span>
              )}
            </div>
            <span className="text-[11px] text-surface-500">
              {post.author?.university} • Posted on {new Date(post.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Post Markdown Content */}
        <div className="text-sm text-surface-200 leading-relaxed whitespace-pre-line font-normal">
          {post.content}
        </div>

        {/* Tags & Post Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-surface-800/80">
          <div className="flex items-center gap-2">
            {post.tags?.map(t => (
              <span
                key={t}
                className="flex items-center gap-1 text-[11px] text-surface-400 bg-surface-950 px-2 py-0.5 rounded-md border border-surface-800"
              >
                <Tag className="w-2.5 h-2.5" />
                {t}
              </span>
            ))}
          </div>

          <button
            onClick={handleUpvotePost}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-950 border border-surface-800 text-xs font-semibold text-surface-300 hover:text-brand-400 hover:border-brand-500/50 transition-colors"
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>Upvote ({post.upvotes})</span>
          </button>
        </div>
      </Card>

      {/* Replies Section */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-brand-400" />
            <span>
              {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
            </span>
          </h3>
        </div>

        {replies.length === 0 ? (
          <Card className="border-surface-800 p-8 text-center text-xs text-surface-400">
            No replies yet. Be the first senior or peer to answer this thread!
          </Card>
        ) : (
          replies.map(reply => (
            <Card
              key={reply._id}
              className={`p-5 transition-all bg-surface-900/60 ${
                reply.isAccepted
                  ? 'border-emerald-500/50 bg-emerald-500/5 shadow-sm'
                  : 'border-surface-800'
              }`}
            >
              {reply.isAccepted && (
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 mb-3 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 w-fit">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Accepted Best Answer</span>
                </div>
              )}

              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-surface-800 text-surface-300 font-bold flex items-center justify-center text-xs border border-surface-700">
                    {reply.author?.name?.[0] || 'U'}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-white text-xs">{reply.author?.name}</span>
                      {reply.author?.role === 'senior' && (
                        <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 font-medium">
                          <GraduationCap className="w-3 h-3" />
                          Verified Senior / Alumni
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-surface-500">
                      {new Date(reply.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isAuthor && !reply.isAccepted && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAcceptReply(reply._id)}
                      className="text-[11px] gap-1 h-7 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      Accept as Solution
                    </Button>
                  )}
                  <button
                    onClick={() => handleUpvoteReply(reply._id)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-950 border border-surface-800 text-[11px] font-semibold text-surface-300 hover:text-brand-400 transition-colors"
                  >
                    <ThumbsUp className="w-3 h-3" />
                    <span>{reply.upvotes || 0}</span>
                  </button>
                </div>
              </div>

              <div className="text-xs text-surface-200 leading-relaxed whitespace-pre-line pl-9">
                {reply.content}
              </div>
            </Card>
          ))
        )}

        {/* Reply Composer */}
        <Card className="border-surface-800 p-5 bg-surface-900/80">
          <form onSubmit={handleAddReply} className="space-y-3">
            <label htmlFor="reply-composer" className="block text-xs font-semibold text-white">
              Write a Mentorship / Peer Response
            </label>
            <textarea
              id="reply-composer"
              rows={4}
              placeholder="Share your structured insights, code references, or interview guidance..."
              value={replyContent}
              onChange={e => setReplyContent(e.target.value)}
              required
              className="w-full bg-surface-950 border border-surface-800 rounded-xl p-3 text-xs text-surface-200 focus:outline-none focus:border-brand-500 font-mono leading-relaxed resize-none"
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isSubmitting}
                className="gap-1.5 text-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Posting...' : 'Post Reply'}</span>
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default PostDetailPage;
