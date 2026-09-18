import { StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { Router } from 'wouter';
import App from './App';
import './index.css';
import { createQueryClient } from './queryClient';
import ClientLocale from '#components/ClientLocale';

const queryClient = createQueryClient();

function renderApp() {
  return (
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <Router>
          <ClientLocale>
            <App />
          </ClientLocale>
        </Router>
      </QueryClientProvider>
    </StrictMode>
  );
}

hydrateRoot(document.getElementById('root') as HTMLElement, renderApp());
