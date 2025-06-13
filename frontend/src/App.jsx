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
import FileUpload from './components/FileUpload';
import PortfolioDashboard from './components/PortfolioDashboard';
import { teal, blueGrey } from '@mui/material/colors';

// Define a custom theme for a modern dark look
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
      default: '#121212', // This is your desired overall background color
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
          backgroundColor: '#121212', // Ensures the body itself is dark
          // REMOVED flex properties from body to avoid potential conflicts
          // display: 'flex',
          // flexDirection: 'column',
          // alignItems: 'center',
        },
        '#root': {
          height: '100%',
          width: '100%',
          minHeight: '100vh', // Ensure #root always takes full viewport height
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

      {/* NEW: Outer Box to ensure consistent background and full height for the entire app */}
      {/* This Box will apply the default background color and handle the main centering */}
      <Box
        sx={{
          bgcolor: 'background.default', // Use theme's default background color for consistency
          minHeight: '100vh', // Ensure it covers the full viewport height
          display: 'flex', // Use flexbox here to center the AppBar and Container
          flexDirection: 'column',
          alignItems: 'center', // Center content horizontally within this Box
          width: '100%', // Ensure it takes full width
        }}
      >
        <AppBar
          position="static"
          elevation={0}
          sx={{
            backgroundColor: teal[700],
            width: '100%',
            maxWidth: 'xl', // Changed to 'xl' for consistency with main container
            mx: 'auto',
            mb: 4,
          }}
        >
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: 'white'}}>
              EverGrow Portfolio
            </Typography>
            {/*{remaining !== null && (
              <Typography variant="subtitle1" sx={{ color: 'white' }}>
                API Requests Remaining: <strong>{remaining}</strong>
              </Typography>
            )}*/}
          </Toolbar>
        </AppBar>

        <Container
          maxWidth="xl" // This is correctly set to 'xl'
          sx={{
            mt: 0,
            mb: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            mx: 'auto',
            flexGrow: 1, // Allows this container to expand vertically if needed
          }}
        >
          {/* The Upload Assets Paper can remain at maxWidth: 400 for a consistent look */}
          <Paper elevation={3} sx={{ p: 3, mb: 4, width: '100%', maxWidth: 400 }}>
            <FileUpload onUpload={handleAssets} />
          </Paper>

          {/* Removed maxWidth: 800 from this Paper component */}
          <Paper elevation={3} sx={{ p: 3, width: '100%' }}>
            <PortfolioDashboard rows={data} />
          </Paper>
          
        </Container>
      </Box>
    </ThemeProvider>
  );
}