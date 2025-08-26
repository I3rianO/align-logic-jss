import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Initialize store before rendering the app
// This ensures data is loaded from localStorage on startup
import './store/persistenceInit';

// Import the data restoration wrapper component
import RestoreAppWrapper from './utils/restore-app-wrapper';

// Import and run the emergency fix script FIRST before anything else
import './utils/emergencyFix';

// Perform additional direct restoration before rendering anything
import { forceRestoreUPSJACFL } from './utils/directUPSJACFLRestore';

// HIGHEST PRIORITY: Direct restoration before React loads
forceRestoreUPSJACFL();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <RestoreAppWrapper>
      <App />
    </RestoreAppWrapper>
  </React.StrictMode>
);