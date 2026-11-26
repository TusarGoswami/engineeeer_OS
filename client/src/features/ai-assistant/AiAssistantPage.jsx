import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Bot,
  Send,
  Plus,
  BookOpen,
  Sparkles,
  AlertCircle,
  Copy,
  Check,
  Mic,
  MicOff,
  RotateCcw,
  History,
  X,
} from 'lucide-react';
import { aiService } from '../../services/ai.service.js';
import { academicsService } from '../../services/academics.service.js';
import { Badge, Button, Drawer, Skeleton, useToast } from '../../components/index.js';
import { MarkdownMessageRenderer } from './components/MarkdownMessageRenderer.jsx';
import { ThreadSidebar } from './components/ThreadSidebar.jsx';

const PROMPT_SUGGESTIONS = [
  { title: 'Explain Binary Search Invariant', tag: 'Algorithms' },
  { title: 'How does Virtual Memory Paging work?', tag: 'OS' },
  { title: 'Explain 3NF vs BCNF Normalization', tag: 'DBMS' },
  { title: 'TCP Congestion Control & Fast Retransmit', tag: 'Networks' },
];

/**
 * AI Academic Assistant workspace featuring Fetch SSE token streaming, curriculum RAG
 * citations, Markdown + syntax-highlighted code rendering, voice dictation, and thread history.
 */
