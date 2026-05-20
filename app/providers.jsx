"use client";

import { useMemo } from "react";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider, createTheme } from "@mui/material/styles";

export default function Providers({ children }) {
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: "dark",
          background: {
            default: "#080A0F",
            paper: "#11141C",
          },
          primary: {
            main: "#F2C14E",
            contrastText: "#080A0F",
          },
          secondary: {
            main: "#C58B2B",
            contrastText: "#080A0F",
          },
          text: {
            primary: "#F5F7FA",
            secondary: "#AEB7C5",
          },
          divider: "rgba(242, 193, 78, 0.16)",
        },
        typography: {
          fontFamily:
            'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          button: {
            fontWeight: 760,
          },
        },
        shape: {
          borderRadius: 9,
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 7,
                textTransform: "none",
                boxShadow: "none",
              },
              containedPrimary: {
                color: "#080A0F",
                backgroundColor: "#F2C14E",
                border: "1px solid rgba(255, 211, 90, 0.78)",
                "&:hover": {
                  backgroundColor: "#FFD35A",
                  boxShadow: "0 12px 36px rgba(242, 193, 78, 0.18)",
                },
              },
              outlinedPrimary: {
                color: "#F2C14E",
                borderColor: "rgba(242, 193, 78, 0.48)",
                backgroundColor: "rgba(242, 193, 78, 0.045)",
                "&:hover": {
                  borderColor: "rgba(255, 211, 90, 0.86)",
                  backgroundColor: "rgba(242, 193, 78, 0.12)",
                },
              },
              sizeLarge: {
                padding: "10px 18px",
              },
            },
          },
          MuiChip: {
            styleOverrides: {
              root: {
                borderRadius: 7,
                fontWeight: 740,
              },
            },
          },
          MuiTextField: {
            styleOverrides: {
              root: {
                "& .MuiOutlinedInput-root": {
                  borderRadius: 7,
                  background: "rgba(255, 255, 255, 0.035)",
                },
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                backgroundImage: "none",
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: "none",
              },
            },
          },
        },
      }),
    []
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
