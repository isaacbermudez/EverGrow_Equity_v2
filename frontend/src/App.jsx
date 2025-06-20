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
                element={<TransactionsSection transactions={transactions} />}
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
