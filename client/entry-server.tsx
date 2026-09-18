import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { QueryClientProvider } from '@tanstack/react-query';
import { Router } from 'wouter';
import App from './App';
import { createQueryClient } from './queryClient';

export function render(url: string) {
  const queryClient = createQueryClient();
  const html = renderToString(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <Router ssrPath={url}>
          <App />
        </Router>
      </QueryClientProvider>
    </StrictMode>,
  );
  return { html };
}
