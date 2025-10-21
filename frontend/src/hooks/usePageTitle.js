import { useEffect } from 'react';

/**
 * Custom hook to set the page title dynamically
 * @param {string} title - The title to set for the page
 * @param {string} [suffix] - Optional suffix to append (default: "Task Manager")
 */
export const usePageTitle = (title, suffix = "Task Manager") => {
  useEffect(() => {
    const fullTitle = title ? `${title} - ${suffix}` : suffix;
    document.title = fullTitle;
    
    // Cleanup: restore default title when component unmounts
    return () => {
      document.title = suffix;
    };
  }, [title, suffix]);
};

export default usePageTitle;