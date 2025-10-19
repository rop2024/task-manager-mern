import { useEffect, useState } from 'react';
import axios from 'axios';

const ConnectionDebug = () => {
  const [status, setStatus] = useState('checking...');
  const [apiUrl, setApiUrl] = useState('');

  useEffect(() => {
    const checkConnection = async () => {
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      setApiUrl(baseURL);
      
      try {
        const response = await axios.get('/api/hello');
        setStatus(`✅ Connected! Response: ${JSON.stringify(response.data)}`);
      } catch (error) {
        setStatus(`❌ Failed: ${error.message} - URL: ${baseURL}`);
        console.error('Connection error:', error);
      }
    };

    checkConnection();
  }, []);

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      background: 'black', 
      color: 'white', 
      padding: '10px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '100vw',
      wordBreak: 'break-all'
    }}>
      <div>API URL: {apiUrl}</div>
      <div>Status: {status}</div>
      <div>Environment: {import.meta.env.MODE}</div>
    </div>
  );
};

export default ConnectionDebug;