import { useState, useEffect, useRef } from 'react';
import { aiService } from '../../services/ai.service.js';
import { academicsService } from '../../services/academics.service.js';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Badge from '../../components/Badge';

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
            content: `Error: ${err.message || 'Failed to complete response.'}`,
            timestamp: new Date(),
          },
        ]);
        setStreamingText('');
      },
    });
  };

  const PROMPT_SUGGESTIONS = [
    'Explain Binary Search invariant & bounds',
    'How does Virtual Memory Paging work?',
    'What is the difference between 3NF and BCNF?',
    'Explain TCP Congestion Control and Fast Recovery',
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '280px 1fr',
        gap: '1rem',
        height: 'calc(100vh - 120px)',
      }}
    >
      {/* Left Sidebar: Threads and Subject Filter */}
      <Card
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: '1rem',
          height: '100%',
          overflow: 'hidden',
          gap: '1rem',
        }}
      >
        <Button variant="primary" onClick={handleStartNewChat}>
          + New Study Thread
        </Button>

        {/* Subject Context Selector */}
        <div>
          <label
            style={{
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              fontWeight: 600,
              display: 'block',
              marginBottom: '4px',
            }}
          >
            Ground in Subject:
          </label>
          <select
            value={selectedSubjectId}
            onChange={e => setSelectedSubjectId(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 8px',
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              color: 'var(--text-main)',
              fontSize: '0.85rem',
              outline: 'none',
            }}
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
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem',
          }}
        >
          <span
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              fontWeight: 600,
              textTransform: 'uppercase',
            }}
          >
            Recent Threads
          </span>
          {conversations.length === 0 ? (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.5rem 0' }}>
              No past threads
            </p>
          ) : (
            conversations.map(c => (
              <button
                key={c._id}
                onClick={() => handleSelectConversation(c._id)}
                style={{
                  textAlign: 'left',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  background:
                    activeConversationId === c._id
                      ? 'var(--primary-subtle, rgba(99, 102, 241, 0.2))'
                      : 'transparent',
                  border:
                    activeConversationId === c._id
                      ? '1px solid var(--primary, #6366f1)'
                      : '1px solid transparent',
                  color:
                    activeConversationId === c._id
                      ? 'var(--primary, #6366f1)'
                      : 'var(--text-muted)',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                }}
              >
                {c.title}
              </button>
            ))
          )}
        </div>
      </Card>

      {/* Main Chat Interface */}
      <Card
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          padding: 0,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '12px 1.5rem',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <div>
            <h2
              style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}
            >
              AI Academic Assistant
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Grounded in verified university syllabi, lecture notes & previous year questions.
            </span>
          </div>
          <Badge variant="primary">Context Grounded</Badge>
        </div>

        {/* Messages Stream Container */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          {messages.length === 0 && !isStreaming ? (
            <div
              style={{
                textAlign: 'center',
                margin: 'auto',
                maxWidth: '500px',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              <div style={{ fontSize: '2.5rem' }}>🤖</div>
              <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.25rem' }}>
                How can I assist your engineering studies today?
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.85rem',
                  color: 'var(--text-muted)',
                  lineHeight: 1.5,
                }}
              >
                Ask theoretical questions, request step-by-step mathematical proofs, or clarify
                complex algorithmic edge cases.
              </p>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  marginTop: '0.5rem',
                }}
              >
                {PROMPT_SUGGESTIONS.map(sug => (
                  <button
                    key={sug}
                    onClick={() => handleSendQuery(sug)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      color: 'var(--text-main)',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    💬 {sug}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '80%',
                    gap: '4px',
                  }}
                >
                  <div
                    style={{
                      padding: '12px 16px',
                      borderRadius: '12px',
                      background:
                        m.role === 'user' ? 'var(--primary, #6366f1)' : 'rgba(255, 255, 255, 0.05)',
                      color: m.role === 'user' ? '#fff' : 'var(--text-main)',
                      fontSize: '0.95rem',
                      lineHeight: 1.6,
                      whiteSpace: 'pre-line',
                      border: m.role === 'user' ? 'none' : '1px solid var(--border)',
                    }}
                  >
                    {m.content}
                  </div>

                  {/* Grounded Source Citations */}
                  {m.citations && m.citations.length > 0 && (
                    <div
                      style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '4px' }}
                    >
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Sources:
                      </span>
                      {m.citations.map((c, cIdx) => (
                        <span
                          key={cIdx}
                          style={{
                            fontSize: '0.7rem',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: 'rgba(99, 102, 241, 0.15)',
                            color: 'var(--primary, #6366f1)',
                            border: '1px solid rgba(99, 102, 241, 0.3)',
                          }}
                        >
                          📖 {c.title}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Streaming In-Progress Assistant Bubble */}
              {isStreaming && (
                <div
                  style={{
                    alignSelf: 'flex-start',
                    maxWidth: '80%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div
                    style={{
                      padding: '12px 16px',
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: 'var(--text-main)',
                      fontSize: '0.95rem',
                      lineHeight: 1.6,
                      whiteSpace: 'pre-line',
                      border: '1px solid var(--border)',
                    }}
                  >
                    {streamingText || 'Generating grounded academic response...'}
                    <span style={{ animation: 'blink 1s infinite', marginLeft: '2px' }}>▍</span>
                  </div>

                  {currentCitations.length > 0 && (
                    <div
                      style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '4px' }}
                    >
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Grounded Context:
                      </span>
                      {currentCitations.map((c, cIdx) => (
                        <span
                          key={cIdx}
                          style={{
                            fontSize: '0.7rem',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: 'rgba(99, 102, 241, 0.15)',
                            color: 'var(--primary, #6366f1)',
                            border: '1px solid rgba(99, 102, 241, 0.3)',
                          }}
                        >
                          📖 {c.title}
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

        {/* Input Bar & Academic Integrity Disclaimer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--border)',
            background: 'rgba(0, 0, 0, 0.2)',
          }}
        >
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSendQuery();
            }}
            style={{ display: 'flex', gap: '0.75rem' }}
          >
            <input
              type="text"
              placeholder="Ask an engineering question..."
              value={inputQuery}
              onChange={e => setInputQuery(e.target.value)}
              disabled={isStreaming}
              style={{
                flex: 1,
                padding: '10px 14px',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--text-main)',
                fontSize: '0.95rem',
                outline: 'none',
              }}
            />
            <Button type="submit" variant="primary" disabled={isStreaming || !inputQuery.trim()}>
              {isStreaming ? 'Streaming...' : 'Send'}
            </Button>
          </form>
          <div
            style={{
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
              textAlign: 'center',
              marginTop: '6px',
            }}
          >
            ⚠️ AI Academic Assistant responses are grounded in verified university syllabus
            resources. Verify critical proofs with official textbooks.
          </div>
        </div>
      </Card>
    </div>
  );
}

export default AiAssistantPage;
