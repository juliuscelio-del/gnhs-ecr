import { createRoot } from 'react-dom/client';
import App from './App.jsx';

function mount() {
  let el = document.getElementById('react-root');
  if (!el) {
    el = document.createElement('div');
    el.id = 'react-root';
    document.body.appendChild(el);
  }
  createRoot(el).render(<App />);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
else mount();
