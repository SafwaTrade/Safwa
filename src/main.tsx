import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import './i18n/config.ts';
import App from './App.tsx';
import './index.css';
import { FavoritesProvider } from './context/FavoritesContext.tsx';
import { SiteContentProvider } from './context/SiteContentContext.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SiteContentProvider>
      <FavoritesProvider>
        <App />
      </FavoritesProvider>
    </SiteContentProvider>
  </StrictMode>,
);

