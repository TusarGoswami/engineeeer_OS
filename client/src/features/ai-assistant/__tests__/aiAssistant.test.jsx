import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '../../../context/ThemeContext.jsx';
import ToastProvider from '../../../components/Toast.jsx';
import { AiAssistantPage } from '../AiAssistantPage.jsx';
import { AiMascotLottie } from '../components/AiMascotLottie.jsx';
import { aiService } from '../../../services/ai.service.js';
import { academicsService } from '../../../services/academics.service.js';

const mockDestroy = vi.fn();
const mockLoadAnimation = vi.fn(({ container }) => {
  if (container) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    container.appendChild(svg);
  }
  return {
    destroy: mockDestroy,
    addEventListener: vi.fn(),
  };
});

vi.mock('lottie-web/build/player/esm/lottie_light.min.js', () => ({
  default: {
    loadAnimation: (...args) => mockLoadAnimation(...args),
  },
}));

vi.mock('../../../services/ai.service.js', () => ({
  aiService: {
    getAssistantConversations: vi.fn(),
    getAssistantConversation: vi.fn(),
    streamAssistant: vi.fn(),
  },
}));

vi.mock('../../../services/academics.service.js', () => ({
  academicsService: {
    getSubjects: vi.fn(),
  },
}));

const mockSubjects = [
  { _id: 'sub-1', code: 'CS203', name: 'Design and Analysis of Algorithms' },
  { _id: 'sub-2', code: 'CS302', name: 'Operating Systems' },
];

const mockConversations = [
  {
    _id: 'conv-old',
    title: 'Virtual Memory Paging & TLB',
    subjectId: { _id: 'sub-2', code: 'CS302', name: 'Operating Systems' },
    lastActiveAt: '2026-11-20T10:00:00Z',
  },
];

function renderAssistant() {
  return render(
    <ThemeProvider>
      <ToastProvider>
        <AiAssistantPage />
      </ToastProvider>
    </ThemeProvider>
  );
}

