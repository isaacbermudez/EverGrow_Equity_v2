// src/App.jsx
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  // AppBar, // Removed AppBar as its content is moving
  // Toolbar, // Removed Toolbar as its content is moving
  CssBaseline,
  ThemeProvider,
  createTheme,
  Paper,
  Chip,
  IconButton,
  Button,
  Alert
} from '@mui/material';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import HomeContent from './components/HomeContent';
import NewsSection from './components/NewsSection';
import FinancialsSection from './components/FinancialsSection';
import FileUpload from './components/FileUpload'; // Still needed as it's passed to Sidebar
import WealthSection from './components/WealthSection';
import ChatWidget from './components/ChatWidget'; // <--- NEW: Import ChatWidget

import { teal, blueGrey } from '@mui/material/colors';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import RefreshIcon from '@mui/icons-material/Refresh';
import ClearIcon from '@mui/icons-material/Clear';

// Standardize drawerWidth
const drawerWidth = 240; // Using 240px from App.jsx as standard

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
  const [portfolioData, setPortfolioData] = useState(() => {
    try {
      const storedData = localStorage.getItem('portfolioAnalysisData');
      return storedData ? JSON.parse(storedData) : [];
    } catch (e) {
      console.error("Failed to parse portfolio data from localStorage", e);
      return [];
    }
  });

  const [uploadedAssets, setUploadedAssets] = useState(() => {
    try {
      const storedAssets = localStorage.getItem('uploadedPortfolioAssets');
      return storedAssets ? JSON.parse(storedAssets) : [];
    } catch (e) {
      console.error("Failed to parse uploaded assets from localStorage", e);
      return [];
    }
  });

  const [isDataLoaded, setIsDataLoaded] = useState(portfolioData.length > 0);

  useEffect(() => {
    localStorage.setItem('portfolioAnalysisData', JSON.stringify(portfolioData));
    localStorage.setItem('uploadedPortfolioAssets', JSON.stringify(uploadedAssets));
    setIsDataLoaded(portfolioData.length > 0);
  }, [portfolioData, uploadedAssets]);


  const handleAssets = async (assets) => {
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
      setPortfolioData(json.results || []);
    } catch (e) {
      console.error("Error in handleAssets:", e);
      alert(e.message); // In a real app, you'd show a more user-friendly error message
      setPortfolioData([]);
      setUploadedAssets([]);
      throw e;
    }
  };

  const handleClearData = () => {
    localStorage.removeItem('portfolioAnalysisData');
    localStorage.removeItem('uploadedPortfolioAssets');
    setPortfolioData([]);
    setUploadedAssets([]);
    setIsDataLoaded(false);
  };

  const handleRefreshData = async () => {
    if (uploadedAssets.length > 0) {
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
          {/* The AppBar that was here has been removed as its content is moving to Sidebar */}

          <Sidebar
            drawerWidth={drawerWidth} // Pass drawerWidth for consistency
            isDataLoaded={isDataLoaded}
            onUploadAssets={handleAssets} // Renamed for clarity as a prop
            onClearData={handleClearData} // Renamed for clarity as a prop
            onRefreshData={handleRefreshData} // Renamed for clarity as a prop
            // uploadedAssets is not directly used by Sidebar's UI, only handleAssets needs it internally
            FileUploadComponent={FileUpload} // Pass the FileUpload component itself
          />

          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: 3,
              ml: `${drawerWidth}px`, // Maintains space for the sidebar
              width: `calc(100% - ${drawerWidth}px)`,
              // mt: '64px', // Removed as there's no fixed AppBar at the top pushing content down
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            {/* <Toolbar /> Removed this placeholder Toolbar as the App Bar is gone */}

            <Routes>
              <Route
                path="/"
                element={<HomeContent data={portfolioData} handleAssets={handleAssets} />}
              />
              <Route
                path="/news"
                element={<NewsSection portfolioData={portfolioData} />}
              />
              <Route
                path="/financials"
                element={<FinancialsSection portfolioData={portfolioData} />}
              />
              <Route
                path="/wealth"
                element={<WealthSection portfolioData={portfolioData} />}
              />
            </Routes>
          </Box>
        </Box>
        <ChatWidget /> {/* <--- NEW: Add the ChatWidget here */}
      </BrowserRouter>
    </ThemeProvider>
  );
}