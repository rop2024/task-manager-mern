import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // Development proxy (uncomment if needed)
    // proxy: {
    //   '/api': {
    //     target: 'http://localhost:5001',
    //     changeOrigin: true,
    //   },
    // },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'router': ['react-router-dom'],
          'axios': ['axios'],
          
          // UI/Component chunks
          'components': [
            './src/components/layout/Navigation.jsx',
            './src/components/layout/Sidebar.jsx',
            './src/components/layout/ThemeToggle.jsx'
          ],
          
          // Feature-specific chunks
          'tasks': [
            './src/components/tasks/TaskForm.jsx',
            './src/components/tasks/TaskItem.jsx',
            './src/components/tasks/TaskStats.jsx',
            './src/components/tasks/CompletedTasksPanel.jsx'
          ],
          
          'calendar': [
            './src/components/calendar/CalendarView.jsx',
            './src/components/calendar/CalendarTaskForm.jsx',
            './src/components/calendar/RemindersList.jsx'
          ],
          
          'scoreboard': [
            './src/components/scoreboard/ProductivityScore.jsx',
            './src/components/scoreboard/StatsCard.jsx',
            './src/components/scoreboard/StatsOverview.jsx'
          ]
        }
      }
    },
    chunkSizeWarningLimit: 600, // Increase warning limit to 600kb
    sourcemap: false, // Disable sourcemaps in production to reduce bundle size
  },
})