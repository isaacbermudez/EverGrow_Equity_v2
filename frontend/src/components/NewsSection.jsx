// src/components/NewsSection.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box, Typography, Paper, Grid, CircularProgress, Alert, List, ListItem,
  ListItemText, Divider, Container, ListItemButton, Chip, Skeleton
} from '@mui/material';
import { Zap } from 'lucide-react';
import { getDaysAgoDate } from '../utils/dateUtils';
import LinkIcon from '@mui/icons-material/Link';
import ImageNotSupportedIcon from '@mui/icons-material/ImageNotSupported';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { green, red } from '@mui/material/colors';
import { v4 as uuidv4 } from 'uuid'; // Make sure uuid is installed: npm install uuid

import SPYHeatmap from './SPYHeatmap';

const PORTFOLIO_NEWS_CACHE = 'portfolioNewsCache';
const GENERAL_NEWS_CACHE = 'generalNewsCache';
const CACHE_DURATION_HOURS = 1;

const safeNum = (n) => (typeof n === 'number' ? n : 0);

const researchSites = [
  { name: 'Bloomberg', baseUrl: 'https://www.bloomberg.com/search?query=' },
  { name: 'WSJ', baseUrl: 'https://www.wsj.com/market-data/quotes/', suffix: '?mod=searchresults_companyquotes&mod=md_usstk_hdr_search' },
  { name: 'Seeking Alpha', baseUrl: 'https://seekingalpha.com/symbol/' },
];

