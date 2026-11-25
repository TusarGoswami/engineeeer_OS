import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Users,
  MessageSquare,
  ThumbsUp,
  Plus,
  Sparkles,
  Tag,
  GraduationCap,
  Search,
  Bookmark,
  Share2,
  CheckCircle2,
  ArrowUpDown,
  Flame,
} from 'lucide-react';
import {
  PageHeader,
  MetricStrip,
  MetricItem,
  Card,
  Button,
  Badge,
  Modal,
  Input,
  Select,
  Avatar,
  Skeleton,
  EmptyState,
  ErrorState,
  useToast,
} from '../../components/index.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { communityService } from '../../services/community.service.js';
import { MarkdownMessageRenderer } from '../ai-assistant/components/MarkdownMessageRenderer.jsx';

const CATEGORIES = [
  'All',
  'Ask a Senior',
  'Verified Alumni',
  'Placements',
  'GATE Prep',
  'System Design',
  'DSA',
  'Web Development',
  'AI/ML',
  'Projects',
  'Academics',
  'Career Advice',
];

const SORT_OPTIONS = [
  { value: 'latest', label: 'Latest First' },
  { value: 'top', label: 'Most Upvoted' },
  { value: 'discussed', label: 'Most Discussed' },
  { value: 'unanswered', label: 'Needs Replies' },
];

/**
 * Resolves populated author object cleanly across Mongo (authorId) and normalized shapes.
 */
function getAuthor(item) {
  if (!item) return {};
  if (item.authorId && typeof item.authorId === 'object') return item.authorId;
  if (item.author && typeof item.author === 'object') return item.author;
  return {};
}

/**
 * Extracts integer upvote count safely from schema upvoteCount or legacy array/number.
 */
function getUpvoteCount(item) {
  if (typeof item?.upvoteCount === 'number') return item.upvoteCount;
  if (Array.isArray(item?.upvotes)) return item.upvotes.length;
  return Number(item?.upvotes || 0);
}

/**
 * Community Forum & Senior-Junior Mentorship Network feed with category/tag discovery,
 * sorting, saved threads, live upvote toggles, and Markdown post creation.
 */
