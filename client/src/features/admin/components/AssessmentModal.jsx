import { useState, useEffect } from 'react';
import { Modal } from '../../../components/Modal.jsx';
import { Button } from '../../../components/Button.jsx';
import { Input } from '../../../components/Input.jsx';
import { ShieldCheck, Plus, Trash2, CheckCircle2 } from 'lucide-react';

export const AssessmentModal = ({ isOpen, onClose, assessment, subjects = [], onSave }) => {
  const isEditing = Boolean(assessment?._id);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [totalMarks, setTotalMarks] = useState(20);
  const [fullScreenRequired, setFullScreenRequired] = useState(true);
  const [trackTabSwitches, setTrackTabSwitches] = useState(true);

  const [questions, setQuestions] = useState([
    {
      questionId: 'q1',
      questionText: '',
      type: 'mcq',
      marks: 2,
      options: [
        { id: 'A', text: '' },
        { id: 'B', text: '' },
        { id: 'C', text: '' },
        { id: 'D', text: '' },
      ],
      correctOptions: ['A'],
      explanation: '',
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (assessment) {
      setTitle(assessment.title || '');
      setDescription(assessment.description || '');
      setSubjectId(assessment.subjectId?._id || assessment.subjectId || '');
      setDurationMinutes(assessment.durationMinutes || 45);
      setTotalMarks(assessment.totalMarks || 20);
      setFullScreenRequired(assessment.rules?.fullScreenRequired !== false);
      setTrackTabSwitches(assessment.rules?.trackTabSwitches !== false);
      setQuestions(assessment.questions?.length ? assessment.questions : []);
    } else {
      setTitle('');
      setDescription('');
      setSubjectId(subjects[0]?._id || '');
      setDurationMinutes(45);
      setTotalMarks(20);
      setFullScreenRequired(true);
      setTrackTabSwitches(true);
      setQuestions([
        {
          questionId: 'q1',
          questionText: '',
          type: 'mcq',
          marks: 2,
          options: [
            { id: 'A', text: '' },
            { id: 'B', text: '' },
            { id: 'C', text: '' },
            { id: 'D', text: '' },
          ],
          correctOptions: ['A'],
          explanation: '',
        },
      ]);
    }
    setError('');
  }, [assessment, isOpen, subjects]);

  const handleAddQuestion = () => {
    const nextId = `q${questions.length + 1}`;
    setQuestions([
      ...questions,
      {
        questionId: nextId,
        questionText: '',
        type: 'mcq',
        marks: 2,
        options: [
          { id: 'A', text: '' },
          { id: 'B', text: '' },
          { id: 'C', text: '' },
          { id: 'D', text: '' },
        ],
        correctOptions: ['A'],
        explanation: '',
      },
    ]);
  };

  const handleRemoveQuestion = (idx) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Please provide an assessment title');
      return;
    }

    if (!questions.length || !questions[0].questionText.trim()) {
      setError('Please include at least one question with question text');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        title: title.trim(),
        description: description.trim(),
        subjectId: subjectId || undefined,
        durationMinutes: Number(durationMinutes),
        totalMarks: Number(totalMarks),
        rules: {
          fullScreenRequired,
          trackTabSwitches,
        },
        questions: questions.map((q, idx) => ({
          ...q,
          questionId: q.questionId || `q${idx + 1}`,
          marks: Number(q.marks) || 2,
        })),
      };

      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to save assessment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Proctored Assessment' : 'Create & Schedule Proctored Exam'}
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
            label="Exam Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Operating Systems Midterm Examination"
            required
          />

          <div>
            <label className="block text-surface-300 font-medium mb-1">Target Subject</label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full h-9 rounded-xl bg-surface-950 border border-surface-800 text-surface-200 px-3 focus:outline-none focus:border-brand-500"
            >
              <option value="">General Engineering Assessment</option>
              {subjects.map((sub) => (
                <option key={sub._id} value={sub._id}>
                  {sub.code} — {sub.name} (Sem {sub.semester})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-surface-300 font-medium mb-1">Exam Instructions / Overview</label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Instructions displayed to students before launching exam room..."
            className="w-full p-2.5 rounded-xl bg-surface-950 border border-surface-800 text-surface-200 text-xs focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Duration (Minutes)"
            type="number"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
            required
          />

          <Input
            label="Total Marks"
            type="number"
            value={totalMarks}
            onChange={(e) => setTotalMarks(e.target.value)}
            required
          />
        </div>

        {/* Anti-Cheat Proctoring Rules */}
        <div className="p-4 rounded-xl bg-surface-950/70 border border-surface-800 space-y-3">
          <div className="flex items-center gap-2 text-surface-200 font-semibold">
            <ShieldCheck className="w-4 h-4 text-brand-400" />
            <span>Anti-Cheat & Proctoring Rules</span>
          </div>

          <div className="flex flex-wrap gap-6 text-surface-300">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={fullScreenRequired}
                onChange={(e) => setFullScreenRequired(e.target.checked)}
                className="rounded border-surface-700 bg-surface-900 text-brand-500 focus:ring-0"
              />
              <span>Require Fullscreen Mode (Audit Esc exits)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={trackTabSwitches}
                onChange={(e) => setTrackTabSwitches(e.target.checked)}
                className="rounded border-surface-700 bg-surface-900 text-brand-500 focus:ring-0"
              />
              <span>Track Tab Switching & Window Blur</span>
            </label>
          </div>
        </div>

        {/* Questions Builder */}
        <div className="space-y-4 pt-3 border-t border-surface-800">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-surface-200">Exam Questions ({questions.length})</span>
            <Button type="button" variant="outline" size="sm" onClick={handleAddQuestion} className="gap-1 text-[11px]">
              <Plus className="w-3 h-3" /> Add Question
            </Button>
          </div>

          {questions.map((q, qIdx) => (
            <div key={qIdx} className="p-4 rounded-xl bg-surface-950 border border-surface-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-brand-400 font-mono font-semibold">Question #{qIdx + 1}</span>
                {questions.length > 1 && (
                  <button type="button" onClick={() => handleRemoveQuestion(qIdx)} className="text-rose-400 hover:text-rose-300">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <Input
                    label="Question Text"
                    value={q.questionText}
                    onChange={(e) => {
                      const next = [...questions];
                      next[qIdx].questionText = e.target.value;
                      setQuestions(next);
                    }}
                    placeholder="Enter question statement..."
                    required
                  />
                </div>
                <div>
                  <Input
                    label="Marks"
                    type="number"
                    value={q.marks}
                    onChange={(e) => {
                      const next = [...questions];
                      next[qIdx].marks = e.target.value;
                      setQuestions(next);
                    }}
                  />
                </div>
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2">
                {q.options?.map((opt, optIdx) => (
                  <div key={opt.id} className="flex items-center gap-2 bg-surface-900 p-2 rounded-lg border border-surface-800">
                    <span className="font-bold text-surface-400 w-4">{opt.id}</span>
                    <input
                      type="text"
                      placeholder={`Option ${opt.id}`}
                      value={opt.text}
                      onChange={(e) => {
                        const next = [...questions];
                        next[qIdx].options[optIdx].text = e.target.value;
                        setQuestions(next);
                      }}
                      className="w-full bg-transparent border-0 text-surface-200 text-xs focus:outline-none"
                    />
                    <input
                      type="radio"
                      name={`correct-${qIdx}`}
                      checked={q.correctOptions?.includes(opt.id)}
                      onChange={() => {
                        const next = [...questions];
                        next[qIdx].correctOptions = [opt.id];
                        setQuestions(next);
                      }}
                      title="Mark as correct answer"
                      className="text-brand-500 focus:ring-0 cursor-pointer"
                    />
                  </div>
                ))}
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
            <span>{isEditing ? 'Save Changes' : 'Schedule Assessment'}</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AssessmentModal;
