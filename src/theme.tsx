import { createTheme, ThemeOptions } from '@mui/material/styles';
import { PaletteColorOptions } from '@mui/material';

export type Accent = 'forest' | 'blue' | 'gray';

const ACCENTS: Record<Accent, { primary: string; primaryContainer: string; secondary: string; tertiary: string }> = {
  forest: {
    primary: '#1B5E20',
    primaryContainer: '#0D2B12',
    secondary: '#2E7D32',
    tertiary: '#4CAF50',
  },
  blue: {
    primary: '#0D47A1',
    primaryContainer: '#082567',
    secondary: '#1976D2',
    tertiary: '#64B5F6',
  },
  gray: {
    primary: '#37474F',
    primaryContainer: '#1C2529',
    secondary: '#607D8B',
    tertiary: '#B0BEC5',
  },
};

export function createAppTheme(accent: Accent) {
  const tones = ACCENTS[accent];
  const options: ThemeOptions = {
    palette: {
      mode: 'dark',
      primary: {
        main: tones.primary,
        contrastText: '#FFFFFF',
      },
      secondary: {
        main: tones.secondary,
      },
      error: {
        main: '#B3261E',
      },
      background: {
        default: '#1B1B1F',
        paper: '#1F1F1F',
      },
      divider: '#2C2C2C',
    },
    shape: {
      borderRadius: 8,
    },
    typography: {
      // Using Material 3 typographic names if available
      // Fallback to defaults otherwise
      fontFamily: 'Roboto, sans-serif',
    },
  };
  // Cast to any to allow additional M3 tokens like primaryContainer
  (options.palette as any).primaryContainer = tones.primaryContainer;
  (options.palette as any).tertiary = { main: tones.tertiary } as PaletteColorOptions;
  return createTheme(options);
}

export const ACCENT_PRESETS: { label: string; value: Accent }[] = [
  { label: 'Forest Green', value: 'forest' },
  { label: 'Blue', value: 'blue' },
  { label: 'Gray', value: 'gray' },
];
