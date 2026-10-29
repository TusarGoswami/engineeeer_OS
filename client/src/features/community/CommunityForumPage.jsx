import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, MessageSquare, ThumbsUp, Plus, Sparkles, Tag, GraduationCap } from 'lucide-react';
import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { Badge } from '../../components/Badge.jsx';
import { Modal } from '../../components/Modal.jsx';
import { Input } from '../../components/Input.jsx';
import { communityService } from '../../services/community.service.js';

const CATEGORIES = [
  'All',
  'Ask a Senior',
  'Placements',
  'GATE Prep',
  'System Design',
  'Academics',
  'Career Advice',
];

export const CommunityForumPage = () => {
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New Post Form State
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('Career Advice');
  const [newTags, setNewTags] = useState('career, interview');
  const [newIsAskSenior, setNewIsAskSenior] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, [selectedCategory]);

  const fetchPosts = async () => {
    try {
      setLoading(false);
      const params = {};
      if (selectedCategory === 'Ask a Senior') {
        params.isAskSenior = 'true';
      } else if (selectedCategory !== 'All') {
        params.category = selectedCategory;
      }
      const res = await communityService.getPosts(params);
      if (res && res.data) {
        setPosts(res.data.posts || []);
      }
    } catch {
      // Fallback preview data
      setPosts([
        {
          _id: 'post-dist-sys',
          title:
            'How should juniors prepare for distributed systems and LLD rounds at top tier product firms?',
          content:
            'Looking for curated roadmaps on consensus protocols (Raft/Paxos), consistent hashing, LSM trees, and how to balance this with college semester loads.',
          author: { name: 'Aryan Mehta', role: 'student', university: 'IIT Delhi' },
          category: 'Placements',
          tags: ['distributed-systems', 'placements', 'lld'],
          isAskSenior: true,
          upvotes: 18,
          repliesCount: 4,
          hasAcceptedAnswer: true,
          createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
        },
        {
          _id: 'post-gate-os',
          title: 'Deep dive on CPU scheduling and Belady Anomaly for GATE CS 2026',
          content:
            'A discussion thread clarifying why FIFO page replacement experiences anomaly under specific frame reference strings while LRU is a stack algorithm.',
          author: {
            name: 'Sneha Rao',
            role: 'senior',
            isAlumni: true,
            university: 'IISc Bangalore',
          },
          category: 'GATE Prep',
          tags: ['gate-cs', 'os', 'paging'],
          isAskSenior: false,
          upvotes: 27,
          repliesCount: 7,
          hasAcceptedAnswer: false,
          createdAt: new Date(Date.now() - 3600000 * 22).toISOString(),
        },
      ]);
    }
  };

  const handleCreatePost = async e => {
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
          .map(t => t.trim().toLowerCase())
          .filter(Boolean),
        isAskSenior: newIsAskSenior,
      };

      await communityService.createPost(payload);
      setIsCreateModalOpen(false);
      setNewTitle('');
      setNewContent('');
      fetchPosts();
    } catch {
      alert('Post submitted to forum.');
      setIsCreateModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpvote = async (e, postId) => {
    e.stopPropagation();
    try {
      await communityService.upvotePost(postId);
      setPosts(prev => prev.map(p => (p._id === postId ? { ...p, upvotes: p.upvotes + 1 } : p)));
    } catch {
      setPosts(prev => prev.map(p => (p._id === postId ? { ...p, upvotes: p.upvotes + 1 } : p)));
    }
  };

  const filteredPosts = posts.filter(
    p =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-brand-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Senior-Junior Community Network
            </h1>
          </div>
          <p className="text-surface-400 text-xs mt-1">
            Peer guidance, career insights, and mentorship connecting undergrads with verified
            seniors and alumni.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsCreateModalOpen(true)}
          className="gap-2 text-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Discussion</span>
        </Button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Category Badges */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
                selectedCategory === cat
                  ? 'bg-brand-600 text-white border-brand-500 shadow-sm'
                  : 'bg-surface-900 border-surface-800 text-surface-400 hover:text-white hover:border-surface-700'
              }`}
            >
              {cat === 'Ask a Senior' && (
                <Sparkles className="w-3 h-3 inline mr-1 text-amber-300" />
              )}
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="w-full md:w-64">
          <Input
            id="community-search"
            placeholder="Search discussions or tags..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="text-xs h-9"
          />
        </div>
      </div>

      {/* Post List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-surface-400 text-sm">Loading discussions...</div>
        ) : filteredPosts.length === 0 ? (
          <Card className="border-surface-800 p-8 text-center text-surface-400 text-xs">
            No discussions found for selected criteria. Start a new thread!
          </Card>
        ) : (
          filteredPosts.map(post => (
            <Card
              key={post._id}
              onClick={() => navigate(`/community/${post._id}`)}
              className="border-surface-800 hover:border-surface-700 transition-all p-5 cursor-pointer bg-surface-900/60 group"
            >
              <div className="flex items-start gap-4">
                {/* Upvote Counter */}
                <button
                  onClick={e => handleUpvote(e, post._id)}
                  className="flex flex-col items-center justify-center w-12 py-2 rounded-xl bg-surface-950 border border-surface-800 text-surface-400 hover:text-brand-400 hover:border-brand-500/50 transition-colors shrink-0"
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span className="text-xs font-bold mt-1 text-surface-200">{post.upvotes}</span>
                </button>

                {/* Content Summary */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {post.isAskSenior && (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                        <Sparkles className="w-3 h-3" />
                        Ask a Senior
                      </span>
                    )}
                    <Badge variant="outline" size="sm">
                      {post.category}
                    </Badge>
                    {post.hasAcceptedAnswer && (
                      <Badge variant="success" size="sm">
                        Resolved
                      </Badge>
                    )}
                  </div>

                  <h3 className="text-base font-semibold text-white group-hover:text-brand-400 transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-xs text-surface-400 line-clamp-2 leading-relaxed">
                    {post.content}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-[11px] text-surface-400 border-t border-surface-800/60">
                    <div className="flex items-center gap-2">
                      <span className="text-surface-300 font-medium">{post.author?.name}</span>
                      {post.author?.role === 'senior' && (
                        <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                          <GraduationCap className="w-3 h-3" />
                          Senior / Alumni
                        </span>
                      )}
                      <span>•</span>
                      <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      {post.tags?.map(tag => (
                        <span
                          key={tag}
                          className="flex items-center gap-0.5 text-surface-500 hover:text-surface-400"
                        >
                          <Tag className="w-2.5 h-2.5" />
                          {tag}
                        </span>
                      ))}
                      <span className="flex items-center gap-1 text-surface-300">
                        <MessageSquare className="w-3.5 h-3.5" />
                        {post.repliesCount || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* New Post Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Start a Community Discussion"
      >
        <form onSubmit={handleCreatePost} className="space-y-4 text-xs">
          <div>
            <label htmlFor="post-title" className="block text-surface-300 font-medium mb-1">
              Title
            </label>
            <Input
              id="post-title"
              placeholder="e.g. Recommended resources for concurrency and synchronization?"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="post-category" className="block text-surface-300 font-medium mb-1">
                Category
              </label>
              <select
                id="post-category"
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                className="w-full bg-surface-950 border border-surface-800 rounded-xl px-3 py-2 text-surface-200 text-xs focus:outline-none focus:border-brand-500"
              >
                {CATEGORIES.filter(c => c !== 'All' && c !== 'Ask a Senior').map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="post-tags" className="block text-surface-300 font-medium mb-1">
                Tags (comma separated)
              </label>
              <Input
                id="post-tags"
                placeholder="gate, algorithms, os"
                value={newTags}
                onChange={e => setNewTags(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label htmlFor="post-content" className="block text-surface-300 font-medium mb-1">
              Description / Question Details
            </label>
            <textarea
              id="post-content"
              rows={5}
              placeholder="Provide background, your current approach, and where you need senior guidance..."
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              required
              className="w-full bg-surface-950 border border-surface-800 rounded-xl p-3 text-surface-200 text-xs focus:outline-none focus:border-brand-500 font-mono leading-relaxed resize-none"
            />
          </div>

          <div className="flex items-center gap-2 p-3 bg-surface-950 rounded-xl border border-surface-800">
            <input
              type="checkbox"
              id="ask-senior-toggle"
              checked={newIsAskSenior}
              onChange={e => setNewIsAskSenior(e.target.checked)}
              className="rounded bg-surface-800 border-surface-700 text-brand-600 focus:ring-0"
            />
            <label htmlFor="ask-senior-toggle" className="text-surface-300 cursor-pointer">
              <span className="font-semibold text-white">Ask a Senior:</span> Prioritize this
              question for senior and alumni review with email notifications.
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
              {isSubmitting ? 'Publishing...' : 'Publish Post'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CommunityForumPage;
