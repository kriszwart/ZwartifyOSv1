/**
 * Enhanced markdown components for better formatting
 * Provides improved typography and visual hierarchy for agent output
 */

import React from 'react'

export const enhancedMarkdownComponents = {
  code({ node, className, children, ...props }: any) {
    const match = /language-(\w+)/.exec(className || "")
    const isInline = !match
    if (isInline) {
      return (
        <code 
          className="px-2 py-1 bg-green-400/15 border border-green-400/30 rounded text-green-300 text-xs font-mono font-semibold" 
          {...props}
        >
          {children}
        </code>
      )
    }
    return (
      <pre className="bg-black/80 border-2 border-green-400/40 p-4 rounded-lg overflow-x-auto my-4 shadow-[0_0_15px_rgba(0,255,0,0.1)]">
        <code className={className} {...props}>
          {String(children).replace(/\n$/, "")}
        </code>
      </pre>
    )
  },
  p({ children }: any) {
    return <p className="text-green-300 font-sans mb-4 leading-relaxed text-sm">{children}</p>
  },
  ul({ children }: any) {
    return <ul className="list-disc list-outside space-y-2 text-green-300 mb-4 ml-6">{children}</ul>
  },
  ol({ children }: any) {
    return <ol className="list-decimal list-outside space-y-2 text-green-300 mb-4 ml-6">{children}</ol>
  },
  li({ children }: any) {
    return <li className="text-green-300/90 leading-relaxed">{children}</li>
  },
  h1({ children }: any) {
    return (
      <h1 className="text-2xl font-bold text-green-400 mb-4 mt-6 pb-2 border-b border-green-400/30">
        {children}
      </h1>
    )
  },
  h2({ children }: any) {
    return (
      <h2 className="text-xl font-bold text-green-400 mb-3 mt-5 pb-1 border-b border-green-400/20">
        {children}
      </h2>
    )
  },
  h3({ children }: any) {
    return <h3 className="text-lg font-bold text-green-400 mb-2 mt-4">{children}</h3>
  },
  h4({ children }: any) {
    return <h4 className="text-base font-semibold text-green-400/90 mb-2 mt-3">{children}</h4>
  },
  blockquote({ children }: any) {
    return (
      <blockquote className="border-l-4 border-green-400/60 pl-4 italic text-green-300/80 my-4 bg-green-400/5 py-2 rounded-r">
        {children}
      </blockquote>
    )
  },
  table({ children }: any) {
    return (
      <div className="overflow-x-auto my-4">
        <table className="min-w-full border border-green-400/30 rounded-lg">
          {children}
        </table>
      </div>
    )
  },
  thead({ children }: any) {
    return <thead className="bg-green-400/10">{children}</thead>
  },
  tbody({ children }: any) {
    return <tbody>{children}</tbody>
  },
  tr({ children }: any) {
    return <tr className="border-b border-green-400/20">{children}</tr>
  },
  th({ children }: any) {
    return (
      <th className="px-4 py-2 text-left text-green-400 font-semibold text-sm border-r border-green-400/20 last:border-r-0">
        {children}
      </th>
    )
  },
  td({ children }: any) {
    return (
      <td className="px-4 py-2 text-green-300/90 text-sm border-r border-green-400/20 last:border-r-0">
        {children}
      </td>
    )
  },
  hr() {
    return <hr className="border-green-400/30 my-6" />
  },
  strong({ children }: any) {
    return <strong className="text-green-400 font-semibold">{children}</strong>
  },
  em({ children }: any) {
    return <em className="text-green-300/80 italic">{children}</em>
  },
  a({ href, children }: any) {
    return (
      <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-cyan-400 hover:text-cyan-300 underline"
      >
        {children}
      </a>
    )
  },
}

