'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type AIFormattedResponseProps = {
  content: string;
};

export function AIFormattedResponse({ content }: AIFormattedResponseProps) {
  return (
    <div className="prose prose-invert max-w-none prose-headings:text-white prose-p:text-slate-200 prose-strong:text-slate-100 prose-li:text-slate-200 prose-code:text-emerald-300 prose-pre:bg-slate-950/80 prose-pre:border prose-pre:border-slate-700">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
