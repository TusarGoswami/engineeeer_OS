import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { codingService } from '../../services/coding.service.js';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Input from '../../components/Input';

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

  useEffect(() => {
    fetchProblems();
  }, [difficulty, selectedTag]);

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header section */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '2rem',
              fontWeight: 800,
              color: 'var(--text-main)',
              margin: '0 0 0.5rem 0',
            }}
          >
            DSA & Algorithm Arena
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0 }}>
            Master core technical interview problems with low-latency sandboxed execution.
          </p>
        </div>
      </div>

      {/* Filter and Search controls */}
      <Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <form
            onSubmit={handleSearchSubmit}
            style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}
          >
            <div style={{ flex: 1, minWidth: '240px' }}>
              <Input
                placeholder="Search problem title or keywords..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Button type="submit" variant="primary">
              Search
            </Button>
            {(difficulty || selectedTag || search) && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setDifficulty('');
                  setSelectedTag('');
                  setSearch('');
                }}
              >
                Clear Filters
              </Button>
            )}
          </form>

          {/* Difficulty pills */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Difficulty:
            </span>
            {['', 'easy', 'medium', 'hard'].map(d => (
              <button
                key={d || 'all'}
                onClick={() => setDifficulty(d)}
                style={{
                  background:
                    difficulty === d
                      ? 'var(--primary-subtle, rgba(99, 102, 241, 0.2))'
                      : 'transparent',
                  color: difficulty === d ? 'var(--primary, #6366f1)' : 'var(--text-muted)',
                  border: `1px solid ${difficulty === d ? 'var(--primary, #6366f1)' : 'var(--border)'}`,
                  borderRadius: '20px',
                  padding: '4px 14px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  transition: 'all 0.15s ease',
                }}
              >
                {d || 'All'}
              </button>
            ))}
          </div>

          {/* Tag pills */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Topics:
            </span>
            {TAGS.map(t => (
              <button
                key={t}
                onClick={() => setSelectedTag(selectedTag === t ? '' : t)}
                style={{
                  background:
                    selectedTag === t
                      ? 'var(--primary-subtle, rgba(99, 102, 241, 0.2))'
                      : 'transparent',
                  color: selectedTag === t ? 'var(--primary, #6366f1)' : 'var(--text-muted)',
                  border: `1px solid ${selectedTag === t ? 'var(--primary, #6366f1)' : 'var(--border)'}`,
                  borderRadius: '16px',
                  padding: '3px 10px',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Problem list table */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading algorithm challenges...
          </div>
        ) : problems.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No problems found matching selected criteria.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr
                  style={{
                    borderBottom: '1px solid var(--border)',
                    background: 'rgba(255, 255, 255, 0.02)',
                  }}
                >
                  <th
                    style={{
                      padding: '1rem 1.5rem',
                      color: 'var(--text-muted)',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                    }}
                  >
                    Title
                  </th>
                  <th
                    style={{
                      padding: '1rem 1.5rem',
                      color: 'var(--text-muted)',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                    }}
                  >
                    Difficulty
                  </th>
                  <th
                    style={{
                      padding: '1rem 1.5rem',
                      color: 'var(--text-muted)',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                    }}
                  >
                    Topics
                  </th>
                  <th
                    style={{
                      padding: '1rem 1.5rem',
                      textAlign: 'right',
                      color: 'var(--text-muted)',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                    }}
                  >
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {problems.map(prob => (
                  <tr
                    key={prob._id}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      transition: 'background 0.15s ease',
                      cursor: 'pointer',
                    }}
                    onClick={() => navigate(`/coding/solve/${prob.slug}`)}
                  >
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <div
                        style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.95rem' }}
                      >
                        {prob.title}
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      {getDifficultyBadge(prob.difficulty)}
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {(prob.tags || []).map(tg => (
                          <span
                            key={tg}
                            style={{
                              fontSize: '0.75rem',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: 'var(--bg-glass, rgba(255, 255, 255, 0.05))',
                              color: 'var(--text-muted)',
                              border: '1px solid var(--border)',
                            }}
                          >
                            {tg}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={e => {
                          e.stopPropagation();
                          navigate(`/coding/solve/${prob.slug}`);
                        }}
                      >
                        Solve
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

export default CodingCataloguePage;