const openResearchLinks = (symbol) => {
  researchSites.forEach(site => {
    const url = `${site.baseUrl}${symbol}${site.suffix || ''}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  });
};

const formatCurrency = (amount) => {
  const absAmount = Math.abs(amount);
  if (absAmount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
  if (absAmount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
  return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

const loadCache = (key) => {
  try {
    const data = localStorage.getItem(key);
    if (!data) return {};

    const cache = JSON.parse(data);
    const currentTime = Date.now();
    const freshCache = {};

    for (const [cacheKey, value] of Object.entries(cache)) {
      const ageHours = (currentTime - value.timestamp) / (1000 * 60 * 60);
      if (ageHours < CACHE_DURATION_HOURS) {
        freshCache[cacheKey] = value;
      }
    }
    return freshCache;
  } catch (e) {
    localStorage.removeItem(key);
    return {};
  }
};

const saveCache = (key, cache) => {
  try {
    localStorage.setItem(key, JSON.stringify(cache));
  } catch (e) {
    // Error saving cache
  }
};

const extractNewsFromCache = (cachedItem) => {
  if (!cachedItem) return null;

  if (cachedItem.newsItem) {
    if (cachedItem.newsItem.status === 'fulfilled' && cachedItem.newsItem.value) {
      return sanitizeNews(cachedItem.newsItem.value);
    }
    if (cachedItem.newsItem.headline) {
      return sanitizeNews(cachedItem.newsItem);
    }
  }

  if (cachedItem.headline) {
    return sanitizeNews(cachedItem);
  }

  return null;
};

const sanitizeNews = (news) => {
  if (!news) return null;

  const sanitizeField = (value) => {
    if (value === undefined || value === null) return null;
    const str = String(value).trim();
    if (str === "" || str.toLowerCase() === "undefined" || str === "null") return null;
    return value;
  };

  const headline = sanitizeField(news.headline);

  let datetime = null;
  if (news.datetime) {
    if (typeof news.datetime === 'number') {
      const timestamp = news.datetime > 1000000000000 ? news.datetime : news.datetime * 1000;
      if (!isNaN(new Date(timestamp).getTime())) {
        datetime = Math.floor(timestamp / 1000);
      }
    }
  }

  if (!headline || !datetime) {
    return null;
  }

  return {
    // Ensure 'id' is always present and unique. If news.id exists, use it, otherwise generate a new UUID.
    id: news.id || uuidv4(),
    symbol: sanitizeField(news.symbol) || 'UNKNOWN',
    headline,
    datetime,
    summary: sanitizeField(news.summary),
    image: sanitizeField(news.image),
    source: sanitizeField(news.source) || 'Unknown',
    url: sanitizeField(news.url),
  };
};

const WinnersLosersSection = React.memo(({ portfolioData, loading }) => {
  const { winners, losers } = useMemo(() => {
    if (!portfolioData?.length) return { winners: [], losers: [] };

    const sortedAssets = [...portfolioData]
      .map(asset => ({
        ...asset,
        calculatedProfitLoss: asset.profitLoss ??
          (safeNum(asset.currentPrice) * safeNum(asset.holdings) - safeNum(asset.CI))
      }))
      .filter(asset => asset.calculatedProfitLoss !== 0 && asset.symbol)
      .sort((a, b) => b.calculatedProfitLoss - a.calculatedProfitLoss);

    return {
      winners: sortedAssets.filter(asset => asset.calculatedProfitLoss > 0).slice(0, 5),
      losers: sortedAssets.filter(asset => asset.calculatedProfitLoss < 0)
        .sort((a, b) => a.calculatedProfitLoss - b.calculatedProfitLoss).slice(0, 5)
    };
  }, [portfolioData]);

  if (loading) {
    return (
      <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Skeleton variant="text" width="50%" height={40} sx={{ mx: 'auto', mb: 2 }} />
        <Grid container spacing={3}>
          {[0, 1].map((index) => (
            <Grid xs={12} md={6} key={index}>
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
  }

  if (!portfolioData?.length) return null;

  const renderAssetList = (assets, isWinners) => {
    const color = isWinners ? green[400] : red[400];
    const borderColor = isWinners ? green[700] : red[700];
    const Icon = isWinners ? TrendingUpIcon : TrendingDownIcon;

    return (
      <Paper sx={{
        p: 3, border: `2px solid ${borderColor}`, borderRadius: 3,
        background: (theme) => `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
        boxShadow: (theme) => theme.shadows[6],
        '&:hover': { transform: 'translateY(-2px)', boxShadow: (theme) => theme.shadows[8] }
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', backgroundColor: color + '15', px: 2, py: 1, borderRadius: 2 }}>
            <Icon sx={{ color, mr: 1.5, fontSize: '1rem' }} />
            <Typography variant="h6" sx={{ color, fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase' }}>
              {isWinners ? 'Top Winners' : 'Top Losers'}
            </Typography>
          </Box>
        </Box>

        <List dense sx={{
          display: 'flex', // Enable Flexbox
          overflowX: 'auto', // Allow horizontal scrolling if items exceed container width
          py: 1, // Add some vertical padding
          gap: 1, // Add space between items
          '&::-webkit-scrollbar': { // Hide scrollbar for a cleaner look (optional)
            display: 'none',
          },
          msOverflowStyle: 'none',  // Hide scrollbar for IE and Edge
          scrollbarWidth: 'none',  // Hide scrollbar for Firefox
        }}>
          {assets.length > 0 ? assets.map((asset, index) => (
            <ListItemButton
              key={`${asset.symbol}-${isWinners ? 'winner' : 'loser'}-${index}`}
              onClick={() => openResearchLinks(asset.symbol)}
              sx={{
                flexShrink: 0, // Prevent items from shrinking
                minWidth: '120px', // Set a minimum width for each item
                maxWidth: '150px', // Set a maximum width for each item
                borderRadius: 2, // Slightly more rounded corners
                border: 1,
                borderColor: 'divider',
                display: 'flex', // Enable Flexbox for content alignment within the button
                flexDirection: 'column', // Stack content vertically
                alignItems: 'center', // Center content horizontally
                justifyContent: 'center', // Center content vertically
                py: 2, // Add vertical padding
                px: 1, // Add horizontal padding
                '&:hover': {
                  borderColor: color,
                  backgroundColor: (theme) => theme.palette.action.hover, // Add subtle hover background
                }
              }}
            >
              <ListItemText
                primary={
                  <Box display="flex" flexDirection="column" alignItems="center" gap={0.5}>
                    <Typography variant="body2" fontWeight={600} noWrap>{asset.symbol}</Typography> {/* Bold and no wrap */}
                    <Chip
                      label={`${isWinners ? '+' : ''}${formatCurrency(asset.calculatedProfitLoss)}`}
                      size="small"
                      sx={{
                        backgroundColor: `${color}15`,
                        color,
                        fontWeight: 600, // Make chip text bolder
                        fontSize: '0.7rem', // Slightly smaller font for chip
                        height: '24px', // Fixed height for chips
                      }}
                    />
                  </Box>
                }
                sx={{ my: 0 }} // Remove default margin from ListItemText
              />
            </ListItemButton>
          )) : (
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center', // Center content vertically in the empty state
              width: '100%', // Ensure it takes full width when empty
              py: 4
            }}>
              <Icon sx={{ fontSize: '2rem', color: 'text.disabled', mb: 1 }} />
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
    <Grid container spacing={1}>
      <Grid xs={12} sm={6}>
        {renderAssetList(winners, true)}
      </Grid>
      <Grid xs={12} sm={6}>
        {renderAssetList(losers, false)}
      </Grid>
    </Grid>
  );
});

const NewsItem = React.memo(({ news, index, isLast }) => {
  const formatDate = (datetime) => {
    if (!datetime) return 'Invalid Date';
    try {
      const date = new Date(datetime * 1000);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return 'Invalid Date';
    }
  };

  return (
    <React.Fragment>
      <ListItem alignItems="flex-start" sx={{ mb: 1, px: 0 }}>
        <Box display="flex" flexDirection="column" width="100%">
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
            {news.symbol && news.symbol !== 'undefined' && news.symbol !== 'UNKNOWN' && (
              <Chip label={news.symbol} size="small" variant="outlined" sx={{ fontWeight: 'bold' }} />
            )}
            <Typography variant="caption" sx={{ color: 'text.secondary', ml: news.symbol ? 0 : 'auto' }}>
              {formatDate(news.datetime)}
            </Typography>
          </Box>

          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem', mb: 1 }}>
            {news.source}
          </Typography>

          <Typography
            variant="body1"
            component="a"
            href={news.url}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              fontWeight: 'bold', color: 'primary.main', textDecoration: 'none', cursor: 'pointer',
              '&:hover': { textDecoration: 'underline' }, mb: 1
            }}
          >
            {news.headline}
            <LinkIcon sx={{ fontSize: '0.8rem', verticalAlign: 'middle', ml: 0.5 }} />
          </Typography>

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
  );
});

