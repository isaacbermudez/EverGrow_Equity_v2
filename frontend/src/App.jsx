// src/App.jsx
import React, { useState, useEffect } from 'react'; // Added useEffect
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
  Chip,
  IconButton, // Added IconButton for the Reset/Refresh
  Button, // Added Button for the Reset/Refresh
  Alert // Added Alert for feedback
} from '@mui/material';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import HomeContent from './components/HomeContent';
import NewsSection from './components/NewsSection';
import FileUpload from './components/FileUpload'; // Import FileUpload component
import { teal, blueGrey } from '@mui/material/colors';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import RefreshIcon from '@mui/icons-material/Refresh';
import ClearIcon from '@mui/icons-material/Clear';
const drawerWidth = 240;

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: teal[900],
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
      color: teal[900],
    },
    h4: {
      fontWeight: 500,
      fontSize: '1.8rem',
      marginBottom: '0.8rem',
      color: teal[900],
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
          backgroundColor: teal[900],
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
  // Initialize state from localStorage or default to empty
  const [portfolioData, setPortfolioData] = useState(() => {
    try {
      const storedData = localStorage.getItem('portfolioAnalysisData');
      return storedData ? JSON.parse(storedData) : [];
    } catch (e) {
      console.error("Failed to parse portfolio data from localStorage", e);
      return [];
    }
  });

  // Keep track of the raw uploaded assets for potential future re-analysis if needed
  const [uploadedAssets, setUploadedAssets] = useState(() => {
    try {
      const storedAssets = localStorage.getItem('uploadedPortfolioAssets');
      return storedAssets ? JSON.parse(storedAssets) : [];
    } catch (e) {
      console.error("Failed to parse uploaded assets from localStorage", e);
      return [];
    }
  });

  // This state will control whether the FileUpload component is active or disabled
  const [isDataLoaded, setIsDataLoaded] = useState(portfolioData.length > 0);

  // Effect to save data to localStorage whenever portfolioData or uploadedAssets changes
  useEffect(() => {
    localStorage.setItem('portfolioAnalysisData', JSON.stringify(portfolioData));
    localStorage.setItem('uploadedPortfolioAssets', JSON.stringify(uploadedAssets));
    setIsDataLoaded(portfolioData.length > 0); // Update isDataLoaded status
  }, [portfolioData, uploadedAssets]);


  const handleAssets = async (assets) => {
    // Save the raw assets received from FileUpload for persistence
    setUploadedAssets(assets);

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
      setPortfolioData(json.results || []); // Update the analyzed data
    } catch (e) {
      console.error("Error in handleAssets:", e);
      alert(e.message);
      setPortfolioData([]); // Clear data on error
      setUploadedAssets([]); // Also clear raw assets on error
      throw e; // Re-throw to propagate error to FileUpload component
    }
  };

  const handleClearData = () => {
    localStorage.removeItem('portfolioAnalysisData');
    localStorage.removeItem('uploadedPortfolioAssets');
    setPortfolioData([]);
    setUploadedAssets([]);
    setIsDataLoaded(false); // Enable upload again
  };

  const handleRefreshData = async () => {
    if (uploadedAssets.length > 0) {
      // Re-run analysis with the stored uploaded assets
      // This will trigger the API call again and update localStorage via useEffect
      await handleAssets(uploadedAssets);
    } else {
      alert("No previously uploaded data to refresh.");
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
              backgroundColor: teal[900],
              zIndex: (theme) => theme.zIndex.drawer + 1,
              width: `calc(100% - ${drawerWidth}px)`,
              ml: `${drawerWidth}px`,
            }}
          >
            <Toolbar sx={{ minHeight: '64px !important', gap: 2 }}>
              <Chip
                icon={isDataLoaded ? <CheckCircleIcon /> : <CloudUploadIcon />}
                label={isDataLoaded ? "Loaded" : "Upload JSON"}
                onClick={() => !isDataLoaded && document.getElementById('file-input').click()}
                sx={{
                  backgroundColor: teal[900],
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.2)',
                  '&:hover': !isDataLoaded && {
                    backgroundColor: teal[900],
                  },
                  cursor: isDataLoaded ? 'default' : 'pointer'
                }}
              />
              <FileUpload onUpload={handleAssets} disabled={isDataLoaded} hidden />

              {isDataLoaded && (
                <>
                  <IconButton onClick={handleRefreshData} sx={{ color: 'white' }}>
                    <RefreshIcon />
                  </IconButton>
                  <IconButton onClick={handleClearData} sx={{ color: 'white' }}>
                    <ClearIcon />
                  </IconButton>
                </>
              )}
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
            <Toolbar /> {/* This is important to push content below the fixed AppBar */}

            <Routes>
              <Route
                path="/"
                element={<HomeContent data={portfolioData} handleAssets={handleAssets} />}
              />
              <Route
                path="/news"
                element={<NewsSection portfolioData={portfolioData} />}
              />
            </Routes>
          </Box>
        </Box>
      </BrowserRouter>
    </ThemeProvider>
  );
}