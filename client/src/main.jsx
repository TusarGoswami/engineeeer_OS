import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './app/queryClient.js';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { AuthProvider } from './features/auth/AuthContext.jsx';
import { ToastProvider } from './components/Toast.jsx';
import { router } from './app/router.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);