const NewsCard = React.memo(({ title, newsItems, loading, error, emptyMessage }) => (
  <Box sx={{ p: 2, mb: 2 }}>
    <Typography variant="h6" gutterBottom color="text.primary" sx={{ textAlign: 'center', fontWeight: 700 }}>
      {title}
    </Typography>
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    {loading ? (
      <Box sx={{ flexGrow: 1 }}>
        {[...Array(3)].map((_, index) => (
          <Box key={index} sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Skeleton variant="rectangular" width={60} height={24} />
              <Skeleton variant="text" width={80} />
            </Box>
            <Skeleton variant="text" width="90%" height={24} />
            <Skeleton variant="rectangular" width="100%" height={60} sx={{ mt: 1 }} />
          </Box>
        ))}
      </Box>
    ) : newsItems.length > 0 ? (
      <List sx={{ flexGrow: 1, overflowY: 'auto', px: 1 }}>
        {newsItems.map((news, index) => (
          // Use news.id directly as it's now guaranteed to be unique
          <NewsItem
            key={news.id}
            news={news}
            index={index}
            isLast={index === newsItems.length - 1}
          />
        ))}
      </List>
    ) : (
      <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', py: 4 }}>
        <img src="/no-data.svg" alt="No news" style={{ maxWidth: 160, opacity: 0.5, marginBottom: 16 }} />
        <Typography variant="body2" color="text.secondary">{emptyMessage}</Typography>
      </Box>
    )}
  </Box>
));

