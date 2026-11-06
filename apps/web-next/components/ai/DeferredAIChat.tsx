'use client';

import dynamic from 'next/dynamic';

const AIChat = dynamic(() => import('./AIChat').then(module => module.AIChat), {
  ssr: false,
});

export function DeferredAIChat() {
  return <AIChat />;
}
