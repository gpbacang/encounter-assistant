import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import './index.css';
import { SessionProvider } from './session';
import { SetupPage } from './pages/SetupPage';
import { LivePage } from './pages/LivePage';
import { ReviewPage } from './pages/ReviewPage';

const router = createBrowserRouter([
  { path: '/', element: <SetupPage /> },
  { path: '/live', element: <LivePage /> },
  { path: '/review', element: <ReviewPage /> },
  { path: '*', element: <Navigate to="/" replace /> },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SessionProvider>
      <RouterProvider router={router} />
    </SessionProvider>
  </StrictMode>,
);
