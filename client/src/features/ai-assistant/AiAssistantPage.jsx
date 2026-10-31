import { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  Plus,
  BookOpen,
  Sparkles,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';
import { aiService } from '../../services/ai.service.js';
import { academicsService } from '../../services/academics.service.js';
import Card from '../../components/Card.jsx';
import Button from '../../components/Button.jsx';
import Badge from '../../components/Badge.jsx';

export function AiAssistantPage() {
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');

  const [messages, setMessages] = useState([]);
  const [inputQuery, setInputQuery] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [currentCitations, setCurrentCitations] = useState([]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  const fetchInitialData = async () => {
    try {
      const [convs, subsRes] = await Promise.all([
        aiService.getAssistantConversations(),
        academicsService.getSubjects(),
      ]);
      setConversations(convs || []);
      setSubjects(subsRes?.data || []);
    } catch {
      // Handled silently
    }
  };

  const handleSelectConversation = async convId => {
    try {
      setActiveConversationId(convId);
      const conv = await aiService.getAssistantConversation(convId);
      setMessages(conv?.messages || []);
      setSelectedSubjectId(conv?.subjectId?._id || '');
    } catch {
      // Handled silently
    }
  };

  const handleStartNewChat = () => {
    setActiveConversationId(null);
    setMessages([]);
    setStreamingText('');
    setCurrentCitations([]);
  };

  const handleSendQuery = async (queryToSend = inputQuery) => {
    const q = (queryToSend || '').trim();
    if (!q || isStreaming) return;

    setInputQuery('');
    const userMsg = { role: 'user', content: q, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);

    setIsStreaming(true);
    setStreamingText('');
    setCurrentCitations([]);

    let metaConversationId = activeConversationId;
    let metaCitations = [];

    await aiService.streamAssistant({
      query: q,
      subjectId: selectedSubjectId || undefined,
      conversationId: activeConversationId || undefined,
      onMeta: meta => {
        if (meta.conversationId) metaConversationId = meta.conversationId;
        if (meta.citations) {
          metaCitations = meta.citations;
          setCurrentCitations(meta.citations);
        }
      },
      onToken: token => {
        setStreamingText(prev => prev + token);
      },
      onDone: () => {
        setIsStreaming(false);
        setActiveConversationId(metaConversationId);
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: streamingText,
            citations: metaCitations,
            timestamp: new Date(),
          },
        ]);
        setStreamingText('');
        fetchInitialData();
      },
      onError: err => {
        setIsStreaming(false);
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: `Error: ${err?.message || 'Failed to complete streaming response. Please try again.'}`,
            timestamp: new Date(),
          },
        ]);
      },
    });
  };

  const PROMPT_SUGGESTIONS = [
    { title: 'Explain Binary Search Invariant', tag: 'Algorithms' },
    { title: 'How does Virtual Memory Paging work?', tag: 'OS' },
    { title: 'Explain 3NF vs BCNF Normalization', tag: 'DBMS' },
    { title: 'TCP Congestion Control & Fast Retransmit', tag: 'Networks' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-[calc(100vh-7rem)] max-w-7xl mx-auto w-full pb-2">
      {/* Left Column: Thread History & Context Filter */}
      <Card className="md:col-span-4 lg:col-span-3 flex flex-col h-full overflow-hidden p-4 border-surface-800 bg-surface-900/60 shadow-xl space-y-4">
        <Button
          variant="primary"
          onClick={handleStartNewChat}
          leftIcon={Plus}
          className="w-full justify-center"
        >
          New Study Thread
        </Button>

        {/* Subject Context Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-surface-400 uppercase tracking-wider block">
            Ground in Syllabus:
          </label>
          <select
            value={selectedSubjectId}
            onChange={e => setSelectedSubjectId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-surface-950/80 border border-surface-800 text-xs text-surface-100 focus:outline-none focus:border-brand-500 font-medium"
          >
            <option value="">All Engineering Subjects</option>
            {subjects.map(s => (
              <option key={s._id} value={s._id}>
                {s.code}: {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Past Threads */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-surface-500 px-1 block">
            Recent Threads
          </span>
          {conversations.length === 0 ? (
            <p className="text-xs text-surface-500 py-6 text-center">
              No previous threads. Ask a question to begin!
            </p>
          ) : (
            conversations.map(c => (
              <button
                key={c._id}
                type="button"
                onClick={() => handleSelectConversation(c._id)}
                className={`w-full text-left p-2.5 rounded-xl text-xs transition-colors truncate flex items-center gap-2 ${
                  activeConversationId === c._id
                    ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30 font-semibold'
                    : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/60'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-70" />
                <span className="truncate">{c.title || 'Untitled Thread'}</span>
              </button>
            ))
          )}
        </div>
      </Card>

      {/* Right Column: Chat Stream & Interactive Workspace */}
      <Card className="md:col-span-8 lg:col-span-9 flex flex-col h-full overflow-hidden p-0 border-surface-800 bg-surface-900/60 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-surface-800 bg-surface-950/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">
                AI Academic Assistant
              </h2>
              <p className="text-[11px] text-surface-400">
                Grounded in engineering curriculum, PYQs, and verified lecture notes
              </p>
            </div>
          </div>
          <Badge variant="purple" size="sm" className="font-mono text-[10px]">
            Syllabus RAG
          </Badge>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && !isStreaming ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4 my-auto">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                <Sparkles className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  How can I assist your engineering studies?
                </h3>
                <p className="text-xs text-surface-400 mt-1 leading-relaxed">
                  Ask theoretical questions, request step-by-step mathematical proofs, or clarify
                  complex algorithmic invariants.
                </p>
              </div>

              {/* Prompt Suggestions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full pt-2">
                {PROMPT_SUGGESTIONS.map(sug => (
                  <button
                    key={sug.title}
                    type="button"
                    onClick={() => handleSendQuery(sug.title)}
                    className="p-3 rounded-xl border border-surface-800 bg-surface-950/60 hover:bg-surface-800/60 hover:border-surface-700 text-left transition-all group"
                  >
                    <span className="text-[10px] uppercase font-mono text-purple-400 block font-semibold mb-0.5">
                      {sug.tag}
                    </span>
                    <span className="text-xs text-surface-200 group-hover:text-white leading-snug block">
                      {sug.title}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col max-w-[85%] space-y-1.5 ${
                    m.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                  }`}
                >
                  <div
                    className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                      m.role === 'user'
                        ? 'bg-brand-600 text-white rounded-br-sm shadow-md'
                        : 'bg-surface-950/90 text-surface-100 border border-surface-800 rounded-bl-sm shadow-sm'
                    }`}
                  >
                    {m.content}
                  </div>

                  {/* Grounded Citations */}
                  {m.citations?.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      <span className="text-[10px] text-surface-500 font-mono flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-purple-400" />
                        Grounded Sources:
                      </span>
                      {m.citations.map((c, cIdx) => (
                        <span
                          key={cIdx}
                          className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20"
                        >
                          {c.title}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Streaming Bubble */}
              {isStreaming && (
                <div className="flex flex-col max-w-[85%] space-y-1.5 mr-auto items-start">
                  <div className="p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap bg-surface-950/90 text-surface-100 border border-surface-800 rounded-bl-sm shadow-sm">
                    {streamingText || 'Synthesizing verified engineering explanation...'}
                    <span className="inline-block w-1.5 h-4 bg-brand-400 ml-1 animate-pulse align-middle" />
                  </div>

                  {currentCitations.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      <span className="text-[10px] text-surface-500 font-mono">
                        Active Sources:
                      </span>
                      {currentCitations.map((c, cIdx) => (
                        <span
                          key={cIdx}
                          className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20"
                        >
                          {c.title}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Query Input Bar */}
        <div className="p-4 border-t border-surface-800 bg-surface-950/70 space-y-2">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSendQuery();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask an engineering question or paste code..."
              value={inputQuery}
              onChange={e => setInputQuery(e.target.value)}
              disabled={isStreaming}
              className="flex-1 px-4 py-2.5 rounded-xl bg-surface-900 border border-surface-700 text-xs sm:text-sm text-white placeholder-surface-500 focus:outline-none focus:border-brand-500"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isStreaming || !inputQuery.trim()}
              leftIcon={Send}
            >
              {isStreaming ? 'Streaming...' : 'Send'}
            </Button>
          </form>

          <div className="flex items-center justify-center gap-1 text-[11px] text-surface-500">
            <AlertCircle className="w-3 h-3 text-amber-500/70" />
            <span>
              Responses are grounded in university curriculum notes. Verify critical proofs with official textbooks.
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default AiAssistantPage;
