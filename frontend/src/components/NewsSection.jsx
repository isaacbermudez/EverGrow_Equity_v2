// src/components/NewsSection.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
  Container,
  ListItemButton,
  Chip,
  Skeleton,
} from '@mui/material';
import { Zap } from 'lucide-react';
import { getDaysAgoDate } from '../utils/dateUtils';
import LinkIcon from '@mui/icons-material/Link';
import ImageNotSupportedIcon from '@mui/icons-material/ImageNotSupported';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { green, red } from '@mui/material/colors';

const LOCAL_STORAGE_PORTFOLIO_NEWS_CACHE = 'portfolioNewsCache'; // Single key for all news
const NEWS_CACHE_DURATION_HOURS = 1; // Cache news for 1 hour


// Helper: if not a number, fall back to 0
const safeNum = (n) => (typeof n === 'number' ? n : 0);

// Define the research websites and their base URLs
const researchSites = [
  { name: 'Bloomberg', baseUrl: 'https://www.bloomberg.com/search?query=' },
  { name: 'WSJ', baseUrl: 'https://www.wsj.com/market-data/quotes/', suffix: '?mod=searchresults_companyquotes&mod=md_usstk_hdr_search' },
  { name: 'Seeking Alpha', baseUrl: 'https://seekingalpha.com/symbol/' },
];

// Helper function to open all research links for a given symbol
const openResearchLinks = (symbol) => {
  researchSites.forEach(site => {
    const url = `${site.baseUrl}${symbol}${site.suffix || ''}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  });
};

// Format currency with better readability for large numbers
const formatCurrency = (amount) => {
  const absAmount = Math.abs(amount);
  if (absAmount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M`;
  } else if (absAmount >= 1000) {
    return `${(amount / 1000).toFixed(1)}K`;
  }
  return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

// Loading skeleton for winners/losers cards
const WinnersLosersLoadingSkeleton = () => (
  <Paper elevation={3} sx={{ p: 3, mb: 4, bgcolor: 'background.paper', borderRadius: 2 }}>
    <Skeleton variant="text" width="50%" height={40} sx={{ mx: 'auto', mb: 2 }} />
    <Grid container spacing={3}>
      {[0, 1].map((index) => (
        <Grid item xs={12} md={6} key={index}>
          <Paper sx={{ p: 2, minHeight: '200px' }}>
            <Skeleton variant="text" width="40%" height={32} sx={{ mx: 'auto', mb: 2 }} />
            {[...Array(3)].map((_, i) => (
              <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Skeleton variant="text" width="30%" />
                <Skeleton variant="text" width="25%" />
              </Box>
            ))}
          </Paper>
        </Grid>
      ))}
    </Grid>
  </Paper>
);

// Memoized Winners and Losers component
const WinnersLosersSection = React.memo(({ portfolioData, loading }) => {
  const { winners, losers } = useMemo(() => {
    if (!portfolioData || portfolioData.length === 0) {
      return { winners: [], losers: [] };
    }

    const sortedAssets = [...portfolioData]
      .map(asset => ({
        ...asset,
        // Use profitLoss if available, otherwise calculate from currentPrice and CI
        calculatedProfitLoss: asset.profitLoss ??
          (safeNum(asset.currentPrice) * safeNum(asset.holdings) - safeNum(asset.CI))
      }))
      .filter(asset => asset.calculatedProfitLoss !== 0 && asset.symbol)
      .sort((a, b) => b.calculatedProfitLoss - a.calculatedProfitLoss);

    const winners = sortedAssets.filter(asset => asset.calculatedProfitLoss > 0).slice(0, 5);
    const losers = sortedAssets
      .filter(asset => asset.calculatedProfitLoss < 0)
      .sort((a, b) => a.calculatedProfitLoss - b.calculatedProfitLoss)
      .slice(0, 5);

    return { winners, losers };
  }, [portfolioData]);

  const handleSymbolClick = useCallback((symbol) => {
    openResearchLinks(symbol);
  }, []);

  if (loading) {
    return <WinnersLosersLoadingSkeleton />;
  }

  if (!portfolioData || portfolioData.length === 0) {
    return null;
  }

  const renderAssetList = (assets, isWinners) => {
    const color = isWinners ? green[400] : red[400];
    const bgColor = isWinners ? 'rgba(0,196,159,0.05)' : 'rgba(255,99,132,0.05)';
    const borderColor = isWinners ? green[700] : red[700];
    const hoverColor = isWinners ? 'rgba(0,196,159,0.1)' : 'rgba(255,99,132,0.1)';
    const Icon = isWinners ? TrendingUpIcon : TrendingDownIcon;

    return (
      <Paper sx={{
        p: 2,
        bgcolor: bgColor,
        border: `1px solid ${borderColor}`,
        minHeight: '200px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
          <Icon sx={{ color, mr: 1 }} />
          <Typography variant="h6" sx={{ color }}>
            {isWinners ? 'Top Winners' : 'Top Losers'}
          </Typography>
        </Box>
        <List dense sx={{ flexGrow: 1, overflowY: 'auto' }}>
          {assets.length > 0 ? (
            assets.map((asset, index) => (
              <ListItemButton
                key={`${asset.symbol}-${isWinners ? 'winner' : 'loser'}-${index}`}
                onClick={() => handleSymbolClick(asset.symbol)}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  '&:hover': {
                    bgcolor: hoverColor,
                  },
                }}
              >
                <ListItemText
                  primary={
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body1" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
                        {asset.symbol}
                      </Typography>
                      <Typography variant="body2" sx={{ color, fontWeight: 'bold' }}>
                        {isWinners ? '+' : ''}{formatCurrency(asset.calculatedProfitLoss)}
                      </Typography>
                    </Box>
                  }
                />
              </ListItemButton>
            ))
          ) : (
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              minHeight: '120px'
            }}>
              <Typography variant="body2" color="text.secondary">
                {isWinners ? 'No winners yet!' : 'No losers yet!'}
              </Typography>
            </Box>
          )}
        </List>
      </Paper>
    );
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 4, bgcolor: 'background.paper', borderRadius: 2 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          {renderAssetList(winners, true)}
        </Grid>
        <Grid item xs={12} md={6}>
          {renderAssetList(losers, false)}
        </Grid>
      </Grid>
    </Paper>
  );
});

