// src/components/NewsSection.jsx
import React, { useState, useEffect } from 'react';
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
  Button,
  Container
} from '@mui/material';
import { getDaysAgoDate } from '../utils/dateUtils';
import LinkIcon from '@mui/icons-material/Link';
import ImageNotSupportedIcon from '@mui/icons-material/ImageNotSupported';

export default function NewsSection({ portfolioData = [] }) {
  // Renamed state to hold all relevant latest news
  const [allLatestNews, setAllLatestNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNewsForSymbol = async (symbol) => {
      const fromDate = getDaysAgoDate(30); // News from last 30 days
      const toDate = getDaysAgoDate(0);   // Up to today
      try {
        const response = await fetch(`/api/company-news?symbol=${symbol}&from=${fromDate}&to=${toDate}`);
        const json = await response.json();
        if (!response.ok) {
          throw new Error(json.error || `Failed to fetch news for ${symbol}.`);
        }
        // We only want the single latest news article for each symbol
        return json.length > 0 ? { ...json[0], symbol: symbol } : null; // Attach symbol for easier display
      } catch (err) {
        console.error(`Error fetching news for ${symbol}:`, err);
        return { error: err.message, symbol: symbol }; // Return error info with symbol
      }
    };

    const loadNews = async () => {
      setLoading(true);
      setError(null);
      setAllLatestNews([]); // Clear any previously loaded news

      if (portfolioData.length === 0) {
        setLoading(false);
        return;
      }

      // Filter for symbols with non-zero profitLoss (gainers and losers)
      // Ensure we only process unique symbols
      const relevantSymbols = [...new Set(
        portfolioData
          .filter(asset => asset.profitLoss !== 0 && asset.symbol)
          .map(asset => asset.symbol)
      )];

      if (relevantSymbols.length === 0) {
        setLoading(false);
        return;
      }

      const newsPromises = relevantSymbols.map(symbol => fetchNewsForSymbol(symbol));

      try {
        // Use Promise.allSettled to handle individual news fetch failures gracefully
        const results = await Promise.allSettled(newsPromises);

        let collectedNews = [];
        let newsFetchErrors = [];

        results.forEach((result) => {
          if (result.status === 'fulfilled' && result.value && !result.value.error) {
            collectedNews.push(result.value);
          } else if (result.status === 'rejected' || (result.status === 'fulfilled' && result.value && result.value.error)) {
            const errorSymbol = result.value ? result.value.symbol : (result.reason?.symbol || 'Unknown');
            const errorMessage = result.value && result.value.error ? result.value.error : result.reason?.message || 'Failed to fetch news';
            newsFetchErrors.push(`News for ${errorSymbol}: ${errorMessage}`);
          }
        });

        // Sort collected news by datetime (most recent first)
        collectedNews.sort((a, b) => b.datetime - a.datetime);

        setAllLatestNews(collectedNews);
        if (newsFetchErrors.length > 0) {
          setError(`Some news could not be loaded: ${newsFetchErrors.join(' | ')}`);
        }

      } catch (err) {
        setError("An unexpected error occurred while loading news.");
        console.error("Error in loadNews Promise.allSettled:", err);
      } finally {
        setLoading(false);
      }
    };

    // Only attempt to load news if there's portfolio data
    if (portfolioData.length > 0) {
      loadNews();
    } else {
      setLoading(false); // If no portfolio data, stop loading
      setAllLatestNews([]); // Clear any existing news
      setError(null);
    }
  }, [portfolioData]); // Re-run effect when portfolioData changes

  // Consolidated component to display all latest news
  const LatestNewsCard = ({ newsItems }) => (
    <Paper elevation={3} sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" gutterBottom color="text.primary" sx={{ textAlign: 'center' }}>
        Latest Market News
      </Typography>
      {newsItems.length > 0 ? (
        <List sx={{ flexGrow: 1, overflowY: 'auto' }}>
          {newsItems.map((news, index) => (
            <React.Fragment key={news.id || index}>
              <ListItem alignItems="flex-start" sx={{ mb: 1 }}>
                <Box display="flex" flexDirection="column" width="100%">
                  {/* Display the stock symbol for this news item */}
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>
                    {news.symbol}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                    {new Date(news.datetime * 1000).toLocaleDateString()} - {news.source}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 'bold',
                      color: 'primary.main',
                      textDecoration: 'none',
                      '&:hover': { textDecoration: 'underline' },
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
                        mt: 1,
                        mb: 0.5,
                      }}
                      onError={(e) => {
                        e.target.onerror = null; // Prevent infinite loop
                        e.target.style.display = 'none'; // Hide broken image
                      }}
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
                        mt: 1,
                        mb: 0.5,
                      }}
                    >
                      <ImageNotSupportedIcon sx={{ color: 'text.disabled', fontSize: '2rem' }} />
                    </Box>
                  )}
                  <Typography variant="body2" sx={{ color: 'text.primary', mt: 0.5 }}>
                    {news.summary ? `${news.summary.substring(0, 150)}...` : 'No summary available.'}
                  </Typography>
                </Box>
              </ListItem>
              {index < newsItems.length - 1 && <Divider component="li" sx={{ my: 1 }} />}
            </React.Fragment>
          ))}
        </List>
      ) : (
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No news available for the relevant symbols.
          </Typography>
        </Box>
      )}
    </Paper>
  );

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Typography variant="h4" color="white" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
        Market News & Insights
      </Typography>

      {loading && (
        <Box display="flex" justifyContent="center" alignItems="center" height="200px">
          <CircularProgress color="secondary" />
        </Box>
      )}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {!loading && !error && portfolioData.length === 0 && (
        <Alert severity="info">Please upload your portfolio assets to see relevant news.</Alert>
      )}

      {/* Display the single LatestNewsCard for all news */}
      {!loading && !error && portfolioData.length > 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <LatestNewsCard newsItems={allLatestNews} />
          </Grid>
        </Grid>
      )}
    </Container>
  );
}