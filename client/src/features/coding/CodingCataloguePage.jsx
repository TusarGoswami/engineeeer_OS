import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
  Code2,
  CheckCircle2,
  Layers,
  Flame,
  ArrowUpDown,
} from 'lucide-react';
import { codingService } from '../../services/coding.service.js';
import {
  PageHeader,
  MetricStrip,
  MetricItem,
  Card,
  Badge,
  Button,
  Input,
  Select,
  EmptyState,
  Skeleton,
} from '../../components/index.js';

const TOPIC_TAGS = [
  'Array',
  'Hash Table',
  'Dynamic Programming',
  'Tree',
  'Graph',
  'Two Pointers',
  'Stack',
  'Greedy',
  'Binary Search',
  'String',
];

const DIFFICULTY_WEIGHT = { easy: 1, medium: 2, hard: 3 };

/**
 * Coding problem discovery workspace with API-backed search/filters, client sorting, and structured table/list rows.
 */
export function CodingCataloguePage() {
  const navigate = useNavigate();
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [difficulty, setDifficulty] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('default');

  const fetchProblems = async (overrides = {}) => {
    try {
      setLoading(true);
      const nextDifficulty = overrides.difficulty !== undefined ? overrides.difficulty : difficulty;
      const nextTag = overrides.tag !== undefined ? overrides.tag : selectedTag;
      const nextSearch = overrides.search !== undefined ? overrides.search : search;

      const params = {};
      if (nextDifficulty) params.difficulty = nextDifficulty;
      if (nextTag) params.tag = nextTag;
      if (nextSearch) params.search = nextSearch;

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

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProblems();
  };

  const handleClearFilters = () => {
    setSearch('');
    setDifficulty('');
    setSelectedTag('');
    setSortBy('default');
    fetchProblems({ difficulty: '', tag: '', search: '' });
  };

  const summary = useMemo(() => {
    const easy = problems.filter((p) => p.difficulty === 'easy').length;
    const medium = problems.filter((p) => p.difficulty === 'medium').length;
    const hard = problems.filter((p) => p.difficulty === 'hard').length;
    return { easy, medium, hard };
  }, [problems]);

  const sortedProblems = useMemo(() => {
    const copy = [...problems];
    if (sortBy === 'title') {
      copy.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (sortBy === 'diff-asc') {
      copy.sort(
        (a, b) => (DIFFICULTY_WEIGHT[a.difficulty] || 99) - (DIFFICULTY_WEIGHT[b.difficulty] || 99)
      );
    } else if (sortBy === 'diff-desc') {
      copy.sort(
        (a, b) => (DIFFICULTY_WEIGHT[b.difficulty] || 0) - (DIFFICULTY_WEIGHT[a.difficulty] || 0)
      );
    }
    return copy;
  }, [problems, sortBy]);

  const getDifficultyBadge = (diff) => {
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
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <PageHeader
        eyebrow="~/coding-arena · Multi-Language Judge0 Sandbox"
        title="Coding Challenges"
        description="Master core engineering interview patterns with live execution, sample debugging, and hidden verification"
        actions={
          <div className="px-3 py-1.5 rounded-lg bg-card border border-surface-700 font-mono text-xs text-surface-200 shadow-2xs">
            <span className="badge-compiler font-bold">{problems.length}</span> Curated Problems
          </div>
        }
      />

      {/* Real-Data Difficulty Telemetry Strip */}
      <MetricStrip>
        <MetricItem
          label="Catalogue Results"
          value={problems.length}
          subvalue={selectedTag ? `Topic: #${selectedTag}` : 'Matching active filters'}
          icon={Code2}
        />
        <MetricItem
          label="Easy"
          value={summary.easy}
          subvalue="Foundational patterns"
          icon={CheckCircle2}
          accent="compiler"
        />
        <MetricItem
          label="Medium"
          value={summary.medium}
          subvalue="Core interview tier"
          icon={Layers}
          accent="brand"
        />
        <MetricItem
          label="Hard"
          value={summary.hard}
          subvalue="Advanced algorithms"
          icon={Flame}
        />
      </MetricStrip>

      {/* Filter, Search, Sort & Topic Navigation */}
      <Card className="p-4 sm:p-5 space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="flex-1 min-w-0">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search problem title, keyword, or concept..."
              leftIcon={Search}
            />
          </div>

          <div className="w-full md:w-48 shrink-0">
            <Select
              aria-label="Sort problems"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              leftIcon={ArrowUpDown}
              options={[
                { value: 'default', label: 'Sort: Default' },
                { value: 'diff-asc', label: 'Difficulty: Easy → Hard' },
                { value: 'diff-desc', label: 'Difficulty: Hard → Easy' },
                { value: 'title', label: 'Title: A → Z' },
              ]}
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button type="submit" variant="primary" size="md" className="flex-1 md:flex-initial">
              Search
            </Button>
            {(search || difficulty || selectedTag || sortBy !== 'default') && (
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={handleClearFilters}
              >
                Clear
              </Button>
            )}
          </div>
        </form>

        {/* Difficulty Selector */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-surface-700">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-surface-400 mr-1.5 inline-flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Difficulty:
            </span>
            {[
              { id: '', label: 'All' },
              { id: 'easy', label: 'Easy' },
              { id: 'medium', label: 'Medium' },
              { id: 'hard', label: 'Hard' },
            ].map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDifficulty(d.id)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors border ${
                  difficulty === d.id
                    ? 'bg-brand-500 border-brand-500 text-white font-semibold'
                    : 'bg-elevated/70 border-surface-700 text-surface-300 hover:bg-elevated hover:text-surface-100'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Topic Navigation Tags */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          <span className="font-mono text-[11px] text-surface-400 mr-1">Topics:</span>
          {TOPIC_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors border ${
                selectedTag === tag
                  ? 'bg-compiler-500/12 badge-compiler border-compiler-500/35 font-semibold'
                  : 'bg-elevated/55 text-surface-300 border-surface-700 hover:border-surface-600 hover:text-surface-100'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      </Card>

      {/* Structured Problems Directory */}
      <div>
        {loading ? (
          <div className="space-y-2.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : sortedProblems.length === 0 ? (
          <EmptyState
            icon={Code2}
            title="No matching problems"
            description="No problems found matching your search query, difficulty tier, or topic tag."
            actionLabel="Reset Filters"
            onAction={handleClearFilters}
          />
        ) : (
          <div className="rounded-xl border border-surface-700 bg-card shadow-[var(--shadow-card)] overflow-hidden">
            {/* Desktop Directory Header */}
            <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-5 py-2.5 border-b border-surface-700 bg-elevated/75 font-mono text-[11px] font-semibold uppercase tracking-wider text-surface-400">
              <div className="col-span-6">Problem</div>
              <div className="col-span-2">Difficulty</div>
              <div className="col-span-2">Metrics</div>
              <div className="col-span-2 text-right">Action</div>
            </div>

            <div className="divide-y divide-surface-700">
              {sortedProblems.map((prob, idx) => {
                const isSolved = Boolean(prob.isSolved || prob.solved || prob.status === 'solved');
                const hasRate = prob.acceptanceRate !== undefined && prob.acceptanceRate !== null;

                return (
                  <div
                    key={prob._id}
                    onClick={() => navigate(`/coding/solve/${prob.slug}`)}
                    className="grid grid-cols-1 sm:grid-cols-12 items-center gap-3 sm:gap-4 px-4 py-3.5 sm:px-5 hover:bg-elevated/45 transition-colors cursor-pointer group"
                  >
                    {/* Title & Tags */}
                    <div className="sm:col-span-6 flex items-start gap-3 min-w-0">
                      <span className="font-mono text-xs text-surface-400 w-6 shrink-0 pt-0.5 tabular-nums">
                        {idx + 1}.
                      </span>
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {isSolved && (
                            <CheckCircle2
                              className="w-4 h-4 badge-compiler shrink-0"
                              aria-label="Solved"
                            />
                          )}
                          <h3 className="font-display text-sm font-semibold text-surface-100 group-hover:text-brand-700 transition-colors truncate">
                            {prob.title}
                          </h3>
                        </div>
                        {prob.tags?.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {prob.tags.slice(0, 3).map((t) => (
                              <span
                                key={t}
                                className="text-[10px] font-mono text-surface-400 bg-elevated px-1.5 py-0.5 rounded border border-surface-700/70"
                              >
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Difficulty */}
                    <div className="sm:col-span-2 flex items-center gap-2">
                      {getDifficultyBadge(prob.difficulty)}
                    </div>

                    {/* Acceptance Rate OR Real Sample Count (no fake numbers) */}
                    <div className="sm:col-span-2 flex items-center gap-1.5 text-xs font-mono text-surface-400">
                      <TrendingUp className="w-3.5 h-3.5 text-surface-400 shrink-0" />
                      <span>
                        {hasRate
                          ? `${prob.acceptanceRate}% Acc`
                          : `${prob.sampleTestCases?.length || 0} Samples`}
                      </span>
                    </div>

                    {/* Solve Action (always visible on mobile & desktop) */}
                    <div className="sm:col-span-2 flex sm:justify-end">
                      <Button
                        size="sm"
                        variant="secondary"
                        rightIcon={ArrowRight}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/coding/solve/${prob.slug}`);
                        }}
                      >
                        Solve
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CodingCataloguePage;
