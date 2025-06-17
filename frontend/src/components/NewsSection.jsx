// src/components/NewsSection.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
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
  Skeleton
} from '@mui/material';
import { getDaysAgoDate } from '../utils/dateUtils';
import LinkIcon from '@mui/icons-material/Link';
import ImageNotSupportedIcon from '@mui/icons-material/ImageNotSupported';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { green, red } from '@mui/material/colors';

const safeNum = (n) => (typeof n === 'number' ? n : 0);

const NewsItem = React.memo(({ news, index, isLast }) => (
  <React.Fragment>
    <ListItem alignItems="flex-start" sx={{ mb: 1, px: 0 }}>
      <Box display="flex" flexDirection="column" width="100%">
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
          <Chip label={news.symbol} size="small" variant="outlined" sx={{ fontWeight: 'bold' }} />
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>{new Date(news.datetime * 1000).toLocaleDateString()}</Typography>
        </Box>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem', mb: 1 }}>{news.source}</Typography>
        <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'primary.main', textDecoration: 'none', cursor: 'pointer', '&:hover': { textDecoration: 'underline' }, mb: 1 }} component="a" href={news.url} target="_blank" rel="noopener noreferrer">
          {news.headline}
          <LinkIcon sx={{ fontSize: '0.8rem', verticalAlign: 'middle', ml: 0.5 }} />
        </Typography>
        {news.image && news.image !== '' ? (
          <Box component="img" src={news.image} alt={news.headline} sx={{ maxWidth: '100%', maxHeight: '100px', objectFit: 'cover', borderRadius: 1, mb: 1 }} onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }} loading="lazy" />
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '60px', bgcolor: 'background.paper', borderRadius: 1, mb: 1, border: '1px dashed', borderColor: 'divider' }}>
            <ImageNotSupportedIcon sx={{ color: 'text.disabled', fontSize: '1.5rem' }} />
          </Box>
        )}
        <Typography variant="body2" sx={{ color: 'text.primary' }}>{news.summary ? `${news.summary.substring(0, 200)}${news.summary.length > 200 ? '...' : ''}` : 'No summary available.'}</Typography>
      </Box>
    </ListItem>
    {!isLast && <Divider component="li" sx={{ my: 2 }} />}
  </React.Fragment>
));

NewsItem.displayName = 'NewsItem';

const LatestNewsCard = React.memo(({ newsItems, loading }) => (
  <Box sx={{ p: 2, mb: 2 }}> {/* match embedded look */}
    <Typography variant="h6" gutterBottom color="text.primary" sx={{ textAlign: 'center', fontWeight: 700 }}>Latest Portfolio News</Typography>
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
          <NewsItem key={news.id || `${news.symbol}-${index}`} news={news} index={index} isLast={index === newsItems.length - 1} />
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

export default LatestNewsCard;
