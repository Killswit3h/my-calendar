import { createTheme, responsiveFontSizes, type Theme } from '@mui/material/styles'

export type Accent = 'forest' | 'blue' | 'gray'

const ACCENTS: Record<
  Accent,
  {
    primary: string
    primaryDark: string
    secondary: string
    accent: string
  }
> = {
  forest: {
    primary: '#2F6E3D',
    primaryDark: '#244F2E',
    secondary: '#9ADBA9',
    accent: '#4FAD64',
  },
  blue: {
    primary: '#1565C0',
    primaryDark: '#0B3B73',
    secondary: '#90CAF9',
    accent: '#5E92F3',
  },
  gray: {
    primary: '#546E7A',
    primaryDark: '#29404A',
    secondary: '#B0BEC5',
    accent: '#90A4AE',
  },
}

const LIGHT_COMMON = {
  background: {
    default: '#F7F9F7',
    paper: '#FFFFFF',
  },
  text: {
    primary: '#0f1d13',
    secondary: '#4C6252',
  },
}

const DARK_COMMON = {
  background: {
    default: '#0c1510',
    paper: '#131F16',
  },
  text: {
    primary: '#F0F5F1',
    secondary: '#9AB6A3',
  },
}

export function createAppTheme(accent: Accent, mode: 'light' | 'dark'): Theme {
  const tones = ACCENTS[accent]

  const base = createTheme({
    palette: {
      mode,
      primary: {
        main: tones.primary,
        light: tones.accent,
        dark: tones.primaryDark,
        contrastText: mode === 'light' ? '#F2FBF4' : '#0F1D13',
      },
      secondary: {
        main: tones.secondary,
      },
      success: {
        main: '#2E8F55',
      },
      warning: {
        main: '#B06F00',
      },
      error: {
        main: '#C73C3C',
      },
      background: mode === 'light' ? LIGHT_COMMON.background : DARK_COMMON.background,
      text: mode === 'light' ? LIGHT_COMMON.text : DARK_COMMON.text,
    },
    shape: {
      borderRadius: 18,
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
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
            borderRadius: 999,
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
      MuiAppBar: {
        styleOverrides: {
          root: {
            backdropFilter: 'blur(16px)',
            backgroundColor: mode === 'light' ? 'rgba(255,255,255,0.72)' : 'rgba(19,31,22,0.8)',
          },
        },
      },
    },
  })

  return responsiveFontSizes(base)
}

export const ACCENT_PRESETS: { label: string; value: Accent }[] = [
  { label: 'GFC Green', value: 'forest' },
  { label: 'Ocean Blue', value: 'blue' },
  { label: 'Steel Gray', value: 'gray' },
]
