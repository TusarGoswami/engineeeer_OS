import { useState, Fragment } from 'react';
import { Copy, Check, Terminal } from 'lucide-react';

const CODE_KEYWORDS = new Set([
  'async', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue', 'def',
  'default', 'delete', 'do', 'elif', 'else', 'enum', 'except', 'export', 'extends',
  'false', 'finally', 'for', 'from', 'function', 'if', 'import', 'in', 'include',
  'int', 'interface', 'lambda', 'let', 'match', 'new', 'null', 'None', 'pass',
  'private', 'protected', 'public', 'raise', 'return', 'SELECT', 'FROM', 'WHERE',
  'static', 'struct', 'super', 'switch', 'this', 'throw', 'true', 'True', 'False',
  'try', 'type', 'typeof', 'using', 'var', 'void', 'while', 'with', 'yield',
]);

/**
 * Lightweight deterministic tokenizer for syntax-highlighted code lines (XSS-safe React spans).
 */
function highlightCodeLine(line) {
  const tokenRegex =
    /(\/\/.*$|#.*$|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b\d+(?:\.\d+)?\b|\b[A-Za-z_][A-Za-z0-9_]*\b)/g;

  const nodes = [];
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = tokenRegex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(line.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('//') || token.startsWith('#')) {
      nodes.push(
        <span key={key++} className="text-surface-400 italic">
          {token}
        </span>
      );
    } else if (token.startsWith('"') || token.startsWith("'") || token.startsWith('`')) {
      nodes.push(
        <span key={key++} className="badge-compiler">
          {token}
        </span>
      );
    } else if (/^\d/.test(token)) {
      nodes.push(
        <span key={key++} className="text-amber-600 dark:text-amber-300">
          {token}
        </span>
      );
    } else if (CODE_KEYWORDS.has(token)) {
      nodes.push(
        <span key={key++} className="text-brand-700 font-semibold">
          {token}
        </span>
      );
    } else {
      nodes.push(token);
    }
    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < line.length) {
    nodes.push(line.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : ' ';
}

/**
 * Dual-theme code block with syntax highlighting and clipboard feedback.
 */
export function CodeBlock({ language, code }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(code);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = (code || '').split('\n');

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-surface-700 bg-canvas font-mono text-xs shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between px-3.5 py-2 bg-elevated border-b border-surface-700 text-[11px] text-surface-400">
        <span className="inline-flex items-center gap-1.5 font-semibold uppercase text-brand-700 tracking-wider">
          <Terminal className="w-3.5 h-3.5 text-brand-700" />
          {language || 'code'}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          aria-label={`Copy ${language || 'code'} snippet`}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-card hover:bg-elevated text-surface-200 border border-surface-700 transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 badge-compiler" />
              <span className="badge-compiler text-[10px] font-semibold">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 text-surface-400" />
              <span className="text-[10px]">Copy Code</span>
            </>
          )}
        </button>
      </div>
      <div className="p-3.5 overflow-x-auto text-surface-100 leading-relaxed text-[12px] selection:bg-brand-500/20">
        <pre className="m-0">
          <code>
            {lines.map((line, i) => (
              <div key={i} className="whitespace-pre">
                {highlightCodeLine(line)}
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}

/**
 * Safely renders inline markdown: links, bold, italic, and inline code spans.
 */
function renderInlineMarkdown(text) {
  if (!text) return null;

  const inlineRegex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  const parts = [];
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = inlineRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code
          key={key++}
          className="font-mono text-[12px] px-1.5 py-0.5 rounded bg-elevated border border-surface-700 text-brand-700"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={key++} className="font-semibold text-surface-100">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(
        <em key={key++} className="italic text-surface-200">
          {token.slice(1, -1)}
        </em>
      );
    } else if (token.startsWith('[')) {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      const label = linkMatch?.[1] || token;
      const href = linkMatch?.[2] || '';
      const isSafe = /^(https?:\/\/|\/)/i.test(href);
      if (isSafe) {
        parts.push(
          <a
            key={key++}
            href={href}
            target={href.startsWith('/') ? undefined : '_blank'}
            rel={href.startsWith('/') ? undefined : 'noreferrer'}
            className="text-brand-700 underline underline-offset-2 hover:opacity-80"
          >
            {label}
          </a>
        );
      } else {
        parts.push(label);
      }
    }

    lastIndex = inlineRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.map((node, idx) => <Fragment key={idx}>{node}</Fragment>);
}

/**
 * Parses a markdown table segment into an accessible table element.
 */
function parseTableBlock(tableLines, key) {
  const splitRow = (row) =>
    row
      .trim()
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((cell) => cell.trim());

  const headers = splitRow(tableLines[0]);
  const rows = tableLines.slice(2).map(splitRow);

  return (
    <div key={key} className="my-3 overflow-x-auto rounded-lg border border-surface-700">
      <table className="w-full text-left border-collapse text-xs sm:text-[13px]">
        <thead className="bg-elevated border-b border-surface-700">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-3.5 py-2 font-semibold text-surface-100 whitespace-nowrap">
                {renderInlineMarkdown(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-700 bg-card">
          {rows.map((cells, rIdx) => (
            <tr key={rIdx} className="hover:bg-elevated/40">
              {cells.map((cell, cIdx) => (
                <td key={cIdx} className="px-3.5 py-2 text-surface-200 align-top">
                  {renderInlineMarkdown(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Renders structured non-code Markdown blocks (headings, lists, tables, blockquotes, paragraphs).
 */
function MarkdownTextSegment({ text }) {
  const lines = (text || '').split('\n');
  const blocks = [];
  let idx = 0;

  while (idx < lines.length) {
    const line = lines[idx];
    const trimmed = line.trim();

    if (!trimmed) {
      idx++;
      continue;
    }

    // Headings (# .. ####)
    const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const content = headingMatch[2];
      const cls =
        level === 1
          ? 'font-display text-base sm:text-lg font-bold text-surface-100 mt-3 mb-1.5'
          : level === 2
          ? 'font-display text-sm sm:text-base font-semibold text-surface-100 mt-3 mb-1'
          : 'font-display text-xs sm:text-sm font-semibold text-surface-100 mt-2.5 mb-1';
      blocks.push(
        <div key={blocks.length} className={cls}>
          {renderInlineMarkdown(content)}
        </div>
      );
      idx++;
      continue;
    }

    // Horizontal rule
    if (/^([-*_])\1{2,}$/.test(trimmed)) {
      blocks.push(<hr key={blocks.length} className="my-3 border-surface-700" />);
      idx++;
      continue;
    }

    // Markdown table (header line + | --- | separator line)
    if (
      trimmed.includes('|') &&
      idx + 1 < lines.length &&
      /^\s*\|?[\s:-]+\|[\s|:-]+\s*$/.test(lines[idx + 1])
    ) {
      const tableLines = [lines[idx], lines[idx + 1]];
      idx += 2;
      while (idx < lines.length && lines[idx].trim().includes('|') && lines[idx].trim() !== '') {
        tableLines.push(lines[idx]);
        idx++;
      }
      blocks.push(parseTableBlock(tableLines, blocks.length));
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('>')) {
      const quoteLines = [];
      while (idx < lines.length && lines[idx].trim().startsWith('>')) {
        quoteLines.push(lines[idx].trim().replace(/^>\s?/, ''));
        idx++;
      }
      blocks.push(
        <blockquote
          key={blocks.length}
          className="my-2 border-l-2 border-brand-500 bg-elevated/55 pl-3.5 pr-3 py-2 rounded-r-lg text-surface-200 text-xs sm:text-sm leading-relaxed"
        >
          {quoteLines.map((qLine, qIdx) => (
            <p key={qIdx}>{renderInlineMarkdown(qLine)}</p>
          ))}
        </blockquote>
      );
      continue;
    }

    // Unordered list
    if (/^[-*+]\s+/.test(trimmed)) {
      const items = [];
      while (idx < lines.length && /^[-*+]\s+/.test(lines[idx].trim())) {
        items.push(lines[idx].trim().replace(/^[-*+]\s+/, ''));
        idx++;
      }
      blocks.push(
        <ul key={blocks.length} className="my-2 list-disc pl-5 space-y-1 text-surface-200 leading-relaxed">
          {items.map((item, i) => (
            <li key={i}>{renderInlineMarkdown(item)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // Ordered list
    if (/^\d+\.\s+/.test(trimmed)) {
      const items = [];
      while (idx < lines.length && /^\d+\.\s+/.test(lines[idx].trim())) {
        items.push(lines[idx].trim().replace(/^\d+\.\s+/, ''));
        idx++;
      }
      blocks.push(
        <ol key={blocks.length} className="my-2 list-decimal pl-5 space-y-1 text-surface-200 leading-relaxed">
          {items.map((item, i) => (
            <li key={i}>{renderInlineMarkdown(item)}</li>
          ))}
        </ol>
      );
      continue;
    }

    // Paragraph block
    const paraLines = [];
    while (
      idx < lines.length &&
      lines[idx].trim() !== '' &&
      !/^(#{1,4}\s|[-*+]\s|\d+\.\s|>)/.test(lines[idx].trim())
    ) {
      if (
        lines[idx].includes('|') &&
        idx + 1 < lines.length &&
        /^\s*\|?[\s:-]+\|[\s|:-]+\s*$/.test(lines[idx + 1])
      ) {
        break;
      }
      paraLines.push(lines[idx]);
      idx++;
    }

    blocks.push(
      <p key={blocks.length} className="leading-relaxed text-surface-100 whitespace-pre-wrap">
        {renderInlineMarkdown(paraLines.join('\n'))}
      </p>
    );
  }

  return <div className="space-y-1.5">{blocks}</div>;
}

/**
 * Full streaming-safe Markdown & highlighted code block renderer for AI Academic Assistant responses.
 */
export function MarkdownMessageRenderer({ content }) {
  if (!content) return null;

  // Split closed fenced code blocks first
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-2 text-xs sm:text-sm">
      {parts.map((part, i) => {
        if (!part) return null;
        if (part.startsWith('```') && part.endsWith('```') && part.length >= 6) {
          const match = part.match(/^```([A-Za-z0-9_-]+)?\n?([\s\S]*?)```$/);
          const language = match ? match[1] || '' : '';
          const code = match ? match[2] : part.slice(3, -3);
          return <CodeBlock key={i} language={language} code={code.replace(/\n$/, '')} />;
        }

        // Handle unclosed opening fence mid-stream gracefully
        const openFenceIdx = part.indexOf('```');
        if (openFenceIdx !== -1) {
          const prefix = part.slice(0, openFenceIdx);
          const fenceBody = part.slice(openFenceIdx + 3);
          const firstNewline = fenceBody.indexOf('\n');
          const language = firstNewline !== -1 ? fenceBody.slice(0, firstNewline).trim() : '';
          const code = firstNewline !== -1 ? fenceBody.slice(firstNewline + 1) : '';
          return (
            <Fragment key={i}>
              {prefix && <MarkdownTextSegment text={prefix} />}
              <CodeBlock language={language} code={code} />
            </Fragment>
          );
        }

        return <MarkdownTextSegment key={i} text={part} />;
      })}
    </div>
  );
}

export default MarkdownMessageRenderer;

