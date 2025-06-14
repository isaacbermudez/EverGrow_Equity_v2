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
  Container,
  Chip // Added Chip for potential future use or styling
} from '@mui/material';
import { getDaysAgoDate } from '../utils/dateUtils';
import LinkIcon from '@mui/icons-material/Link';
import ImageNotSupportedIcon from '@mui/icons-material/ImageNotSupported';

// New component for the research links section
const ResearchLinksSection = ({ symbols }) => {
  // Define the research websites and their base URLs (excluding those needing 'bolsa id' for now)
  const researchSites = [
    { name: 'GuruFocus', baseUrl: 'https://www.gurufocus.com/stock/' },
    { name: 'Seeking Alpha', baseUrl: 'https://seekingalpha.com/symbol/' },
    { name: 'Yahoo Finance', baseUrl: 'https://finance.yahoo.com/quote/' },
    { name: 'Finviz', baseUrl: 'https://finviz.com/quote.ashx?t=' },
  ];

  // If no symbols are available, don't render this section
  if (!symbols || symbols.length === 0) {
    return null;
  }

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 4, bgcolor: 'background.paper', borderRadius: 2 }}>
      <Typography variant="h5" gutterBottom sx={{ color: 'text.primary', textAlign: 'center', mb: 2 }}>
        Quick Research Links
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
        Click on a symbol below to open multiple research pages in new tabs.
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, justifyContent: 'center' }}>
        {symbols.map((symbol) => (
          <Button
            key={symbol}
            variant="contained" // Using contained for a more prominent button
            size="small"
            sx={{
              textTransform: 'none',
              borderRadius: 2, // Slightly rounded buttons
              minWidth: '80px', // Ensure buttons have a minimum width
              bgcolor: 'primary.main', // Use primary color from theme
              color: 'white',
              '&:hover': {
                bgcolor: 'primary.dark', // Darker primary on hover
              },
            }}
            onClick={() => {
              // Open a new tab for each research site for the clicked symbol
              researchSites.forEach(site => {
                const url = `${site.baseUrl}${symbol}`;
                window.open(url, '_blank');
              });
            }}
          >
            {symbol}
          </Button>
        ))}
      </Box>
    </Paper>
  );
};

export default function NewsSection({ portfolioData = [] }) {
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
        return json.length > 0 ? { ...json[0], symbol: symbol } : null;
      } catch (err) {
        console.error(`Error fetching news for ${symbol}:`, err);
        return { error: err.message, symbol: symbol };
      }
    };

    const loadNews = async () => {
      setLoading(true);
      setError(null);
      setAllLatestNews([]);

      if (portfolioData.length === 0) {
        setLoading(false);
        return;
      }

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

    if (portfolioData.length > 0) {
      loadNews();
    } else {
      setLoading(false);
      setAllLatestNews([]);
      setError(null);
    }
  }, [portfolioData]);

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
                        e.target.onerror = null;
                        e.target.style.display = 'none';
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

  // Extract unique symbols from portfolioData to pass to ResearchLinksSection
  const uniquePortfolioSymbols = [...new Set(
    portfolioData
      .map(asset => asset.symbol)
      .filter(Boolean) // Filter out any null/undefined symbols
  )];

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Typography variant="h4" color="white" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
        Market News & Insights
      </Typography>

      {/* Render the new Research Links Section here */}
      <ResearchLinksSection symbols={uniquePortfolioSymbols} />

      {loading && (
        <Box display="flex" justifyContent="center" alignItems="center" height="200px">
          <CircularProgress color="secondary" />
        </Box>
      )}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {!loading && !error && portfolioData.length === 0 && (
        <Alert severity="info">Please upload your portfolio assets to see relevant news.</Alert>
      )}

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