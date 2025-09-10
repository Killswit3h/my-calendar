"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { createAppTheme, type Accent } from "../theme";

interface AccentCtx {
  accent: Accent;
  setAccent: (a: Accent) => void;
}

const AccentColorContext = createContext<AccentCtx>({ accent: "forest", setAccent: () => {} });

export function useAccentColor() {
  return useContext(AccentColorContext);
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [accent, setAccent] = useState<Accent>("forest");

  useEffect(() => {
    const stored = window.localStorage.getItem("accent-color");
    if (stored === "forest" || stored === "blue" || stored === "gray") {
      setAccent(stored);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("accent-color", accent);
  }, [accent]);

  const theme = useMemo(() => createAppTheme(accent), [accent]);

  return (
    <AccentColorContext.Provider value={{ accent, setAccent }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AccentColorContext.Provider>
  );
}
