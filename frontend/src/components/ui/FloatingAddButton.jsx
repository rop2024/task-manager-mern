import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import QuickCaptureModal from './QuickCaptureModal';

const FloatingAddButton = ({ onTaskFormOpen }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [showQuickCapture, setShowQuickCapture] = useState(false);

  const handleQuickCapture = () => {
    setShowQuickCapture(true);
  };

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {/* Main Floating Button */}
        <button
          onClick={handleQuickCapture}
          className="w-14 h-14 rounded-full shadow-lg transition-all duration-200 transform hover:scale-110 active:scale-95
                    bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center group"
          aria-label="Quick Capture"
          title="Quick Capture - Save idea as draft"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </button>
      </div>

      {/* Quick Capture Modal */}
      {showQuickCapture && (
        <QuickCaptureModal
          isOpen={showQuickCapture}
          onClose={() => setShowQuickCapture(false)}
        />
      )}
    </>
  );
};

export default FloatingAddButton;