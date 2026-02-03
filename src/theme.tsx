import { extendTheme } from '@mui/material/styles';

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
  const options = {
    colorSchemes: {
      dark: {
        palette: {
          mode: 'dark',
          primary: {
            main: tones.primary,
            light: tones.primary,
            dark: tones.primaryContainer,
          },
          secondary: {
            main: tones.secondary,
          },
          tertiary: {
            main: tones.tertiary,
          },
          error: {
            main: '#F2B8B5',
            dark: '#B3261E',
          },
          background: {
            default: '#101418',
            paper: '#141A1F',
          },
          surface: '#141A1F',
          surfaceContainer: '#1A1F24',
          surfaceContainerHigh: '#1F2429',
          outline: '#8E9199',
        },
      },
    },
    shape: {
      borderRadius: 16,
    },
    typography: {
      fontFamily: '"Roboto Flex", "Roboto", "Helvetica", "Arial", sans-serif',
      button: {
        textTransform: 'none',
        fontWeight: 600,
        letterSpacing: 0.2,
      },
      h6: {
        fontWeight: 600,
        letterSpacing: 0.15,
      },
    },
    components: {
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            borderRadius: 18,
            paddingInline: '1.2rem',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 20,
            backgroundImage: 'none',
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 24,
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          indicator: {
            borderRadius: 999,
            height: 3,
          },
        },
      },
    },
  };

  return extendTheme(options as any);
}

export const ACCENT_PRESETS: { label: string; value: Accent }[] = [
  { label: 'Forest Green', value: 'forest' },
  { label: 'Blue', value: 'blue' },
  { label: 'Gray', value: 'gray' },
];
