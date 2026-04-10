import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AnonAadhaarProvider } from '@anon-aadhaar/react';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AnonAadhaarProvider _useTestAadhaar={true}>
      <App />
    </AnonAadhaarProvider>
  </React.StrictMode>,
);
