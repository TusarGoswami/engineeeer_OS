import { ILLMAdapter } from './llm.interface.js';
import { env } from '../../config/env.js';

export class MockLLMAdapter extends ILLMAdapter {
  /**
   * Deterministic mock completion
   */
  async generateText({ prompt, systemPrompt = '' }) {
    const text = this._getMockResponse(prompt, systemPrompt);
    return {
      text,
      usage: {
        promptTokens: Math.ceil((prompt.length + systemPrompt.length) / 4),
        completionTokens: Math.ceil(text.length / 4),
      },
    };
  }

  /**
   * JSON structured completion validated by schema
   */
  async generateStructured({ _prompt, _systemPrompt, schema }) {
    // If evaluating an interview session rubric
    const defaultEvaluation = {
      overallScore: 82,
      readinessLevel: 'Strong Junior Engineer (Ready for SDE-1)',
      rubricScores: {
        technicalCorrectness: 8.5,
        relevanceAndDepth: 8.0,
        clarityAndCommunication: 8.5,
        problemSolving: 8.0,
      },
      strengths: [
        'Accurately explained algorithmic complexity and space tradeoffs',
        'Demonstrated strong knowledge of core computer science fundamentals',
        'Structured thought process clearly with good communication',
      ],
      areasForImprovement: [
        'Be proactive in stating edge cases before prompting',
        'Could discuss cache invalidation mechanisms in greater depth',
      ],
      recommendedTopics: [
        'Dynamic Programming & State Reduction',
        'Operating Systems: Virtual Memory Paging',
      ],
      feedbackSummary:
        'Excellent technical performance across questions. High communication clarity with structured problem solving.',
    };

    if (schema) {
      try {
        const validated = schema.parse(defaultEvaluation);
        return {
          data: validated,
          usage: { promptTokens: 250, completionTokens: 180 },
        };
      } catch {
        // Fallback
      }
    }

    return {
      data: defaultEvaluation,
      usage: { promptTokens: 250, completionTokens: 180 },
    };
  }

  /**
   * Token streaming completion (for SSE and live feedback)
   */
  async streamText({ prompt, systemPrompt = '', onToken, onComplete, onError }) {
    try {
      const fullText = this._getMockResponse(prompt, systemPrompt);
      const words = fullText.split(' ');

      // In test mode, stream without artificial delay; in dev/prod, add small microdelay
      const delayMs = env.NODE_ENV === 'test' ? 0 : 15;

      for (let i = 0; i < words.length; i++) {
        const chunk = (i === 0 ? '' : ' ') + words[i];
        if (onToken) onToken(chunk);

        if (delayMs > 0) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }

      const result = {
        fullText,
        usage: {
          promptTokens: Math.ceil((prompt.length + systemPrompt.length) / 4),
          completionTokens: Math.ceil(fullText.length / 4),
        },
      };

      if (onComplete) onComplete(result);
      return result;
    } catch (err) {
      if (onError) onError(err);
      throw err;
    }
  }

  _getMockResponse(prompt, systemPrompt) {
    const p = (prompt || '').toLowerCase();

    if (p.includes('binary search') || p.includes('search')) {
      return (
        'Binary Search is a divide-and-conquer algorithm designed for sorted arrays.\n\n' +
        '### 1. Algorithmic Steps\n' +
        '1. Set `low = 0` and `high = n - 1`.\n' +
        '2. Calculate `mid = low + ((high - low) >> 1)` to prevent 32-bit integer overflow.\n' +
        '3. Compare `target` with `arr[mid]`:\n' +
        '   - If `arr[mid] === target`, return `mid`.\n' +
        '   - If `arr[mid] < target`, search right: `low = mid + 1`.\n' +
        '   - If `arr[mid] > target`, search left: `high = mid - 1`.\n\n' +
        '### 2. Complexity Analysis\n' +
        '- **Time Complexity:** O(log n) worst and average case, since the search space halves at every step.\n' +
        '- **Space Complexity:** O(1) auxiliary space when implemented iteratively.'
      );
    }

    if (p.includes('paging') || p.includes('virtual memory')) {
      return (
        'Paging is a memory management scheme that eliminates the need for contiguous physical memory allocation.\n\n' +
        '- **Page vs Frame:** Logical memory is split into equal-sized blocks called **pages**, while physical memory is divided into **frames**.\n' +
        '- **Page Table:** Maps logical page numbers to physical frame numbers.\n' +
        '- **Page Fault:** Triggered via hardware interrupt when the referenced page is not present in physical RAM (`valid-invalid bit === 0`).'
      );
    }

    if (p.includes('normalization') || p.includes('bcnf') || p.includes('3nf')) {
      return (
        'Database normalization minimizes redundancy and insertion/deletion anomalies.\n\n' +
        '1. **3NF (Third Normal Form):** Every functional dependency X -> Y requires X to be a superkey OR Y to be a prime attribute.\n' +
        '2. **BCNF (Boyce-Codd Normal Form):** Every functional dependency X -> Y requires X to be a superkey (no non-trivial exceptions).\n' +
        '- 3NF guarantees dependency preservation; BCNF guarantees elimination of redundancy from functional dependencies but may not preserve all FDs.'
      );
    }

    if (systemPrompt.includes('interview') || p.includes('tell me about yourself')) {
      return (
        'Thank you for that response. You explained the context well. ' +
        'Can you now walk me through a specific technical challenge you encountered while designing that architecture, ' +
        'and what trade-offs you made between latency and data consistency?'
      );
    }

    return (
      `Based on your engineering curriculum and syllabus references:\n\n` +
      `Here is the verified conceptual breakdown for your inquiry:\n` +
      `- **Core Principle:** Standard engineering practice requires balancing algorithmic time/space trade-offs.\n` +
      `- **Key Properties:** Formulate requirements into explicit invariants before optimizing.\n` +
      `- **GATE & University Exams Focus:** Always state theoretical bounds and prove base conditions.`
    );
  }
}

export default MockLLMAdapter;
