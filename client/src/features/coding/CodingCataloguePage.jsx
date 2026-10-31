import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { codingService } from '../../services/coding.service.js';
import Card from '../../components/Card.jsx';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Input from '../../components/Input.jsx';

export function CodingCataloguePage() {
  const navigate = useNavigate();
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [difficulty, setDifficulty] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [search, setSearch] = useState('');

  const TAGS = [
    'Array',
    'Hash Table',
    'Dynamic Programming',
    'Tree',
    'Graph',
    'Two Pointers',
    'Stack',
    'Greedy',
    'String',
  ];

  const fetchProblems = async () => {
    try {
      setLoading(true);
      const params = {};
      if (difficulty) params.difficulty = difficulty;
      if (selectedTag) params.tag = selectedTag;
      if (search) params.search = search;

      const res = await codingService.getProblems(params);
      setProblems(res.data || []);
    } catch {
      // Handled silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProblems();
  }, [difficulty, selectedTag]);

  const handleSearchSubmit = e => {
    e.preventDefault();
    fetchProblems();
  };

  const getDifficultyBadge = diff => {
    switch (diff) {
      case 'easy':
        return <Badge variant="success">Easy</Badge>;
      case 'medium':
        return <Badge variant="warning">Medium</Badge>;
      case 'hard':
        return <Badge variant="danger">Hard</Badge>;
      default:
        return <Badge>{diff}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-emerald-400">
              Algorithm & Data Structure Arena
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-0.5">
            Coding Challenges
          </h1>
          <p className="text-sm text-surface-400 mt-1">
            Master core engineering interview patterns with sandboxed multi-language execution
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-2 rounded-xl bg-surface-900 border border-surface-800 text-xs text-surface-300 font-mono">
            <span className="text-emerald-400 font-bold">{problems.length}</span> Curated Problems
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-4 sm:p-5 border-surface-800 bg-surface-900/60 space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex-1 w-full">
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search problem title, keyword, or concept..."
              leftIcon={Search}
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button type="submit" variant="primary" size="sm" className="w-full sm:w-auto">
              Search
            </Button>
            {(search || difficulty || selectedTag) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setDifficulty('');
                  setSelectedTag('');
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </form>

        {/* Difficulty Selector Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-surface-800/80">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-surface-400 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Difficulty:
            </span>
            {[
              { id: '', label: 'All' },
              { id: 'easy', label: 'Easy' },
              { id: 'medium', label: 'Medium' },
              { id: 'hard', label: 'Hard' },
            ].map(d => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDifficulty(d.id)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  difficulty === d.id
                    ? 'bg-brand-600 text-white font-semibold'
                    : 'bg-surface-800/60 text-surface-300 hover:bg-surface-800 hover:text-white'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Topic Roadmap Tags */}
        <div className="flex items-center gap-1.5 flex-wrap pt-2">
          <span className="text-xs text-surface-500 mr-1">Topics:</span>
          {TAGS.map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors ${
                selectedTag === tag
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold'
                  : 'bg-surface-950/60 text-surface-400 border border-surface-800 hover:border-surface-700 hover:text-surface-200'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      </Card>

      {/* Problems List */}
      <div className="space-y-2.5">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 rounded-xl bg-surface-900/40 border border-surface-800 animate-pulse" />
            ))}
          </div>
        ) : problems.length === 0 ? (
          <Card className="p-12 text-center text-surface-400 text-sm">
            No problems found matching the selected filters.
          </Card>
        ) : (
          problems.map((prob, idx) => (
            <div
              key={prob._id}
              onClick={() => navigate(`/coding/solve/${prob.slug}`)}
              className="flex items-center justify-between p-4 rounded-xl border border-surface-800 bg-surface-900/40 hover:bg-surface-900/80 hover:border-surface-700 transition-all cursor-pointer group shadow-sm"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <span className="text-xs font-mono text-surface-500 w-6 shrink-0">
                  {idx + 1}.
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white group-hover:text-brand-400 transition-colors truncate">
                      {prob.title}
                    </h3>
                    {getDifficultyBadge(prob.difficulty)}
                  </div>
                  {prob.tags?.length > 0 && (
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {prob.tags.slice(0, 3).map(t => (
                        <span key={t} className="text-[10px] font-mono text-surface-400">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="hidden sm:flex items-center gap-1 text-xs font-mono text-surface-400">
                  <TrendingUp className="w-3.5 h-3.5 text-surface-500" />
                  <span>{prob.acceptanceRate || 65}%</span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  rightIcon={ArrowRight}
                >
                  Solve
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default CodingCataloguePage;
