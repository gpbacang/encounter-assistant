import {
  Badge,
  Button,
  createTheme,
  Modal,
  Notification,
  Paper,
  type CSSVariablesResolver,
  type MantineColorsTuple,
} from '@mantine/core';

/*
 * Mantine theme in Everi Labs' palette: blue accent, navy for strong
 * actions, slate surfaces. Amber is kept for payer-critical items and red
 * for recording, because those colors carry meaning.
 * Index 6 of each tuple is the main shade.
 */
const everi: MantineColorsTuple = [
  '#e6f0f9', '#cfe2f4', '#a1c6ea', '#6fa8df', '#458ed6',
  '#2a7ecf', '#0068b8', '#005aa0', '#004d88', '#003d6d',
];

const navy: MantineColorsTuple = [
  '#eef1f7', '#d8deea', '#b0bcd3', '#8597b9', '#61779f',
  '#4a6290', '#0e1d3a', '#0b172e', '#081123', '#050b18',
];

const amber: MantineColorsTuple = [
  '#fdf6ea', '#fbecd2', '#f3d29c', '#e9b463', '#dc9a36',
  '#c98a2b', '#9a5b00', '#8a5100', '#704200', '#553200',
];

export const theme = createTheme({
  primaryColor: 'everi',
  primaryShade: 6,
  colors: { everi, navy, amber },
  fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', sans-serif",
  headings: {
    fontFamily: "'IBM Plex Sans', Inter, system-ui, sans-serif",
    fontWeight: '600',
  },
  // Slightly larger than Mantine's defaults: the screens are read at arm's length.
  fontSizes: {
    xs: '0.8125rem',
    sm: '0.9375rem',
    md: '1.0625rem',
    lg: '1.25rem',
    xl: '1.5rem',
  },
  radius: { xs: '4px', sm: '6px', md: '10px', lg: '14px', xl: '20px' },
  defaultRadius: 'md',
  components: {
    // Pill buttons at 42px+ so every target is comfortable to tap.
    Button: Button.extend({ defaultProps: { radius: 'xl', size: 'md' } }),
    Badge: Badge.extend({
      defaultProps: { variant: 'light', radius: 'xl', size: 'md' },
      styles: { root: { textTransform: 'none', fontWeight: 600 } },
    }),
    Paper: Paper.extend({ defaultProps: { withBorder: true, radius: 'lg' } }),
    // Notifications get a named close button (Mantine's has no accessible name).
    Notification: Notification.extend({ defaultProps: { closeButtonProps: { 'aria-label': 'Dismiss' } } }),
    Modal: Modal.extend({ defaultProps: { radius: 'xl', centered: true, padding: 'xl' } }),
  },
});

/** Page background and borders in the same slate tones as the wireframes. */
export const cssVariablesResolver: CSSVariablesResolver = () => ({
  variables: {},
  light: {
    '--mantine-color-body': '#f8fafc',
    // Mantine's "dimmed" gray is below 4.5:1 on white; use the app's muted ink.
    '--mantine-color-dimmed': '#45474e',
    '--mantine-color-default-border': '#e3e7ee',
  },
  dark: {},
});