export const CommunityForumPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const currentUserId = user?.id || user?._id;
  const bookmarkKey = `engineeros_bookmarks_${currentUserId || 'guest'}`;

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTag, setSelectedTag] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  const [bookmarkedIds, setBookmarkedIds] = useState(() => {
    try {
      const saved = localStorage.getItem(bookmarkKey);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Create Post Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [composerMode, setComposerMode] = useState('write'); // 'write' | 'preview'
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('Career Advice');
  const [newTags, setNewTags] = useState('');
  const [newIsAskSenior, setNewIsAskSenior] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const params = {};
      if (selectedCategory === 'Ask a Senior') {
        params.isAskSenior = 'true';
      } else if (selectedCategory !== 'All' && selectedCategory !== 'Verified Alumni') {
        params.category = selectedCategory;
      }
      if (selectedTag) {
        params.tag = selectedTag;
      }
      const res = await communityService.getPosts(params);
      const list = Array.isArray(res?.data) ? res.data : res?.data?.posts || [];
      setPosts(list);
    } catch (err) {
      setPosts([]);
      setLoadError(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to load community discussions.'
      );
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedTag]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleToggleBookmark = (e, postId) => {
    e.stopPropagation();
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
        showToast('Removed from saved threads', 'info');
      } else {
        next.add(postId);
        showToast('Saved discussion for later reference', 'success');
      }
      try {
        localStorage.setItem(bookmarkKey, JSON.stringify([...next]));
      } catch {
        // Safe storage failure ignore
      }
      return next;
    });
  };

  const handleSharePost = (e, postId) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/community/${postId}`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(shareUrl);
      showToast('Discussion link copied to clipboard', 'success');
    } else {
      showToast('Share link ready', 'info');
    }
  };

  const handleUpvote = async (e, postId) => {
    e.stopPropagation();
    try {
      const res = await communityService.upvotePost(postId);
      const serverData = res?.data;
      setPosts((prev) =>
        prev.map((p) => {
          if (p._id !== postId) return p;
          if (serverData?.upvoteCount !== undefined) {
            const nextUpvoters = Array.isArray(p.upvotes)
              ? serverData.hasUpvoted && currentUserId
                ? [...new Set([...p.upvotes, currentUserId])]
                : p.upvotes.filter((id) => String(id) !== String(currentUserId))
              : p.upvotes;
            return {
              ...p,
              upvoteCount: serverData.upvoteCount,
              upvotes: nextUpvoters,
              hasUpvotedByMe: serverData.hasUpvoted,
            };
          }
          return {
            ...p,
            upvoteCount: getUpvoteCount(p) + 1,
            hasUpvotedByMe: true,
          };
        })
      );
    } catch (err) {
      showToast(err?.response?.data?.message || 'Unable to register upvote right now', 'error');
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        title: newTitle.trim(),
        content: newContent.trim(),
        category: newCategory,
        tags: newTags
          .split(',')
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean),
        isAskSenior: newIsAskSenior,
      };

      await communityService.createPost(payload);
      setIsCreateModalOpen(false);
      setNewTitle('');
      setNewContent('');
      setNewTags('');
      setNewIsAskSenior(false);
      setComposerMode('write');
      showToast('Discussion published to community', 'success');
      fetchPosts();
    } catch (err) {
      showToast(
        err?.response?.data?.message || 'Failed to publish post. Please try again.',
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Real feed stats and discovery insights computed from fetched posts
  const feedInsights = useMemo(() => {
    const askSeniorCount = posts.filter((p) => p.isAskSenior).length;
    const resolvedCount = posts.filter((p) => p.isResolved || p.hasAcceptedAnswer).length;

    const tagCounts = new Map();
    const mentorMap = new Map();

    for (const post of posts) {
      for (const tag of post.tags || []) {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      }

      const author = getAuthor(post);
      if (author?.name && (author.role === 'senior' || author.isAlumni)) {
        const key = author._id || author.name;
        const existing = mentorMap.get(key) || { ...author, count: 0 };
        existing.count += 1;
        mentorMap.set(key, existing);
      }
    }

    const trendingTags = Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const activeMentors = Array.from(mentorMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return { askSeniorCount, resolvedCount, trendingTags, activeMentors };
  }, [posts]);

  const displayedPosts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = posts.filter((p) => {
      const author = getAuthor(p);
      if (
        selectedCategory === 'Verified Alumni' &&
        !author.isAlumni &&
        author.role !== 'senior' &&
        p.category !== 'Verified Alumni'
      ) {
        return false;
      }
      if (showSavedOnly && !bookmarkedIds.has(p._id)) {
        return false;
      }
      if (!q) return true;
      return (
        (p.title || '').toLowerCase().includes(q) ||
        (p.content || '').toLowerCase().includes(q) ||
        (author.name || '').toLowerCase().includes(q) ||
        (p.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    });

    const sorted = [...filtered];
    if (sortBy === 'top') {
      sorted.sort((a, b) => getUpvoteCount(b) - getUpvoteCount(a));
    } else if (sortBy === 'discussed') {
      sorted.sort((a, b) => (b.repliesCount || 0) - (a.repliesCount || 0));
    } else if (sortBy === 'unanswered') {
      sorted.sort((a, b) => (a.repliesCount || 0) - (b.repliesCount || 0));
    } else {
      sorted.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }
    return sorted;
  }, [posts, selectedCategory, showSavedOnly, bookmarkedIds, searchQuery, sortBy]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <PageHeader
        eyebrow="~/community · Engineering Q&A & Mentorship Network"
        title="Senior-Junior Community Network"
        description="Technical discussions, peer debugging, career guidance, and alumni mentorship."
        actions={
          <Button
            type="button"
            variant="primary"
            size="md"
            leftIcon={Plus}
            onClick={() => setIsCreateModalOpen(true)}
          >
            New Discussion
          </Button>
        }
      />

      {/* Real Community Telemetry Strip */}
      <MetricStrip>
        <MetricItem
          label="Discussions Loaded"
          value={posts.length}
          subvalue={selectedCategory === 'All' ? 'Across engineering topics' : `Category: ${selectedCategory}`}
          icon={MessageSquare}
        />
        <MetricItem
          label="Ask a Senior"
          value={feedInsights.askSeniorCount}
          subvalue="Prioritized for mentor input"
          icon={Sparkles}
          accent="brand"
        />
        <MetricItem
          label="Resolved Threads"
          value={feedInsights.resolvedCount}
          subvalue="Verified accepted solutions"
          icon={CheckCircle2}
          accent="compiler"
        />
        <MetricItem
          label="Saved Bookmarks"
          value={bookmarkedIds.size}
          subvalue="Bookmarked on this device"
          icon={Bookmark}
        />
      </MetricStrip>

      {/* Discovery Bar: Category Chips, Search, Sort & Saved Filter */}
      <Card className="p-4 sm:p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex-1 min-w-0">
            <Input
              id="community-search"
              aria-label="Search discussions or tags"
              placeholder="Search discussions, authors, or topic tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={Search}
            />
          </div>

          <div className="w-full md:w-48 shrink-0">
            <Select
              aria-label="Sort discussions"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              leftIcon={ArrowUpDown}
              options={SORT_OPTIONS}
            />
          </div>

          <Button
            type="button"
            variant={showSavedOnly ? 'primary' : 'secondary'}
            size="md"
            leftIcon={Bookmark}
            onClick={() => setShowSavedOnly((prev) => !prev)}
            className="shrink-0"
          >
            Saved ({bookmarkedIds.size})
          </Button>
        </div>

        {/* Category Filter Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-3 border-t border-surface-700">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border inline-flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-brand-500 border-brand-500 text-white'
                    : 'bg-elevated/60 border-surface-700 text-surface-300 hover:bg-elevated hover:text-surface-100'
                }`}
              >
                {cat === 'Ask a Senior' && <Sparkles className="w-3 h-3" />}
                {cat === 'Verified Alumni' && <GraduationCap className="w-3 h-3" />}
                <span>{cat}</span>
              </button>
            );
          })}
        </div>

        {selectedTag && (
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-surface-400">Active Topic Tag:</span>
            <Badge variant="brand" size="sm">
              #{selectedTag}
            </Badge>
            <button
              type="button"
              onClick={() => setSelectedTag('')}
              className="text-brand-700 hover:underline font-medium"
            >
              Clear tag
            </button>
          </div>
        )}
      </Card>

      {/* Main Content Grid: Feed (8 cols) + Discovery Sidebar (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Feed Column */}
        <div className="lg:col-span-8 space-y-3.5">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-40 w-full rounded-xl" />
              ))}
            </div>
          ) : loadError ? (
            <ErrorState
              title="Unable to load discussions"
              message={loadError}
              onRetry={fetchPosts}
            />
          ) : displayedPosts.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No matching discussions"
              description="No threads match your active category, search query, or filter."
              actionLabel={
                selectedCategory !== 'All' || selectedTag || searchQuery || showSavedOnly
                  ? 'Reset Filters'
                  : 'New Discussion'
              }
              onAction={() => {
                if (selectedCategory !== 'All' || selectedTag || searchQuery || showSavedOnly) {
                  setSelectedCategory('All');
                  setSelectedTag('');
                  setSearchQuery('');
                  setShowSavedOnly(false);
                } else {
                  setIsCreateModalOpen(true);
                }
              }}
            />
          ) : (
            displayedPosts.map((post) => {
              const author = getAuthor(post);
              const upvoteTotal = getUpvoteCount(post);
              const isBookmarked = bookmarkedIds.has(post._id);
              const isResolved = Boolean(post.isResolved || post.hasAcceptedAnswer);
              const isSeniorOrAlumni = author?.role === 'senior' || Boolean(author?.isAlumni);
              const upvotedByMe =
                post.hasUpvotedByMe ||
                (Array.isArray(post.upvotes) &&
                  currentUserId &&
                  post.upvotes.some((uid) => String(uid) === String(currentUserId)));

              return (
                <Card
                  key={post._id}
                  hover
                  className="p-4 sm:p-5 cursor-pointer group"
                  onClick={() => navigate(`/community/${post._id}`)}
                >
                  <div className="flex items-start gap-3.5 sm:gap-4">
                    {/* Upvote Control */}
                    <button
                      type="button"
                      aria-label={`Upvote ${post.title}`}
                      aria-pressed={Boolean(upvotedByMe)}
                      onClick={(e) => handleUpvote(e, post._id)}
                      className={`flex flex-col items-center justify-center w-12 py-2 rounded-xl border transition-colors shrink-0 ${
                        upvotedByMe
                          ? 'bg-brand-500/12 border-brand-500/40 text-brand-700'
                          : 'bg-elevated/65 border-surface-700 text-surface-300 hover:text-brand-700 hover:border-brand-500/40'
                      }`}
                    >
                      <ThumbsUp className="w-4 h-4" />
                      <span className="font-mono text-xs font-bold mt-1 tabular-nums">
                        {upvoteTotal}
                      </span>
                    </button>

                    {/* Post Summary */}
                    <div className="flex-1 min-w-0 space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {post.isAskSenior && (
                            <Badge variant="warning" size="sm">
                              <Sparkles className="w-3 h-3" />
                              Ask a Senior
                            </Badge>
                          )}
                          <Badge variant="outline" size="sm">
                            {post.category}
                          </Badge>
                          {isResolved && (
                            <Badge variant="compiler" size="sm">
                              <CheckCircle2 className="w-3 h-3" />
                              Resolved
                            </Badge>
                          )}
                        </div>

                        {/* Quick Bookmark & Share Controls */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => handleToggleBookmark(e, post._id)}
                            aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark discussion'}
                            aria-pressed={isBookmarked}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              isBookmarked
                                ? 'bg-brand-500/10 border-brand-500/30 text-brand-700'
                                : 'bg-transparent border-transparent text-surface-400 hover:bg-elevated hover:text-surface-100'
                            }`}
                          >
                            <Bookmark className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleSharePost(e, post._id)}
                            aria-label="Share discussion link"
                            className="p-1.5 rounded-lg text-surface-400 hover:bg-elevated hover:text-surface-100 transition-colors"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-display text-base font-bold text-surface-100 group-hover:text-brand-700 transition-colors line-clamp-2 leading-snug">
                          {post.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-surface-400 line-clamp-2 mt-1 leading-relaxed">
                          {post.content}
                        </p>
                      </div>

                      {post.tags?.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          {post.tags.map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTag((prev) => (prev === t ? '' : t));
                              }}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-elevated border border-surface-700 text-[11px] font-mono text-surface-300 hover:border-brand-500/40 hover:text-brand-700 transition-colors"
                            >
                              <Tag className="w-2.5 h-2.5" />
                              {t}
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 text-xs text-surface-400 border-t border-surface-700">
                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar name={author?.name || 'Member'} size="xs" />
                          <span className="font-medium text-surface-200 truncate">
                            {author?.name || 'Community Member'}
                          </span>
                          {isSeniorOrAlumni && (
                            <Badge variant="gold" size="sm">
                              <GraduationCap className="w-3 h-3" />
                              Senior / Alumni
                            </Badge>
                          )}
                          {author?.university && (
                            <span className="hidden sm:inline text-[11px] text-surface-400 truncate">
                              · {author.university}
                            </span>
                          )}
                          <span className="text-[11px] font-mono text-surface-400">
                            · {new Date(post.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <span className="inline-flex items-center gap-1.5 font-mono text-xs text-surface-300 shrink-0">
                          <MessageSquare className="w-3.5 h-3.5 text-brand-700" />
                          <span>
                            {post.repliesCount || 0}{' '}
                            {post.repliesCount === 1 ? 'Reply' : 'Replies'}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {/* Discovery & Mentorship Sidebar (derived strictly from loaded posts) */}
        <aside className="lg:col-span-4 space-y-4">
          {/* Popular Topics Card */}
          <Card className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-brand-700" />
              <h2 className="font-display text-sm font-bold text-surface-100">
                Active Discussion Topics
              </h2>
            </div>

            {feedInsights.trendingTags.length === 0 ? (
              <p className="text-xs text-surface-400">
                Topic tags from live discussions will appear here.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {feedInsights.trendingTags.map(({ tag, count }) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSelectedTag((prev) => (prev === tag ? '' : tag))}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-[11px] border transition-colors ${
                      selectedTag === tag
                        ? 'bg-brand-500 border-brand-500 text-white font-semibold'
                        : 'bg-elevated/65 border-surface-700 text-surface-300 hover:bg-elevated hover:text-surface-100'
                    }`}
                  >
                    <span>#{tag}</span>
                    <span className="opacity-70">{count}</span>
                  </button>
                ))}
              </div>
            )}
          </Card>

          {/* Active Mentors & Verified Seniors Card */}
          <Card className="p-5 space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-700" />
                <h2 className="font-display text-sm font-bold text-surface-100">
                  Mentors &amp; Senior Voices
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCategory('Ask a Senior')}
                className="text-xs font-medium text-brand-700 hover:underline"
              >
                Ask a Senior &rarr;
              </button>
            </div>

            {feedInsights.activeMentors.length === 0 ? (
              <p className="text-xs text-surface-400">
                Senior and alumni contributors participating in current discussions will appear here.
              </p>
            ) : (
              <div className="space-y-2.5">
                {feedInsights.activeMentors.map((mentor, i) => (
                  <div
                    key={mentor._id || i}
                    className="p-3 rounded-xl bg-elevated/55 border border-surface-700 flex items-center justify-between gap-2.5"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar name={mentor.name} size="sm" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          {mentor.username ? (
                            <Link
                              to={`/u/${mentor.username}`}
                              className="text-xs font-semibold text-surface-100 hover:text-brand-700 truncate"
                            >
                              {mentor.name}
                            </Link>
                          ) : (
                            <span className="text-xs font-semibold text-surface-100 truncate">
                              {mentor.name}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-surface-400 truncate">
                          {mentor.profile?.currentCompany || mentor.university || 'Verified Alumni'}
                        </p>
                      </div>
                    </div>
                    <Badge variant="gold" size="sm">
                      {mentor.count} {mentor.count === 1 ? 'post' : 'posts'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </aside>
      </div>

      {/* New Discussion Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => !isSubmitting && setIsCreateModalOpen(false)}
        title="Start a Community Discussion"
        description="Ask a technical question, share preparation insights, or request senior review."
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreatePost} className="space-y-4">
          <Input
            id="post-title"
            label="Discussion Title"
            placeholder="e.g. Recommended resources for concurrency and synchronization?"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              id="post-category"
              label="Category"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              options={CATEGORIES.filter(
                (c) => c !== 'All' && c !== 'Ask a Senior' && c !== 'Verified Alumni'
              ).map((c) => ({ value: c, label: c }))}
            />
            <Input
              id="post-tags"
              label="Tags (comma separated)"
              placeholder="gate, algorithms, os"
              value={newTags}
              onChange={(e) => setNewTags(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="post-content"
                className="text-[13px] font-medium text-surface-100"
              >
                Description / Question Details
              </label>
              <div className="flex items-center gap-1 bg-elevated p-0.5 rounded-lg border border-surface-700 text-[11px]">
                <button
                  type="button"
                  onClick={() => setComposerMode('write')}
                  className={`px-2 py-0.5 rounded-md font-medium ${
                    composerMode === 'write'
                      ? 'bg-card text-surface-100'
                      : 'text-surface-400 hover:text-surface-100'
                  }`}
                >
                  Write
                </button>
                <button
                  type="button"
                  onClick={() => setComposerMode('preview')}
                  className={`px-2 py-0.5 rounded-md font-medium ${
                    composerMode === 'preview'
                      ? 'bg-card text-surface-100'
                      : 'text-surface-400 hover:text-surface-100'
                  }`}
                >
                  Preview
                </button>
              </div>
            </div>

            {composerMode === 'write' ? (
              <textarea
                id="post-content"
                rows={5}
                placeholder="Provide background, your current approach, or code snippets using ```..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                required
                className="w-full rounded-lg bg-auth-input border border-surface-600 p-3 text-surface-100 placeholder:text-surface-500 text-xs sm:text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 font-mono leading-relaxed resize-y"
              />
            ) : (
              <div className="min-h-[120px] p-3.5 rounded-lg bg-elevated/55 border border-surface-700 text-xs sm:text-sm">
                {newContent ? (
                  <MarkdownMessageRenderer content={newContent} />
                ) : (
                  <span className="text-surface-400 italic">Nothing to preview yet.</span>
                )}
              </div>
            )}
          </div>

          <label className="flex items-start gap-2.5 p-3 rounded-xl bg-elevated/55 border border-surface-700 cursor-pointer text-xs text-surface-300">
            <input
              type="checkbox"
              id="ask-senior-toggle"
              checked={newIsAskSenior}
              onChange={(e) => setNewIsAskSenior(e.target.checked)}
              className="mt-0.5 rounded border-surface-600 text-brand-500 focus:ring-brand-500"
            />
            <span>
              <strong className="text-surface-100">Ask a Senior:</strong> Prioritize this discussion
              for senior undergrad and alumni mentorship review.
            </span>
          </label>

          <div className="flex justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              Publish Post
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CommunityForumPage;
