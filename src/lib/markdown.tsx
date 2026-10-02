import { createElement, type ReactNode } from 'react';

// Kleiner, sicherer Markdown-Renderer ohne HTML-Durchlass. Unterstützt Überschriften (#, ##, ###),
// Absätze, Listen (- oder 1.), fett (**), kursiv (*), Code (`), Links [Text](URL) und Trennlinien (---).
// Erlaubte Link-Ziele: http, https, mailto und Adressen dieser Seite.

const SAFE_URL = /^(https?:\/\/|mailto:|\/)/i;

type Block =
  | { t: 'p'; text: string }
  | { t: 'h'; level: number; text: string }
  | { t: 'ul' | 'ol'; items: string[] }
  | { t: 'hr' };

function parse(source: string): Block[] {
  const out: Block[] = [];
  const st = { para: [] as string[], kind: null as 'ul' | 'ol' | null, items: [] as string[] };
  const flush = () => {
    if (st.para.length) {
      out.push({ t: 'p', text: st.para.join(' ') });
      st.para = [];
    }
    if (st.kind) {
      out.push({ t: st.kind, items: st.items });
      st.kind = null;
      st.items = [];
    }
  };
  for (const raw of source.replace(/\r\n?/g, '\n').split('\n')) {
    const line = raw.trim();
    if (!line) {
      flush();
      continue;
    }
    const h = /^(#{1,3})\s+(.+)$/.exec(line);
    if (h) {
      flush();
      out.push({ t: 'h', level: h[1].length, text: h[2] });
      continue;
    }
    if (/^(-{3,}|\*{3,})$/.test(line)) {
      flush();
      out.push({ t: 'hr' });
      continue;
    }
    const ul = /^[-*]\s+(.+)$/.exec(line);
    const ol = /^\d+[.)]\s+(.+)$/.exec(line);
    const kind = ul ? 'ul' : ol ? 'ol' : null;
    if (kind) {
      if (st.kind !== kind) flush();
      st.kind = kind;
      st.items.push((ul ?? ol)![1]);
      continue;
    }
    if (st.kind) flush();
    st.para.push(line);
  }
  flush();
  return out;
}

function inline(text: string, prefix: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/g;
  let last = 0;
  let i = 0;
  for (const m of text.matchAll(re)) {
    const idx = m.index ?? 0;
    if (idx > last) out.push(text.slice(last, idx));
    const tok = m[0];
    const key = `${prefix}-${i++}`;
    if (tok.startsWith('**')) {
      out.push(<strong key={key}>{tok.slice(2, -2)}</strong>);
    } else if (tok.startsWith('`')) {
      out.push(<code key={key}>{tok.slice(1, -1)}</code>);
    } else if (tok.startsWith('[')) {
      const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(tok);
      if (link && SAFE_URL.test(link[2])) {
        const external = !link[2].startsWith('/');
        out.push(
          <a key={key} href={link[2]} rel='noopener noreferrer' target={external ? '_blank' : undefined}>
            {link[1]}
          </a>,
        );
      } else {
        out.push(tok);
      }
    } else {
      out.push(<em key={key}>{tok.slice(1, -1)}</em>);
    }
    last = idx + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Markdown({ source }: { source: string }) {
  const blocks = parse(source);
  return (
    <div className='md'>
      {blocks.map((b, i) => {
        const key = `b${i}`;
        if (b.t === 'hr') return <hr key={key} />;
        if (b.t === 'p') return <p key={key}>{inline(b.text, key)}</p>;
        if (b.t === 'h') return createElement(`h${Math.min(b.level + 1, 4)}`, { key }, ...inline(b.text, key));
        const items = b.items.map((it, j) => <li key={`${key}-${j}`}>{inline(it, `${key}-${j}`)}</li>);
        return b.t === 'ul' ? <ul key={key}>{items}</ul> : <ol key={key}>{items}</ol>;
      })}
    </div>
  );
}