WinnersLosersSection.displayName = 'WinnersLosersSection';

// Memoized news item component
const NewsItem = React.memo(({ news, index, isLast }) => (
  <React.Fragment>
    <ListItem alignItems="flex-start" sx={{ mb: 1, px: 0 }}>
      <Box display="flex" flexDirection="column" width="100%">
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
          <Chip
            label={news.symbol}
            size="small"
            variant="outlined"
            sx={{ fontWeight: 'bold' }}
          />
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {new Date(news.datetime * 1000).toLocaleDateString()}
          </Typography>
        </Box>

        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem', mb: 1 }}>
          {news.source}
        </Typography>

        <Typography
          variant="body1"
          sx={{
            fontWeight: 'bold',
            color: 'primary.main',
            textDecoration: 'none',
            cursor: 'pointer',
            '&:hover': { textDecoration: 'underline' },
            mb: 1
          }}
          component="a"
          href={news.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {news.headline}
          <LinkIcon sx={{ fontSize: '0.8rem', verticalAlign: 'middle', ml: 0.5 }} />
        </Typography>

        {news.image && news.image !== '' ? (
          <Box
            component="img"
            src={news.image}
            alt={news.headline}
            sx={{
              maxWidth: '100%',
              maxHeight: '100px',
              objectFit: 'cover',
              borderRadius: 1,
              mb: 1,
            }}
            onError={(e) => {
              e.target.onerror = null;
              e.target.style.display = 'none';
            }}
            loading="lazy"
          />
        ) : (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '60px',
              bgcolor: 'background.paper',
              borderRadius: 1,
              mb: 1,
              border: '1px dashed',
              borderColor: 'divider'
            }}
          >
            <ImageNotSupportedIcon sx={{ color: 'text.disabled', fontSize: '1.5rem' }} />
          </Box>
        )}

        <Typography variant="body2" sx={{ color: 'text.primary' }}>
          {news.summary ?
            `${news.summary.substring(0, 200)}${news.summary.length > 200 ? '...' : ''}` :
            'No summary available.'
          }
        </Typography>
      </Box>
    </ListItem>
    {!isLast && <Divider component="li" sx={{ my: 2 }} />}
  </React.Fragment>
));

NewsItem.displayName = 'NewsItem';

