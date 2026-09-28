import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

const originalFetch = window.fetch;
window.fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input?.url;
  if (url && typeof url === 'string' && url.startsWith('/api') && url !== '/api/auth') {
    const token = localStorage.getItem('moksha_token');
    init = init || {};
    init.headers = {
      ...init.headers,
      'Authorization': token ? `Bearer ${token}` : ''
    };
  }
  const response = await originalFetch(input, init);
  if (response.status === 401 && url !== '/api/auth') {
    localStorage.removeItem('moksha_token');
    window.location.reload();
  }
  return response;
};

import AuthGate from './components/AuthGate'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthGate>
      <App />
    </AuthGate>
  </React.StrictMode>,
)
