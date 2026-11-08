import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import './index.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { SessionProvider } from './session';
import { cssVariablesResolver, theme } from './theme';
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
    {/* Light only: a clinic tablet in a lit room. Dark mode is a later addition. */}
    <MantineProvider theme={theme} cssVariablesResolver={cssVariablesResolver} defaultColorScheme="light">
      <Notifications position="top-center" autoClose={2500} className="app-notifications" />
      <SessionProvider>
        <RouterProvider router={router} />
      </SessionProvider>
    </MantineProvider>
  </StrictMode>,
);