export function AiAssistantPage() {
  const { showToast } = useToast();

  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [isSidebarLoading, setIsSidebarLoading] = useState(true);
  const [isThreadLoading, setIsThreadLoading] = useState(false);

  const [messages, setMessages] = useState([]);
  const [inputQuery, setInputQuery] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [currentCitations, setCurrentCitations] = useState([]);
  const [isListening, setIsListening] = useState(false);

  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);
  const [copiedMsgIdx, setCopiedMsgIdx] = useState(null);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [messages, streamingText]);

  const fetchInitialData = async (silent = false) => {
    if (!silent) setIsSidebarLoading(true);
    try {
      const [convs, subsRes] = await Promise.all([
        aiService.getAssistantConversations(),
        academicsService.getSubjects(),
      ]);
      setConversations(convs || []);
      setSubjects(subsRes?.data || []);
    } catch {
      // Handled silently on initial background load
    } finally {
      setIsSidebarLoading(false);
    }
  };

  const handleSelectConversation = async (convId) => {
    try {
      setIsThreadLoading(true);
      setActiveConversationId(convId);
      setMobileHistoryOpen(false);
      const conv = await aiService.getAssistantConversation(convId);
      setMessages(conv?.messages || []);
      setSelectedSubjectId(conv?.subjectId?._id || '');
    } catch {
      showToast('Failed to load study thread', 'error');
    } finally {
      setIsThreadLoading(false);
    }
  };

  const handleStartNewChat = () => {
    setActiveConversationId(null);
    setMessages([]);
    setStreamingText('');
    setCurrentCitations([]);
    setMobileHistoryOpen(false);
  };

  const recognitionRef = useRef(null);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort?.();
    };
  }, []);

  const handleToggleSpeech = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast('Speech recognition is not supported in this browser. Please type your query.', 'info');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop?.();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputQuery((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const handleCopyMessage = (idx, content) => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(content);
    }
    setCopiedMsgIdx(idx);
    setTimeout(() => setCopiedMsgIdx(null), 1800);
  };

  const handleSendQuery = async (queryToSend = inputQuery) => {
    const q = (queryToSend || '').trim();
    if (!q || isStreaming) return;

    setInputQuery('');
    const userMsg = { role: 'user', content: q, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);

    setIsStreaming(true);
    setStreamingText('');
    setCurrentCitations([]);

    let metaConversationId = activeConversationId;
    let metaCitations = [];
    let accumulatedContent = '';

    await aiService.streamAssistant({
      query: q,
      subjectId: selectedSubjectId || undefined,
      conversationId: activeConversationId || undefined,
      onMeta: (meta) => {
        if (meta.conversationId) metaConversationId = meta.conversationId;
        if (meta.citations) {
          metaCitations = meta.citations;
          setCurrentCitations(meta.citations);
        }
      },
      onToken: (token) => {
        accumulatedContent += token;
        setStreamingText((prev) => prev + token);
      },
      onDone: () => {
        setIsStreaming(false);
        setActiveConversationId(metaConversationId);
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: accumulatedContent,
            citations: metaCitations,
            timestamp: new Date(),
          },
        ]);
        setStreamingText('');
        fetchInitialData(true);
      },
      onError: (err) => {
        setIsStreaming(false);
        setStreamingText('');
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            isError: true,
            retryQuery: q,
            content: `Error: ${err?.message || 'Failed to complete streaming response. Please try again.'}`,
            timestamp: new Date(),
          },
        ]);
      },
    });
  };

  const selectedSubject = useMemo(
    () => subjects.find((s) => s._id === selectedSubjectId) || null,
    [subjects, selectedSubjectId]
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[calc(100vh-8.5rem)] lg:h-[calc(100vh-6.25rem)] max-w-7xl mx-auto w-full pb-2">
      {/* Desktop Left Sidebar: Thread History & Syllabus Grounding */}
      <aside className="hidden lg:flex lg:col-span-3 flex-col h-full rounded-xl border border-surface-700 bg-card p-4 shadow-[var(--shadow-card)] overflow-hidden">
        <ThreadSidebar
          conversations={conversations}
          activeConversationId={activeConversationId}
          subjects={subjects}
          selectedSubjectId={selectedSubjectId}
          onSelectSubject={setSelectedSubjectId}
          onSelectConversation={handleSelectConversation}
          onStartNewChat={handleStartNewChat}
          isLoading={isSidebarLoading}
        />
      </aside>

      {/* Main Conversational Stream */}
      <section className="lg:col-span-9 flex flex-col h-full min-h-[540px] rounded-xl border border-surface-700 bg-card shadow-[var(--shadow-card)] overflow-hidden">
        {/* Workspace Header */}
        <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5 border-b border-surface-700 bg-elevated/55 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileHistoryOpen(true)}
              aria-label="Open study threads history"
              className="lg:hidden p-2 rounded-lg border border-surface-700 bg-card text-surface-300 hover:text-surface-100 hover:bg-elevated transition-colors shrink-0"
            >
              <History className="w-4 h-4" />
            </button>

            <div className="w-9 h-9 rounded-xl bg-brand-500/12 border border-brand-500/25 text-brand-700 flex items-center justify-center shrink-0">
              <Bot className="w-4.5 h-4.5" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display text-sm sm:text-base font-bold text-surface-100 tracking-tight truncate">
                  AI Academic Assistant
                </h1>
                {selectedSubject && (
                  <Badge variant="brand" size="sm">
                    {selectedSubject.code}
                  </Badge>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-surface-400 truncate">
                {selectedSubject
                  ? `Grounded in ${selectedSubject.code}: ${selectedSubject.name}`
                  : 'Grounded in engineering curriculum, PYQs, and verified lecture notes'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              leftIcon={Plus}
              onClick={handleStartNewChat}
              className="lg:hidden"
            >
              New
            </Button>
            <Badge
              variant={isStreaming ? 'brand' : 'compiler'}
              size="sm"
              className="font-mono text-[10px]"
            >
              {isStreaming ? 'Streaming...' : 'Syllabus RAG'}
            </Badge>
          </div>
        </header>

        {/* Scrollable Message History */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-canvas/35">
          {isThreadLoading ? (
            <div className="space-y-4 max-w-2xl mx-auto py-6">
              <Skeleton className="h-14 w-3/4 ml-auto rounded-2xl" />
              <Skeleton className="h-32 w-5/6 rounded-2xl" />
              <Skeleton className="h-24 w-4/5 rounded-2xl" />
            </div>
          ) : messages.length === 0 && !isStreaming ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto space-y-5 py-6">
              <div className="w-14 h-14 rounded-2xl bg-brand-500/12 border border-brand-500/25 text-brand-700 flex items-center justify-center shadow-[var(--shadow-card)]">
                <Sparkles className="w-7 h-7" />
              </div>

              <div className="space-y-1.5">
                <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                  ~/ai-assistant · Syllabus Grounded Copilot
                </p>
                <h2 className="font-display text-lg sm:text-xl font-bold text-surface-100 tracking-tight">
                  How can I assist your engineering studies?
                </h2>
                <p className="text-xs sm:text-sm text-surface-400 leading-relaxed max-w-md mx-auto">
                  Ask theoretical questions, request step-by-step mathematical proofs, or analyze
                  complex algorithmic invariants backed by course citations.
                </p>
              </div>

              {/* Contextual Starter Suggestions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full pt-1">
                {PROMPT_SUGGESTIONS.map((sug) => (
                  <button
                    key={sug.title}
                    type="button"
                    onClick={() => handleSendQuery(sug.title)}
                    className="p-3.5 rounded-xl border border-surface-700 bg-card hover:bg-elevated/75 hover:border-surface-600 text-left transition-all shadow-[var(--shadow-card)] group"
                  >
                    <span className="font-mono text-[10px] uppercase text-brand-700 block font-semibold mb-1 tracking-wider">
                      {sug.tag}
                    </span>
                    <span className="text-xs sm:text-[13px] font-medium text-surface-200 group-hover:text-surface-100 leading-snug block">
                      {sug.title}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((m, idx) => {
                const isUser = m.role === 'user';
                const isErr = Boolean(m.isError);

                return (
                  <div
                    key={idx}
                    className={`flex flex-col max-w-[92%] sm:max-w-[85%] space-y-2 ${
                      isUser ? 'ml-auto items-end' : 'mr-auto items-start'
                    }`}
                  >
                    {isUser ? (
                      <div className="px-4 py-3 rounded-2xl rounded-br-sm bg-brand-500 text-white text-xs sm:text-sm leading-relaxed shadow-[var(--shadow-card)] whitespace-pre-wrap">
                        {m.content}
                      </div>
                    ) : (
                      <div
                        className={`w-full rounded-2xl rounded-bl-sm border p-4 sm:p-5 shadow-[var(--shadow-card)] space-y-3 ${
                          isErr
                            ? 'bg-rose-500/8 border-rose-500/35 text-surface-100'
                            : 'bg-card border-surface-700 text-surface-100'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 pb-2 border-b border-surface-700/70">
                          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold text-surface-300">
                            {isErr ? (
                              <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                            ) : (
                              <Bot className="w-3.5 h-3.5 text-brand-700" />
                            )}
                            <span>{isErr ? 'Response Interrupted' : 'EngineerOS AI'}</span>
                          </span>

                          {isErr && m.retryQuery ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              leftIcon={RotateCcw}
                              onClick={() => handleSendQuery(m.retryQuery)}
                              disabled={isStreaming}
                            >
                              Retry Query
                            </Button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleCopyMessage(idx, m.content)}
                              aria-label="Copy assistant response"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono text-surface-400 hover:text-surface-100 hover:bg-elevated transition-colors"
                            >
                              {copiedMsgIdx === idx ? (
                                <>
                                  <Check className="w-3 h-3 badge-compiler" />
                                  <span className="badge-compiler">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>

                        <MarkdownMessageRenderer content={m.content} />
                      </div>
                    )}

                    {/* Grounded Curriculum Citations */}
                    {m.citations?.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                        <span className="text-[10px] text-surface-400 font-mono inline-flex items-center gap-1">
                          <BookOpen className="w-3 h-3 text-brand-700" />
                          Grounded Sources:
                        </span>
                        {m.citations.map((c, cIdx) => (
                          <span
                            key={cIdx}
                            className="inline-flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded-md bg-elevated text-surface-200 border border-surface-700"
                          >
                            {c.type && (
                              <span className="uppercase font-semibold text-brand-700">
                                {c.type}
                              </span>
                            )}
                            <span>{c.title}</span>
                            {c.topic && (
                              <span className="text-surface-400">· {c.topic}</span>
                            )}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Live Streaming Bubble */}
              {isStreaming && (
                <div className="flex flex-col max-w-[92%] sm:max-w-[85%] space-y-2 mr-auto items-start">
                  <div className="w-full rounded-2xl rounded-bl-sm border border-brand-500/35 bg-card p-4 sm:p-5 shadow-[var(--shadow-card)] space-y-3">
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-surface-700/70">
                      <span className="inline-flex items-center gap-2 font-mono text-[11px] font-semibold text-brand-700">
                        <span className="w-2 h-2 rounded-full bg-brand-500 animate-ping" />
                        EngineerOS AI · Streaming
                      </span>
                    </div>

                    {streamingText ? (
                      <div className="space-y-1">
                        <MarkdownMessageRenderer content={streamingText} />
                        <span className="inline-block w-1.5 h-4 bg-brand-500 animate-pulse align-middle" />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-surface-300 font-mono py-1">
                        <span>Synthesizing verified engineering explanation...</span>
                        <span className="inline-block w-1.5 h-4 bg-brand-500 animate-pulse" />
                      </div>
                    )}
                  </div>

                  {currentCitations.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      <span className="text-[10px] text-surface-400 font-mono inline-flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-brand-700" />
                        Active Sources:
                      </span>
                      {currentCitations.map((c, cIdx) => (
                        <span
                          key={cIdx}
                          className="inline-flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded-md bg-elevated text-surface-200 border border-surface-700"
                        >
                          {c.type && (
                            <span className="uppercase font-semibold text-brand-700">
                              {c.type}
                            </span>
                          )}
                          <span>{c.title}</span>
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

        {/* Multi-Line Composer & Controls */}
        <footer className="p-3.5 sm:p-4 border-t border-surface-700 bg-elevated/45 space-y-2.5 shrink-0">
          {selectedSubject && (
            <div className="flex items-center justify-between gap-2 px-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-brand-500/10 border border-brand-500/25 text-brand-700 font-mono text-[11px]">
                <BookOpen className="w-3 h-3" />
                Context: {selectedSubject.code} — {selectedSubject.name}
                <button
                  type="button"
                  onClick={() => setSelectedSubjectId('')}
                  aria-label="Clear syllabus filter"
                  className="ml-1 hover:opacity-75"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendQuery();
            }}
            className="flex items-end gap-2"
          >
            <button
              type="button"
              onClick={handleToggleSpeech}
              title="Voice Dictation"
              aria-label="Voice dictation"
              aria-pressed={isListening}
              className={`p-2.5 rounded-lg border transition-colors shrink-0 ${
                isListening
                  ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/40 animate-pulse'
                  : 'bg-card border-surface-600 text-surface-300 hover:text-surface-100 hover:bg-elevated'
              }`}
            >
              {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>

            <textarea
              rows={2}
              placeholder={
                isListening
                  ? 'Listening to speech...'
                  : 'Ask an engineering question or paste code... (Shift+Enter for newline)'
              }
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendQuery();
                }
              }}
              disabled={isStreaming}
              className="flex-1 min-h-[44px] max-h-36 px-3.5 py-2.5 rounded-lg bg-auth-input border border-surface-600 text-xs sm:text-sm text-surface-100 placeholder:text-surface-500 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 resize-y"
            />

            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isStreaming || !inputQuery.trim()}
              isLoading={isStreaming}
              leftIcon={Send}
              className="shrink-0"
            >
              {isStreaming ? 'Streaming...' : 'Send'}
            </Button>
          </form>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-surface-400 text-center">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              Responses are grounded in university curriculum notes. Verify critical proofs with official textbooks.
            </span>
          </div>
        </footer>
      </section>

      {/* Mobile / Tablet Slide-Over Study Thread Drawer */}
      <Drawer
        isOpen={mobileHistoryOpen}
        onClose={() => setMobileHistoryOpen(false)}
        title="Study Threads & Syllabus Scope"
        side="left"
      >
        <ThreadSidebar
          conversations={conversations}
          activeConversationId={activeConversationId}
          subjects={subjects}
          selectedSubjectId={selectedSubjectId}
          onSelectSubject={setSelectedSubjectId}
          onSelectConversation={handleSelectConversation}
          onStartNewChat={handleStartNewChat}
          isLoading={isSidebarLoading}
        />
      </Drawer>
    </div>
  );
}

export default AiAssistantPage;
