import React, { createContext, useContext, useState } from 'react';
import { getTasksWithDrafts } from '../api/tasks';

const TaskContext = createContext();

export const useTask = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  return context;
};

export const TaskProvider = ({ children }) => {
  const [refreshFlag, setRefreshFlag] = useState(0);

  const refreshTasks = () => {
    setRefreshFlag(prev => prev + 1);
  };

  const value = {
    refreshFlag,
    refreshTasks
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
};