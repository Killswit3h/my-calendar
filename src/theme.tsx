import { createTheme, ThemeOptions } from '@mui/material/styles';
import { PaletteColorOptions } from '@mui/material';

export type Accent = 'forest' | 'blue' | 'gray';

const ACCENTS: Record<
  Accent,
  {
    primary: string;
    primaryContainer: string;
    secondary: string;
    tertiary: string;
  }
> = {
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
        contrastText: '#FFFFFF', // on primary
      },
      secondary: {
        main: tones.secondary,
      },
      error: {
        main: '#B3261E',
      },
      background: {
        // M3 dark surfaces
        default: '#1B1B1F', // surface
        paper: '#1F1F1F', // surfaceContainerLow
      },
      divider: '#2C2C2C',
    },
    shape: {
      borderRadius: 8,
    },
    typography: {
      fontFamily: 'Roboto, sans-serif',
    },
  };

  // Add M3 custom palette tokens
  const palette = options.palette as any;
  palette.primaryContainer = tones.primaryContainer;
  palette.tertiary = { main: tones.tertiary } as PaletteColorOptions;
  palette.surface = '#1B1B1F';
  palette.surfaceContainerLow = '#1F1F1F';
  palette.outline = '#939094';
  palette.outlineVariant = '#46464F';

  return createTheme(options);
}

export const ACCENT_PRESETS: { label: string; value: Accent }[] = [
  { label: 'Forest Green', value: 'forest' },
  { label: 'Blue', value: 'blue' },
  { label: 'Gray', value: 'gray' },
];
