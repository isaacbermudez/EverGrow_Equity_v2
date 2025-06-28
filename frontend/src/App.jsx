// src/App.jsx
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
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
import TransactionsSection from './components/TransactionsSection';
import WealthSection from './components/WealthSection';
import ChatWidget from './components/ChatWidget';

import { teal, blueGrey } from '@mui/material/colors';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import RefreshIcon from '@mui/icons-material/Refresh';
import ClearIcon from '@mui/icons-material/Clear';

// Standardize drawerWidth
const drawerWidth = 200;

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00BCD4', // Cyan 500
      light: '#4DD0E1',
      dark: '#0097A7',
    },
    secondary: {
      main: '#9C27B0', // Purple 500
      light: '#BA68C8',
      dark: '#7B1FA2',
    },
    background: {
      default: '#0A0A0B',
      paper: '#1A1A1D',
    },
    surface: {
      main: '#2D2D30',
      light: '#3E3E42',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#B0BEC5',
      disabled: '#6B7280',
    },
    divider: 'rgba(255, 255, 255, 0.08)',
    success: {
      main: '#10B981',
      light: '#34D399',
      dark: '#047857',
    },
    warning: {
      main: '#F59E0B',
      light: '#FCD34D',
      dark: '#D97706',
    },
    error: {
      main: '#EF4444',
      light: '#F87171',
      dark: '#DC2626',
    },
  },
  typography: {
    fontFamily: ['"Inter"', '"Roboto"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'].join(','),
    h1: {
      fontWeight: 700,
      fontSize: '3.5rem',
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontWeight: 600,
      fontSize: '2.75rem',
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontWeight: 600,
      fontSize: '2.25rem',
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
      marginBottom: '1.5rem',
    },
    h4: {
      fontWeight: 500,
      fontSize: '1.75rem',
      lineHeight: 1.4,
      marginBottom: '1rem',
    },
    h5: {
      fontWeight: 500,
      fontSize: '1.25rem',
      lineHeight: 1.4,
      color: '#B0BEC5',
    },
    h6: {
      fontWeight: 500,
      fontSize: '1rem',
      lineHeight: 1.4,
    },
    subtitle1: {
      fontSize: '1.125rem',
      lineHeight: 1.5,
      color: '#B0BEC5',
      fontWeight: 400,
    },
    subtitle2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
      color: '#9CA3AF',
      fontWeight: 500,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      color: '#E5E7EB',
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
      color: '#D1D5DB',
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.4,
      color: '#9CA3AF',
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0px 1px 3px rgba(0, 0, 0, 0.12), 0px 1px 2px rgba(0, 0, 0, 0.24)',
    '0px 3px 6px rgba(0, 0, 0, 0.16), 0px 3px 6px rgba(0, 0, 0, 0.23)',
    '0px 10px 20px rgba(0, 0, 0, 0.19), 0px 6px 6px rgba(0, 0, 0, 0.23)',
    '0px 14px 28px rgba(0, 0, 0, 0.25), 0px 10px 10px rgba(0, 0, 0, 0.22)',
    '0px 19px 38px rgba(0, 0, 0, 0.30), 0px 15px 12px rgba(0, 0, 0, 0.22)',
    '0px 24px 48px rgba(0, 0, 0, 0.35), 0px 19px 15px rgba(0, 0, 0, 0.22)',
    '0px 30px 60px rgba(0, 0, 0, 0.40), 0px 24px 18px rgba(0, 0, 0, 0.22)',
    '0px 36px 72px rgba(0, 0, 0, 0.45), 0px 28px 21px rgba(0, 0, 0, 0.22)',
    '0px 42px 84px rgba(0, 0, 0, 0.50), 0px 33px 24px rgba(0, 0, 0, 0.22)',
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '*': {
          boxSizing: 'border-box',
        },
        html: {
          height: '100%',
          scrollBehavior: 'smooth',
        },
        body: {
          height: '100%',
          backgroundColor: '#0A0A0B',
          background: 'linear-gradient(135deg, #0A0A0B 0%, #1A1A1D 100%)',
          backgroundAttachment: 'fixed',
          margin: 0,
          padding: 0,
          fontFeatureSettings: '"kern" 1, "liga" 1, "calt" 1',
          textRendering: 'optimizeLegibility',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
        '#root': {
          height: '100%',
          width: '100%',
          minHeight: '100vh',
        },
        '::-webkit-scrollbar': {
          width: '8px',
        },
        '::-webkit-scrollbar-track': {
          backgroundColor: '#1A1A1D',
        },
        '::-webkit-scrollbar-thumb': {
          backgroundColor: '#2D2D30',
          borderRadius: '4px',
          '&:hover': {
            backgroundColor: '#3E3E42',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '8px',
          fontWeight: 500,
          fontSize: '0.875rem',
          padding: '10px 20px',
          boxShadow: 'none',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: '0px 4px 12px rgba(0, 188, 212, 0.3)',
            transform: 'translateY(-1px)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #00BCD4 0%, #0097A7 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #4DD0E1 0%, #00BCD4 100%)',
          },
        },
        outlined: {
          borderColor: 'rgba(0, 188, 212, 0.5)',
          color: '#00BCD4',
          '&:hover': {
            borderColor: '#00BCD4',
            backgroundColor: 'rgba(0, 188, 212, 0.08)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          backgroundImage: 'none',
          backgroundColor: '#1A1A1D',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.3), 0px 4px 16px rgba(0, 0, 0, 0.2)',
          backdropFilter: 'blur(20px)',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0px 12px 40px rgba(0, 0, 0, 0.4), 0px 8px 20px rgba(0, 0, 0, 0.25)',
          },
        },
        elevation1: {
          boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.15)',
        },
        elevation2: {
          boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.2)',
        },
        elevation3: {
          boxShadow: '0px 12px 32px rgba(0, 0, 0, 0.25)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '20px',
          background: 'linear-gradient(135deg, #1A1A1D 0%, #2D2D30 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          overflow: 'hidden',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(0, 188, 212, 0.5), transparent)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(26, 26, 29, 0.8)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#1A1A1D',
          borderRight: '1px solid rgba(255, 255, 255, 0.05)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            '& fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.1)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(0, 188, 212, 0.5)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#00BCD4',
              boxShadow: '0px 0px 0px 3px rgba(0, 188, 212, 0.1)',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          backgroundColor: 'rgba(0, 188, 212, 0.1)',
          color: '#4DD0E1',
          border: '1px solid rgba(0, 188, 212, 0.2)',
          fontWeight: 500,
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(255, 255, 255, 0.06)',
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

  // State for RAW transactions data (from backend's json.transactions)
  const [transactions, setTransactions] = useState(() => {
    try {
      const storedTransactions = localStorage.getItem('portfolioTransactions');
      return storedTransactions ? JSON.parse(storedTransactions) : [];
    } catch (e) {
      console.error("Failed to parse portfolioTransactions from localStorage", e);
      return [];
    }
  });

  // State for RAW deposits data (from backend's json.deposits)
  const [deposits, setDeposits] = useState(() => {
    try {
      const storedDeposits = localStorage.getItem('portfolioDeposits');
      return storedDeposits ? JSON.parse(storedDeposits) : [];
    } catch (e) {
      console.error("Failed to parse portfolioDeposits from localStorage", e);
      return [];
    }
  });


  const [isDataLoaded, setIsDataLoaded] = useState(portfolioData.length > 0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem('portfolioAnalysisData', JSON.stringify(portfolioData));
    localStorage.setItem('uploadedPortfolioAssets', JSON.stringify(uploadedAssets));
    localStorage.setItem('portfolioTransactions', JSON.stringify(transactions));
    localStorage.setItem('portfolioDeposits', JSON.stringify(deposits));
    setIsDataLoaded(portfolioData.length > 0);
  }, [portfolioData, uploadedAssets]);


  // IMPORTANT: handleAssets now expects the FULL data object parsed from the JSON file
  const handleAssets = async (fullData) => {
    setIsLoading(true);

    // Construct the payload as expected by the backend
    const payloadToSend = {
      Assets: fullData.Assets || [],
      Transactions: fullData.Transactions || [],
      Deposits: fullData.Deposits || []
    };

    // Update the local state with just the assets part, as it's used for display
    setUploadedAssets(payloadToSend.Assets);

    try {
      const res = await fetch('/api/analyze-portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadToSend), // Stringify the FULL payload object
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to analyze portfolio data.');
      }
      // Backend now returns 'asset_results'
      setPortfolioData(json.asset_results || []);
      setTransactions(json.transactions || []);   // Backend returns RAW transactions
      setDeposits(json.deposits || []);           // Backend returns RAW deposits
    } catch (e) {
      console.error("Error in handleAssets:", e);
      alert(e.message);
      setPortfolioData([]);
      setUploadedAssets([]);
      setTransactions([]);
      setDeposits([]);

    } finally {
      setIsLoading(false);
    }
  };

  const handleClearData = () => {
    localStorage.removeItem('portfolioAnalysisData');
    localStorage.removeItem('uploadedPortfolioAssets');
    localStorage.removeItem('portfolioTransactions');
    localStorage.removeItem('portfolioDeposits');
    localStorage.removeItem('portfolioNewsCache');
    setPortfolioData([]);
    setUploadedAssets([]);
    setTransactions([]);
    setDeposits([]);
    setIsDataLoaded(false);
  };

  const handleRefreshData = async () => {
    if (uploadedAssets.length > 0) {
      const currentFullDataForRefresh = {
        Assets: uploadedAssets,
        Transactions: transactions,
        Deposits: deposits
      };
      await handleAssets(currentFullDataForRefresh);
    } else {
      alert("No previously uploaded data to refresh.");
    }
  };


  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
          <Sidebar
            drawerWidth={drawerWidth}
            isDataLoaded={isDataLoaded}
            onUploadAssets={handleAssets} // This prop needs to pass the full JSON object
            onClearData={handleClearData}
            onRefreshData={handleRefreshData}
            isLoading={isLoading}
            assets={portfolioData}
          />

          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: 3,
              display: 'flex',
            }}
          >
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
                path="/transactions"
                element={<TransactionsSection transactions={transactions} deposits={deposits} />}
              />
              <Route
                path="/wealth"
                element={<WealthSection portfolioData={portfolioData} />}
              />
            </Routes>
          </Box>
        </Box>
        <ChatWidget />
      </BrowserRouter>
    </ThemeProvider>
  );
}
