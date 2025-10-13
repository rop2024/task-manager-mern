import React, { useEffect } from 'react';

const DiagnosticComponent = ({ componentName, props = {} }) => {
  useEffect(() => {
    console.log(`🔍 DIAGNOSTIC: ${componentName} mounted successfully`);
    console.log(`🔍 DIAGNOSTIC: ${componentName} props:`, props);
    return () => {
      console.log(`🔍 DIAGNOSTIC: ${componentName} unmounted`);
    };
  }, [componentName, props]);

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      backgroundColor: '#4ade80',
      color: 'white',
      padding: '8px 12px',
      borderRadius: '6px',
      fontSize: '12px',
      fontWeight: 'bold',
      zIndex: 9999,
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      ✅ {componentName} OK
    </div>
  );
};

export default DiagnosticComponent;