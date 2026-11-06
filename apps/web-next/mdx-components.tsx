import type { MDXComponents } from 'mdx/types';
import Link from 'next/link';

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h2: ({ children, ...props }) => (
      <h2
        id={
          typeof children === 'string'
            ? children
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '')
            : undefined
        }
        className="scroll-mt-24 text-3xl font-semibold tracking-tight text-white"
        {...props}
      >
        {children}
      </h2>
    ),
    h3: props => <h3 className="text-xl font-semibold text-white" {...props} />,
    p: props => <p className="text-lg leading-8 text-slate-300" {...props} />,
    ul: props => <ul className="space-y-3 pl-6 text-slate-300" {...props} />,
    ol: props => <ol className="space-y-3 pl-6 text-slate-300" {...props} />,
    li: props => <li className="leading-7" {...props} />,
    a: ({ href = '', ...props }) =>
      href.startsWith('/') ? (
        <Link href={href} className="text-accent hover:underline" {...props} />
      ) : (
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline" {...props} />
      ),
    code: props => <code className="rounded bg-white/10 px-1.5 py-0.5 text-[0.95em] text-emerald-200" {...props} />,
    pre: props => (
      <pre
        className="overflow-x-auto rounded-2xl border border-white/5 bg-black/30 p-4 text-sm text-slate-200"
        {...props}
      />
    ),
    table: props => (
      <table className="min-w-full border-separate border-spacing-y-2 text-left text-slate-300" {...props} />
    ),
    th: props => <th className="px-3 py-2 text-xs uppercase tracking-[0.2em] text-slate-500" {...props} />,
    td: props => <td className="rounded-xl border border-white/5 bg-black/20 px-3 py-3 align-top" {...props} />,
    blockquote: props => <blockquote className="border-l-2 border-accent/40 pl-4 text-slate-300 italic" {...props} />,
    ...components,
  };
}
