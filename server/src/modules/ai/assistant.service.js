import { AssistantConversation } from './assistantConversation.model.js';
import { AcademicResource } from '../academics/academicResource.model.js';
import { getLLMAdapter } from '../../integrations/llm/index.js';
import { ACADEMIC_ASSISTANT_SYSTEM_PROMPT } from '../../integrations/llm/prompts/academicAssistant.prompt.js';
import { ActivityService } from '../progress/activity.service.js';

export class AssistantService {
  /**
   * Search academic resources for grounding context
   */
  static async retrieveGroundedContext({ query = '', subjectId = null }) {
    const filter = { isPublished: true };
    if (subjectId) {
      filter.subjectId = subjectId;
    }

    // Filter common query stop words
    const STOP_WORDS = new Set([
      'explain',
      'what',
      'how',
      'why',
      'tell',
      'about',
      'and',
      'the',
      'for',
      'its',
      'can',
      'you',
      'with',
      'does',
      'work',
    ]);
    const meaningfulKeywords = query
      .toLowerCase()
      .split(/\W+/)
      .filter(w => w.length > 2 && !STOP_WORDS.has(w));

    if (meaningfulKeywords.length > 0) {
      filter.$or = meaningfulKeywords
        .slice(0, 3)
        .flatMap(kw => [
          { title: { $regex: kw, $options: 'i' } },
          { textContent: { $regex: kw, $options: 'i' } },
        ]);
    }

    let resources = await AcademicResource.find(filter)
      .select('title type topicId textContent')
      .limit(3)
      .lean();

    // Fallback: if keyword filter was too restrictive, find by subjectId if available
    if (resources.length === 0 && subjectId) {
      resources = await AcademicResource.find({ subjectId, isPublished: true })
        .select('title type topicId textContent')
        .limit(3)
        .lean();
    }

    const citations = resources.map(r => ({
      title: r.title,
      type: r.type,
      topic: r.topicId || 'Core Syllabus',
    }));

    const contextSnippet = resources
      .map(r => `--- SOURCE: ${r.title} (${r.type}) ---\n${r.textContent}`)
      .join('\n\n');

    return { contextSnippet, citations };
  }

  /**
   * Stream response tokens via Server-Sent Events (SSE)
   */
  static async streamAssistantResponse({ userId, conversationId, query, subjectId, res }) {
    // 1. Configure SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    // 2. Fetch or create conversation record
    let conversation = null;
    if (conversationId) {
      conversation = await AssistantConversation.findOne({ _id: conversationId, userId });
    }

    if (!conversation) {
      conversation = await AssistantConversation.create({
        userId,
        subjectId,
        title: query.slice(0, 40) + '...',
        messages: [],
      });
    }

    // 3. Grounded Context Retrieval
    const { contextSnippet, citations } = await this.retrieveGroundedContext({ query, subjectId });

    // Send metadata and citations first
    res.write(
      `event: meta\ndata: ${JSON.stringify({ conversationId: conversation._id, citations })}\n\n`
    );

    // 4. Formulate contextual prompt
    let contextualPrompt = '';
    if (contextSnippet) {
      contextualPrompt += `[GROUNDED CURRICULUM CONTEXT]:\n${contextSnippet}\n\n`;
    }
    contextualPrompt += `[STUDENT QUERY]: ${query}`;

    // 5. Invoke LLM streaming
    const adapter = getLLMAdapter();
    let accumulatedText = '';

    await adapter.streamText({
      prompt: contextualPrompt,
      systemPrompt: ACADEMIC_ASSISTANT_SYSTEM_PROMPT,
      onToken: token => {
        accumulatedText += token;
        res.write(`event: token\ndata: ${JSON.stringify({ token })}\n\n`);
      },
      onComplete: async () => {
        // 6. Persist conversation history before ending response
        conversation.messages.push({
          role: 'user',
          content: query,
          timestamp: new Date(),
        });
        conversation.messages.push({
          role: 'assistant',
          content: accumulatedText,
          citations,
          timestamp: new Date(),
        });
        conversation.lastActiveAt = new Date();
        await conversation.save();

        res.write(`event: done\ndata: ${JSON.stringify({ status: 'completed' })}\n\n`);
        res.end();

        // 7. Emit progress event
        try {
          await ActivityService.record({
            userId,
            module: 'ai',
            action: 'ASSISTANT_QUERY',
            payload: {
              conversationId: conversation._id.toString(),
              subjectId: subjectId ? subjectId.toString() : null,
            },
          });
        } catch {
          // Ignore
        }
      },
      onError: err => {
        res.write(`event: error\ndata: ${JSON.stringify({ message: err.message })}\n\n`);
        res.end();
      },
    });
  }

  /**
   * Get student's previous conversation threads
   */
  static async getConversations(userId) {
    return AssistantConversation.find({ userId })
      .select('title subjectId lastActiveAt createdAt updatedAt')
      .populate('subjectId', 'name code')
      .sort({ updatedAt: -1 })
      .lean();
  }

  /**
   * Get full conversation thread by ID
   */
  static async getConversationById(conversationId, userId) {
    return AssistantConversation.findOne({ _id: conversationId, userId })
      .populate('subjectId', 'name code')
      .lean();
  }
}

export default AssistantService;