describe('AI Assistant Module (Module 5)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    aiService.getAssistantConversations.mockResolvedValue(mockConversations);
    academicsService.getSubjects.mockResolvedValue({ data: mockSubjects });
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn() },
      configurable: true,
    });
  });

  it('renders animated Lottie mascot in header with loop, autoplay, cleanup, and graceful error fallback', async () => {
    const { unmount } = renderAssistant();

    expect(await screen.findByText('AI Academic Assistant')).toBeInTheDocument();
    const mascot = screen.getByTestId('ai-assistant-mascot');
    expect(mascot).toBeInTheDocument();
    expect(mascot).toHaveClass('bg-transparent', 'border-0', 'lg:w-[60px]', 'lg:h-[60px]');
    expect(mascot.className).not.toContain('bg-brand-500/10');

    await waitFor(() => {
      expect(mockLoadAnimation).toHaveBeenCalledTimes(1);
    });

    const callConfig = mockLoadAnimation.mock.calls[0][0];
    expect(callConfig).toEqual(
      expect.objectContaining({
        renderer: 'svg',
        loop: true,
        autoplay: true,
        rendererSettings: expect.objectContaining({
          preserveAspectRatio: 'xMidYMid meet',
        }),
      })
    );
    expect(callConfig.animationData?.nm).toBe('robot-alt-happy');
    expect(mascot).toHaveAttribute('data-status', 'ready');

    unmount();
    expect(mockDestroy).toHaveBeenCalledTimes(1);

    mockLoadAnimation.mockImplementationOnce(() => {
      throw new Error('SVG init failed');
    });
    render(<AiMascotLottie />);
    expect(await screen.findByTestId('ai-mascot-fallback')).toBeInTheDocument();
  });

  it('loads threads/subjects, handles syllabus grounding, SSE streaming, Markdown/code rendering, and copy action', async () => {
    aiService.streamAssistant.mockImplementation(async ({ onMeta, onToken, onDone }) => {
      onMeta({
        conversationId: 'conv-new-1',
        citations: [{ title: 'DAA Lecture Notes', type: 'notes', topic: 'Binary Search' }],
      });
      onToken('## Invariant Proof\n\nKeep bounds `lo <= hi`.\n\n| Operation | Time |\n| --- | --- |\n| Binary Search | O(log n) |\n\n');
      onToken('```python\ndef binary_search(nums, target):\n    return 0\n```\n');
      onDone({ status: 'completed' });
    });

    renderAssistant();

    expect(await screen.findByText('Virtual Memory Paging & TLB')).toBeInTheDocument();
    expect(screen.getByText('How can I assist your engineering studies?')).toBeInTheDocument();

    // Select syllabus grounding subject
    fireEvent.change(screen.getByLabelText('Ground in syllabus subject'), {
      target: { value: 'sub-1' },
    });
    expect(screen.getByText('Context: CS203 — Design and Analysis of Algorithms')).toBeInTheDocument();

    // Trigger streaming via contextual suggestion button
    fireEvent.click(screen.getByRole('button', { name: /Explain Binary Search Invariant/i }));

    await waitFor(() => {
      expect(aiService.streamAssistant).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'Explain Binary Search Invariant',
          subjectId: 'sub-1',
          conversationId: undefined,
        })
      );
    });

    // Rendered Markdown table, inline code, syntax code block, and citations
    expect(await screen.findByText('Invariant Proof')).toBeInTheDocument();
    expect(screen.getByText('lo <= hi')).toBeInTheDocument();
    expect(screen.getByText('O(log n)')).toBeInTheDocument();
    expect(screen.getByText('DAA Lecture Notes')).toBeInTheDocument();
    expect(screen.getByText('python')).toBeInTheDocument();

    // Copy code block action
    fireEvent.click(screen.getByRole('button', { name: 'Copy python snippet' }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      'def binary_search(nums, target):\n    return 0'
    );
    expect(screen.getByText('Copied')).toBeInTheDocument();
  });

  it('switches conversation history threads, handles New Chat, voice toast fallback, and streaming error retry', async () => {
    aiService.getAssistantConversation.mockResolvedValue({
      _id: 'conv-old',
      subjectId: { _id: 'sub-2', code: 'CS302', name: 'Operating Systems' },
      messages: [
        { role: 'user', content: 'How do page tables map frames?' },
        { role: 'assistant', content: 'Each VPN indexes into the page table entry.' },
      ],
    });

    renderAssistant();
    expect(await screen.findByText('Virtual Memory Paging & TLB')).toBeInTheDocument();

    // Select existing conversation thread
    fireEvent.click(screen.getByRole('button', { name: /Virtual Memory Paging & TLB/i }));
    await waitFor(() => {
      expect(aiService.getAssistantConversation).toHaveBeenCalledWith('conv-old');
    });
    expect(await screen.findByText('Each VPN indexes into the page table entry.')).toBeInTheDocument();
    expect(screen.getByText('Context: CS302 — Operating Systems')).toBeInTheDocument();

    // Start New Study Thread
    fireEvent.click(screen.getByRole('button', { name: 'New Study Thread' }));
    expect(screen.getByText('How can I assist your engineering studies?')).toBeInTheDocument();

    // Voice dictation fallback (no alert, toast instead)
    const originalSR = window.SpeechRecognition;
    const originalWebkitSR = window.webkitSpeechRecognition;
    delete window.SpeechRecognition;
    delete window.webkitSpeechRecognition;
    fireEvent.click(screen.getByLabelText('Voice dictation'));
    expect(
      await screen.findByText(/Speech recognition is not supported in this browser/i)
    ).toBeInTheDocument();
    window.SpeechRecognition = originalSR;
    window.webkitSpeechRecognition = originalWebkitSR;

    // Submit query via composer -> simulate stream error -> verify Retry Query re-runs stream
    aiService.streamAssistant
      .mockImplementationOnce(async ({ onError }) => {
        onError(new Error('Upstream LLM timeout'));
      })
      .mockImplementationOnce(async ({ onToken, onDone }) => {
        onToken('Recovered response explanation.');
        onDone({ status: 'completed' });
      });

    const composer = screen.getByPlaceholderText(/Ask an engineering question or paste code/i);
    fireEvent.change(composer, { target: { value: 'Explain Deadlock avoidance' } });
    fireEvent.keyDown(composer, { key: 'Enter', shiftKey: false });

    expect(await screen.findByText('Response Interrupted')).toBeInTheDocument();
    expect(screen.getByText('Error: Upstream LLM timeout')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Retry Query' }));
    await waitFor(() => {
      expect(aiService.streamAssistant).toHaveBeenCalledTimes(2);
    });
    expect(await screen.findByText('Recovered response explanation.')).toBeInTheDocument();
  });
});

