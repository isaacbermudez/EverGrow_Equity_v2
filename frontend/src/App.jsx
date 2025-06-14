// src/App.jsx
import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  AppBar,
  Toolbar,
  CssBaseline,
  ThemeProvider,
  createTheme,
  Paper,
} from '@mui/material';
import { BrowserRouter, Routes, Route } from 'react-router-dom'; // Fixed this line
import Sidebar from './components/Sidebar';
import HomeContent from './components/HomeContent';
import NewsSection from './components/NewsSection';
import { teal, blueGrey } from '@mui/material/colors';

const drawerWidth = 240;

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: teal[400],
    },
    secondary: {
      main: blueGrey[300],
    },
    background: {
      default: '#121212',
      paper: '#1E1E1E',
    },
    text: {
      primary: '#E0E0E0',
      secondary: blueGrey[200],
    },
  },
  typography: {
    fontFamily: ['"Roboto"', 'sans-serif'].join(','),
    h3: {
      fontWeight: 600,
      fontSize: '2.5rem',
      marginBottom: '1rem',
      color: teal[200],
    },
    h4: {
      fontWeight: 500,
      fontSize: '1.8rem',
      marginBottom: '0.8rem',
      color: teal[300],
    },
    subtitle1: {
      fontSize: '1.1rem',
      color: blueGrey[300],
    },
    h5: {
      fontWeight: 400,
      fontSize: '1.25rem',
      color: blueGrey[300],
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          height: '100%',
        },
        body: {
          height: '100%',
          backgroundColor: '#121212',
        },
        '#root': {
          height: '100%',
          width: '100%',
          minHeight: '100vh',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        colorPrimary: {
          backgroundColor: teal[700],
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.2)',
        },
      },
    },
  },
});

export default function App() {
  const [data, setData] = useState([]);
  const [remaining, setRemaining] = useState(null);

  const handleAssets = async (assets) => {
    try {
      const res = await fetch('/api/analyze-portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assets),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to analyze portfolio data.');
      }
      setData(json.results || []);
      setRemaining(json.remaining);
    } catch (e) {
      console.error("Error in handleAssets:", e);
      alert(e.message);
      setData([]);
      setRemaining(null);
      throw e;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
          <AppBar
            position="fixed"
            elevation={0}
            sx={{
              backgroundColor: teal[700],
              zIndex: (theme) => theme.zIndex.drawer + 1,
              width: `calc(100% - ${drawerWidth}px)`,
              ml: `${drawerWidth}px`,
            }}
          >
            <Toolbar>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: 'white' }}>
                EverGrow Portfolio
              </Typography>
            </Toolbar>
          </AppBar>

          <Sidebar />

          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: 3,
              ml: `${drawerWidth}px`,
              width: `calc(100% - ${drawerWidth}px)`,
              mt: '64px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Toolbar />
            <Routes>
              <Route
                path="/"
                element={<HomeContent data={data} handleAssets={handleAssets} />}
              />
              <Route
                path="/news"
                element={<NewsSection portfolioData={data} />}
              />
            </Routes>
          </Box>
        </Box>
      </BrowserRouter>‰
    </ThemeProvider>
  );
}