export default function NewsSection({ portfolioData = [] }) {
  const [portfolioNews, setPortfolioNews] = useState([]);
  const [generalNews, setGeneralNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingGeneral, setLoadingGeneral] = useState(true);
  const [error, setError] = useState(null);
  const [generalError, setGeneralError] = useState(null);

  const { relevantSymbols, winnerSymbols, loserSymbols } = useMemo(() => {
    if (!portfolioData?.length) return { relevantSymbols: [], winnerSymbols: new Set(), loserSymbols: new Set() };

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
      relevantSymbols: [...new Set(sortedAssets.map(asset => asset.symbol))],
      winnerSymbols: new Set(winners.map(w => w.symbol)),
      loserSymbols: new Set(losers.map(l => l.symbol))
    };
  }, [portfolioData]);

  const fetchNewsForSymbol = useCallback(async (symbol) => {
    const fromDate = getDaysAgoDate(30);
    const toDate = getDaysAgoDate(0);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(`/api/company-news?symbol=${symbol}&from=${fromDate}&to=${toDate}`,
        { signal: controller.signal });
      clearTimeout(timeoutId);

      const json = await response.json();

      if (!json.length) return null;

      const latestNews = json.reduce((latest, current) => {
        if (!latest) return current;
        return (current.datetime > latest.datetime) ? current : latest;
      }, null);

      if (!latestNews) return null;

      const sanitized = sanitizeNews({ ...latestNews, symbol });
      return sanitized;
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  }, []);

  useEffect(() => {
    const loadPortfolioNews = async () => {
      setLoading(true);
      setError(null);

      if (!relevantSymbols.length) {
        setPortfolioNews([]);
        setLoading(false);
        return;
      }

      const cache = loadCache(PORTFOLIO_NEWS_CACHE);

      const collectedNews = [];
      const symbolsNeedingFetch = [];
      const updatedCache = { ...cache };

      for (const symbol of relevantSymbols) {
        if (cache[symbol]) {
          const cachedNews = extractNewsFromCache(cache[symbol]);
          if (cachedNews) {
            collectedNews.push(cachedNews);
          } else {
            symbolsNeedingFetch.push(symbol);
          }
        } else {
          symbolsNeedingFetch.push(symbol);
        }
      }

      if (symbolsNeedingFetch.length > 0) {
        const fetchPromises = symbolsNeedingFetch.map(symbol =>
          fetchNewsForSymbol(symbol)
            .then(data => ({ status: 'fulfilled', value: data, symbol }))
            .catch(reason => ({ status: 'rejected', reason, symbol }))
        );

        const results = await Promise.allSettled(fetchPromises);
        const errors = [];

        results.forEach((result) => {
          if (result.status === 'fulfilled' && result.value.status === 'fulfilled' && result.value.value) {
            collectedNews.push(result.value.value);
            updatedCache[result.value.symbol] = {
              timestamp: Date.now(),
              newsItem: { status: 'fulfilled', value: result.value.value }
            };
          } else {
            const symbol = result.value?.symbol || 'unknown';
            const error = result.value?.reason?.message || result.reason?.message || 'Unknown error';
            errors.push(`${symbol}: ${error}`);
          }
        });

        if (errors.length > 0) {
          if (errors.length < symbolsNeedingFetch.length) {
            setError(`Some news couldn't be loaded`);
          }
        }

        saveCache(PORTFOLIO_NEWS_CACHE, updatedCache);
      }

      // Sort news: winners first, then losers, then by date (most recent first)
      collectedNews.sort((a, b) => {
        const aIsWinner = winnerSymbols.has(a.symbol);
        const bIsWinner = winnerSymbols.has(b.symbol);
        const aIsLoser = loserSymbols.has(a.symbol);
        const bIsLoser = loserSymbols.has(b.symbol);

        // Primary sort: Winners first
        if (aIsWinner && !bIsWinner) return -1;
        if (!aIsWinner && bIsWinner) return 1;

        // If both are winners or neither are winners, then sort by losers
        if (!aIsWinner && !bIsWinner) {
          // Secondary sort: Losers second (among non-winners)
          if (aIsLoser && !bIsLoser) return -1;
          if (!aIsLoser && bIsLoser) return 1;
        }

        // Tertiary sort: By date (most recent first) if winner/loser status is same or not applicable
        return (b.datetime || 0) - (a.datetime || 0);
      });

      setPortfolioNews(collectedNews);
      setLoading(false);
    };

    loadPortfolioNews();
  }, [relevantSymbols, fetchNewsForSymbol, winnerSymbols, loserSymbols]);

  useEffect(() => {
    const fetchGeneralNews = async () => {
      setLoadingGeneral(true);
      setGeneralError(null);

      const cache = loadCache(GENERAL_NEWS_CACHE);
      const category = "general";

      if (cache[category]) {
        setGeneralNews(cache[category].newsItems);
        setLoadingGeneral(false);
        return;
      }

      try {
        const response = await fetch(`/api/market-news?category=${category}`);
        const json = await response.json();

        if (!response.ok) throw new Error(json.error || 'Failed to fetch general news');

        const validNews = json.map(item => sanitizeNews(item)).filter(Boolean);
        setGeneralNews(validNews);

        const updatedCache = { ...cache, [category]: { timestamp: Date.now(), newsItems: validNews } };
        saveCache(GENERAL_NEWS_CACHE, updatedCache);
      } catch (err) {
        setGeneralError(`General market news unavailable: ${err.message}`);
        setGeneralNews([]);
      } finally {
        setLoadingGeneral(false);
      }
    };

    fetchGeneralNews();
  }, []);

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Box sx={{ mb: 2, textAlign: 'center' }}>
        <Typography variant="h4" sx={{
          color: 'white', fontWeight: 800,
          background: 'linear-gradient(45deg, #00C49F, #0088FE, #FFBB28)',
          backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Zap size={24} color="#f9a825" style={{ marginRight: 10 }} />
          Market Insights
        </Typography>
      </Box>

        <Box sx={{ mb: 3, p: 2, border: '1px solid #ddd', borderRadius: '8px', bgcolor: 'background.paper' }}>
          <SPYHeatmap />
        </Box>
      <Box>
        <Box sx={{ mb: 3 }}>
          <WinnersLosersSection portfolioData={portfolioData} loading={loading} />
        </Box>
        <Box sx={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3,
          '@media (max-width: 768px)': { gridTemplateColumns: '1fr' }
        }}>
          <Paper elevation={0} sx={{
            p: 1, borderRadius: 2,
            background: (theme) => `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
            border: '1px solid rgba(0,0,0,0.1)', boxShadow: (theme) => theme.shadows[6],
            '&:hover': { transform: 'translateY(-2px)', boxShadow: (theme) => theme.shadows[8] }
          }}>
            <NewsCard
              title="Latest Portfolio News"
              newsItems={portfolioNews}
              loading={loading}
              error={error}
              emptyMessage="No portfolio news available."
            />
          </Paper>

          <Paper elevation={0} sx={{
            p: 1, borderRadius: 2,
            background: (theme) => `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
            border: '1px solid rgba(0,0,0,0.1)', boxShadow: (theme) => theme.shadows[6],
            '&:hover': { transform: 'translateY(-2px)', boxShadow: (theme) => theme.shadows[8] }
          }}>
            <NewsCard
              title="General Market News"
              newsItems={generalNews}
              loading={loadingGeneral}
              error={generalError}
              emptyMessage="No general market news available."
            />
          </Paper>
        </Box>
      </Box>
    </Container>
  );
}