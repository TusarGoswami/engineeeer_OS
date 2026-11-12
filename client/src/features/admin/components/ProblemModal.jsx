import { useState, useEffect } from 'react';
import { Modal } from '../../../components/Modal.jsx';
import { Button } from '../../../components/Button.jsx';
import { Input } from '../../../components/Input.jsx';
import { Plus, Trash2, CheckCircle2 } from 'lucide-react';

export const ProblemModal = ({ isOpen, onClose, problem, onSave }) => {
  const isEditing = Boolean(problem?._id);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [tags, setTags] = useState('array, algorithms');
  const [timeLimitMs, setTimeLimitMs] = useState(2000);
  const [memoryLimitKb, setMemoryLimitKb] = useState(256000);
  const [statement, setStatement] = useState('');
  const [starterPython, setStarterPython] = useState('# Write your solution here\ndef solve():\n    pass\n');
  const [sampleCases, setSampleCases] = useState([{ input: '', output: '', explanation: '' }]);
  const [hiddenCases, setHiddenCases] = useState([{ input: '', expectedOutput: '', isHidden: true }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (problem) {
      setTitle(problem.title || '');
      setSlug(problem.slug || '');
      setDifficulty(problem.difficulty || 'medium');
      setTags(problem.tags?.join(', ') || '');
      setTimeLimitMs(problem.constraints?.timeLimitMs || 2000);
      setMemoryLimitKb(problem.constraints?.memoryLimitKb || 256000);
      setStatement(problem.statementMarkdown || '');
      setStarterPython(problem.starterCode?.python || '');
      setSampleCases(problem.sampleTestCases?.length ? problem.sampleTestCases : [{ input: '', output: '', explanation: '' }]);
      setHiddenCases(problem.testCases?.length ? problem.testCases : [{ input: '', expectedOutput: '', isHidden: true }]);
    } else {
      setTitle('');
      setSlug('');
      setDifficulty('medium');
      setTags('array, algorithms');
      setTimeLimitMs(2000);
      setMemoryLimitKb(256000);
      setStatement('### Problem Description\n\nGiven an array of integers...');
      setStarterPython('# Write your solution here\ndef solve():\n    pass\n');
      setSampleCases([{ input: '2\n3 4', output: '7', explanation: '3 + 4 = 7' }]);
      setHiddenCases([{ input: '10\n15 25', expectedOutput: '40', isHidden: true }]);
    }
    setError('');
  }, [problem, isOpen]);

  const handleTitleChange = (e) => {
    const val = e.target.value;
    setTitle(val);
    if (!isEditing) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
      );
    }
  };

  const handleAddSample = () => {
    setSampleCases([...sampleCases, { input: '', output: '', explanation: '' }]);
  };

  const handleRemoveSample = (idx) => {
    setSampleCases(sampleCases.filter((_, i) => i !== idx));
  };

  const handleAddHiddenCase = () => {
    setHiddenCases([...hiddenCases, { input: '', expectedOutput: '', isHidden: true }]);
  };

  const handleRemoveHiddenCase = (idx) => {
    setHiddenCases(hiddenCases.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim() || !slug.trim() || !statement.trim()) {
      setError('Please fill in title, slug, and statement markdown');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        title: title.trim(),
        slug: slug.trim(),
        difficulty,
        tags: tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean),
        statementMarkdown: statement.trim(),
        constraints: {
          timeLimitMs: Number(timeLimitMs),
          memoryLimitKb: Number(memoryLimitKb),
        },
        starterCode: {
          python: starterPython,
        },
        sampleTestCases: sampleCases.filter((c) => c.input && c.output),
      };

      await onSave(payload, hiddenCases.filter((c) => c.input && c.expectedOutput));
      onClose();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to save problem');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Algorithm Problem' : 'Author New Algorithm Challenge'}
      maxWidth="max-w-4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-xs">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Problem Title"
            value={title}
            onChange={handleTitleChange}
            placeholder="e.g. Reverse Linked List"
            required
          />

          <Input
            label="URL Slug (Unique)"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="e.g. reverse-linked-list"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-surface-300 font-medium mb-1">Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full h-9 rounded-xl bg-surface-950 border border-surface-800 text-surface-200 px-3 focus:outline-none focus:border-brand-500"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <Input
            label="Topic Tags (comma-separated)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="arrays, two-pointers, hash-table"
          />

          <Input
            label="Time Limit (ms)"
            type="number"
            value={timeLimitMs}
            onChange={(e) => setTimeLimitMs(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-surface-300 font-medium mb-1">Problem Statement (Markdown)</label>
          <textarea
            rows={5}
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
            placeholder="Write full problem description, input/output specifications, and constraints..."
            className="w-full p-3 rounded-xl bg-surface-950 border border-surface-800 text-surface-200 font-mono text-xs focus:outline-none focus:border-brand-500"
            required
          />
        </div>

        <div>
          <label className="block text-surface-300 font-medium mb-1">Starter Code Template (Python)</label>
          <textarea
            rows={4}
            value={starterPython}
            onChange={(e) => setStarterPython(e.target.value)}
            className="w-full p-3 rounded-xl bg-surface-950 border border-surface-800 text-surface-200 font-mono text-xs focus:outline-none focus:border-brand-500"
          />
        </div>

        {/* Sample Test Cases */}
        <div className="space-y-3 pt-3 border-t border-surface-800">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-surface-200">Sample Test Cases (Visible in Description)</span>
            <Button type="button" variant="outline" size="sm" onClick={handleAddSample} className="gap-1 text-[11px]">
              <Plus className="w-3 h-3" /> Add Sample
            </Button>
          </div>

          {sampleCases.map((c, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-surface-950/60 border border-surface-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-surface-400 font-mono text-[11px]">Sample #{idx + 1}</span>
                {sampleCases.length > 1 && (
                  <button type="button" onClick={() => handleRemoveSample(idx)} className="text-rose-400 hover:text-rose-300">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <textarea
                  rows={2}
                  placeholder="Input"
                  value={c.input}
                  onChange={(e) => {
                    const next = [...sampleCases];
                    next[idx].input = e.target.value;
                    setSampleCases(next);
                  }}
                  className="w-full p-2 rounded-lg bg-surface-900 border border-surface-800 font-mono text-xs"
                />
                <textarea
                  rows={2}
                  placeholder="Expected Output"
                  value={c.output}
                  onChange={(e) => {
                    const next = [...sampleCases];
                    next[idx].output = e.target.value;
                    setSampleCases(next);
                  }}
                  className="w-full p-2 rounded-lg bg-surface-900 border border-surface-800 font-mono text-xs"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Hidden Test Cases */}
        <div className="space-y-3 pt-3 border-t border-surface-800">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-surface-200">Hidden Evaluation Test Cases (Sandbox Grader)</span>
            <Button type="button" variant="outline" size="sm" onClick={handleAddHiddenCase} className="gap-1 text-[11px]">
              <Plus className="w-3 h-3" /> Add Hidden Case
            </Button>
          </div>

          {hiddenCases.map((c, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-surface-950/60 border border-surface-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-surface-400 font-mono text-[11px]">Hidden Case #{idx + 1}</span>
                {hiddenCases.length > 1 && (
                  <button type="button" onClick={() => handleRemoveHiddenCase(idx)} className="text-rose-400 hover:text-rose-300">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <textarea
                  rows={2}
                  placeholder="Secret Input"
                  value={c.input}
                  onChange={(e) => {
                    const next = [...hiddenCases];
                    next[idx].input = e.target.value;
                    setHiddenCases(next);
                  }}
                  className="w-full p-2 rounded-lg bg-surface-900 border border-surface-800 font-mono text-xs"
                />
                <textarea
                  rows={2}
                  placeholder="Expected Secret Output"
                  value={c.expectedOutput}
                  onChange={(e) => {
                    const next = [...hiddenCases];
                    next[idx].expectedOutput = e.target.value;
                    setHiddenCases(next);
                  }}
                  className="w-full p-2 rounded-lg bg-surface-900 border border-surface-800 font-mono text-xs"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-800">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting} className="gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{isEditing ? 'Save Changes' : 'Publish Problem'}</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ProblemModal;