// Memoized Latest News Card component
const LatestNewsCard = React.memo(({ newsItems, loading }) => (
  <Box sx={{ p: 2, mb: 2 }}>
    <Typography variant="h6" gutterBottom color="text.primary" sx={{ textAlign: 'center', fontWeight: 700 }}>
      Latest Portfolio News
    </Typography>
    {loading ? (
      <Box sx={{ flexGrow: 1 }}>
        {[...Array(3)].map((_, index) => (
          <Box key={index} sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Skeleton variant="rectangular" width={60} height={24} />
              <Skeleton variant="text" width={80} />
            </Box>
            <Skeleton variant="text" width="90%" height={24} />
            <Skeleton variant="text" width="100%" />
            <Skeleton variant="rectangular" width="100%" height={60} sx={{ mt: 1 }} />
          </Box>
        ))}
      </Box>
    ) : newsItems.length > 0 ? (
      <List sx={{ flexGrow: 1, overflowY: 'auto', px: 1 }}>
        {newsItems.map((news, index) => (
          <NewsItem
            key={news.id || `${news.symbol}-${index}`}
            news={news}
            index={index}
            isLast={index === newsItems.length - 1}
          />
        ))}
      </List>
    ) : (
      <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', py: 4 }}>
        <img src="/no-data.svg" alt="No positions" style={{ maxWidth: 160, opacity: 0.5, marginBottom: 16 }} />
        <Typography variant="body2" color="text.secondary">
          No news available for portfolio symbols.
        </Typography>
      </Box>
    )}
  </Box>
));

LatestNewsCard.displayName = 'LatestNewsCard';

// Main NewsSection Component - Reinstated as default export
export default function NewsSection({ portfolioData = [] }) {
  const [allLatestNews, setAllLatestNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Calculate winners and losers to pass to WinnersLosersSection and for news sorting
  const { winners, losers, winnerSymbols, loserSymbols } = useMemo(() => {
    if (!portfolioData || portfolioData.length === 0) {
      return { winners: [], losers: [], winnerSymbols: new Set(), loserSymbols: new Set() };
    }

    const sortedAssets = [...portfolioData]
      .map(asset => ({
        ...asset,
        calculatedProfitLoss: asset.profitLoss ??
          (safeNum(asset.currentPrice) * safeNum(asset.holdings) - safeNum(asset.CI))
      }))
      .filter(asset => asset.calculatedProfitLoss !== 0 && asset.symbol);

    const winners = sortedAssets.filter(asset => asset.calculatedProfitLoss > 0);
    const losers = sortedAssets.filter(asset => asset.calculatedProfitLoss < 0);

    return {
      winners,
      losers,
      winnerSymbols: new Set(winners.map(w => w.symbol)),
      loserSymbols: new Set(losers.map(l => l.symbol))
    };
  }, [portfolioData]);


  // Memoize relevant symbols to prevent unnecessary API calls
  const relevantSymbols = useMemo(() => {
    return [...new Set(
      portfolioData
        .filter(asset => {
          const profitLoss = asset.profitLoss ??
            (safeNum(asset.currentPrice) * safeNum(asset.holdings) - safeNum(asset.CI));
          return profitLoss !== 0 && asset.symbol;
        })
        .map(asset => asset.symbol)
    )];
  }, [portfolioData]);

  // --- LOCAL STORAGE HELPER FUNCTIONS ---

  // Loads the entire news cache object from local storage
  const loadPortfolioNewsCache = useCallback(() => {
    try {
      const storedData = localStorage.getItem(LOCAL_STORAGE_PORTFOLIO_NEWS_CACHE);
      if (storedData) {
        const cache = JSON.parse(storedData);
        const currentTime = Date.now();
        const freshCache = {};

        // Filter out stale news items
        for (const symbol in cache) {
          if (cache.hasOwnProperty(symbol)) {
            const { timestamp, newsItem } = cache[symbol];
            const ageHours = (currentTime - timestamp) / (1000 * 60 * 60);
            if (ageHours < NEWS_CACHE_DURATION_HOURS) {
              freshCache[symbol] = { timestamp, newsItem };
            } else {
              console.log(`News for ${symbol} in cache is stale.`);
            }
          }
        }
        return freshCache;
      }
    } catch (e) {
      console.error("Error loading portfolio news cache from local storage:", e);
      localStorage.removeItem(LOCAL_STORAGE_PORTFOLIO_NEWS_CACHE); // Clear potentially corrupted cache
    }
    return {}; // Return empty object if no data or error
  }, []);

  // Saves the entire news cache object to local storage
  const savePortfolioNewsCache = useCallback((cache) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_PORTFOLIO_NEWS_CACHE, JSON.stringify(cache));
    } catch (e) {
      console.error("Error saving portfolio news cache to local storage:", e);
    }
  }, []);

  // --- END LOCAL STORAGE HELPER FUNCTIONS ---


  const fetchNewsForSymbolAPI = useCallback(async (symbol) => {
    const fromDate = getDaysAgoDate(30);
    const toDate = getDaysAgoDate(0);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch(
        `/api/company-news?symbol=${symbol}&from=${fromDate}&to=${toDate}`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || `Failed to fetch news for ${symbol}.`);
      }
      // Ensure that news is only taken if it has a headline and datetime
      if (json.length > 0 && json[0].headline && json[0].datetime) {
        return { ...json[0], symbol: symbol };
      }
      return null; // Return null if no valid news is found
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error(`Request timeout for ${symbol}`);
      }
      // Log the specific error for debugging
      console.error(`Error fetching news for ${symbol}:`, err);
      throw err; // Re-throw to be caught by the Promise.allSettled catch
    }
  }, []);

  useEffect(() => {
    const loadAndCacheNews = async () => {
      setLoading(true);
      setError(null);

      if (portfolioData.length === 0 || relevantSymbols.length === 0) {

        localStorage.removeItem('portfolioNewsCache');

        setAllLatestNews([]);
        setLoading(false);
        savePortfolioNewsCache({}); // Clear news cache if no symbols
        return;
      }

      const currentCache = loadPortfolioNewsCache();
      const newsPromises = [];
      const updatedNewsCache = { ...currentCache }; // Start with current fresh cache

      // Determine which symbols need news fetched
      for (const symbol of relevantSymbols) {
        if (!updatedNewsCache[symbol]) {
          // News not in cache or was stale, fetch it
          newsPromises.push(
            fetchNewsForSymbolAPI(symbol)
              .then(data => ({ status: 'fulfilled', value: data, symbol }))
              .catch(reason => ({ status: 'rejected', reason, symbol }))
          );
        } else {
          // News is fresh in cache, add it to collected news
          newsPromises.push(Promise.resolve({ status: 'fulfilled', value: updatedNewsCache[symbol].newsItem, symbol }));
        }
      }

      const results = await Promise.all(newsPromises);

      const collectedNews = [];
      const newsFetchErrors = [];

      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value) {
          collectedNews.push(result.value);
          // Update cache with newly fetched or fresh cached item
          updatedNewsCache[result.symbol] = {
            timestamp: Date.now(), // Update timestamp for all used news (fresh or newly fetched)
            newsItem: result.value
          };
        } else if (result.status === 'rejected') {
          newsFetchErrors.push(`${result.symbol}: ${result.reason.message || 'Unknown error'}`);
          delete updatedNewsCache[result.symbol]; // Remove failed news from cache
        }
      });

      // Save the updated, consolidated cache to local storage
      savePortfolioNewsCache(updatedNewsCache);

      // Sort news for display
      collectedNews.sort((a, b) => {
        const aIsWinner = winnerSymbols.has(a.symbol);
        const bIsWinner = winnerSymbols.has(b.symbol);
        const aIsLoser = loserSymbols.has(a.symbol);
        const bIsLoser = loserSymbols.has(b.symbol);

        if (aIsWinner && !bIsWinner) return -1;
        if (!aIsWinner && bIsWinner) return 1;

        if (!aIsWinner && !bIsWinner) {
          if (aIsLoser && !bIsLoser) return -1;
          if (!aIsLoser && bIsLoser) return 1;
        }

        const dateA = a.datetime || 0;
        const dateB = b.datetime || 0;
        return dateB - dateA;
      });

      setAllLatestNews(collectedNews);

      if (newsFetchErrors.length > 0 && newsFetchErrors.length < relevantSymbols.length) {
        setError(`Some news couldn't be loaded: ${newsFetchErrors.slice(0, 3).join(', ')}${newsFetchErrors.length > 3 ? '...' : ''}`);
      } else if (newsFetchErrors.length === relevantSymbols.length && relevantSymbols.length > 0) {
        setError("Could not load news for any portfolio symbols.");
      } else {
        setError(null);
      }

      setLoading(false);
    };

    loadAndCacheNews();
  }, [portfolioData, relevantSymbols, fetchNewsForSymbolAPI, loadPortfolioNewsCache, savePortfolioNewsCache, winnerSymbols, loserSymbols]);

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Box sx={{ mb: 2, textAlign: 'center' }}>
        <Typography
          variant="h4"
          sx={{
            color: 'white',
            fontWeight: 800,
            background: 'linear-gradient(45deg, #00C49F, #0088FE, #FFBB28)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '0.8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Zap size={24} color="#f9a825" style={{ marginRight: 10 }} />  Market Insights
        </Typography>
      </Box>
      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}

      {portfolioData.length === 0 && !loading ? (
        <Alert severity="info">
          Please upload your portfolio assets to see relevant news.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <WinnersLosersSection portfolioData={portfolioData} loading={loading} />
          </Grid>
          <Grid item xs={12}>
            <LatestNewsCard newsItems={allLatestNews} loading={loading} />
          </Grid>
        </Grid>
      )}
    </Container>
  );
}