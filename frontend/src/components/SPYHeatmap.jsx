// SPYHeatmap.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  AlertTitle,
  Paper,
  Container,
  Chip,
  IconButton,
  Fade,
  Skeleton,
  useTheme,
  alpha
} from '@mui/material';
import {
  TrendingUp,
  CalendarToday,
  Refresh,
  ErrorOutline,
  DataUsage
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import Plot from 'react-plotly.js';

// Styled Components
const GradientBox = styled(Box)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 50%, ${theme.palette.primary.dark} 100%)`,
  minHeight: '100vh',
  padding: theme.spacing(3),
}));

const StyledCard = styled(Card)(({ theme }) => ({
  background: `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.8)}, ${alpha(theme.palette.background.paper, 0.6)})`,
  backdropFilter: 'blur(20px)',
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  borderRadius: theme.spacing(3),
  boxShadow: `0 20px 40px ${alpha(theme.palette.common.black, 0.3)}`,
}));

const HeaderCard = styled(Card)(({ theme }) => ({
  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.1)})`,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
  borderRadius: theme.spacing(2),
  marginBottom: theme.spacing(3),
}));

const ChartContainer = styled(Paper)(({ theme }) => ({
  background: `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.95)}, ${alpha(theme.palette.background.default, 0.9)})`,
  borderRadius: theme.spacing(2),
  minHeight: 700,
  position: 'relative',
  overflow: 'hidden',
  border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
}));

const LoadingOverlay = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  background: alpha(theme.palette.background.paper, 0.9),
  backdropFilter: 'blur(10px)',
  zIndex: 2,
}));

const SPYHeatmap = () => {
  const theme = useTheme();
  const [heatmapData, setHeatmapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDateRange, setSelectedDateRange] = useState('one_day');

  const dateRangeOptions = [
    { value: 'one_day', label: 'One Day' },
    { value: 'after_hours', label: 'After Hours' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'one_week', label: 'One Week' },
    { value: 'one_month', label: 'One Month' },
    { value: 'ytd', label: 'Year to Date' },
    { value: 'one_year', label: 'One Year' },
  ];

  const fetchHeatmap = async (dateRange) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/spy-heatmap?date_range=${dateRange}`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      const data = await response.json();
      setHeatmapData(data);
    } catch (error) {
      console.error('Failed to fetch heatmap:', error);
      setError(`Failed to load heatmap: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHeatmap(selectedDateRange);
  }, [selectedDateRange]);

  const handleDateRangeChange = (event) => {
    setSelectedDateRange(event.target.value);
  };

  const handleRetry = () => {
    fetchHeatmap(selectedDateRange);
  };

  const getSelectedLabel = () => {
    return dateRangeOptions.find(option => option.value === selectedDateRange)?.label || 'One Day';
  };

  return (
    <GradientBox>
      <Container maxWidth="xl">
        {/* Header Section */}
        <Fade in timeout={800}>
          <HeaderCard elevation={0}>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  mb: 3,
                  boxShadow: `0 10px 30px ${alpha(theme.palette.primary.main, 0.4)}`,
                }}
              >
                <TrendingUp sx={{ fontSize: 40, color: 'white' }} />
              </Box>
              
              <Typography
                variant="h2"
                component="h1"
                sx={{
                  fontWeight: 700,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 2,
                }}
              >
                S&P 500 Heatmap
              </Typography>
              
              <Typography
                variant="h6"
                color="text.secondary"
                sx={{ fontWeight: 300, maxWidth: 600, mx: 'auto' }}
              >
                Real-time market visualization and performance analytics
              </Typography>
            </CardContent>
          </HeaderCard>
        </Fade>

        {/* Main Content */}
        <Fade in timeout={1000}>
          <StyledCard elevation={0}>
            {/* Controls Section */}
            <CardContent sx={{ borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', md: 'row' },
                  alignItems: { xs: 'stretch', md: 'center' },
                  justifyContent: 'space-between',
                  gap: 3,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                    }}
                  >
                    <CalendarToday color="primary" />
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight={600}>
                      Time Period
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Select your analysis timeframe
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel id="date-range-label">Date Range</InputLabel>
                    <Select
                      labelId="date-range-label"
                      value={selectedDateRange}
                      label="Date Range"
                      onChange={handleDateRangeChange}
                      sx={{
                        borderRadius: 2,
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: alpha(theme.palette.primary.main, 0.3),
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.primary.main,
                        },
                      }}
                    >
                      {dateRangeOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <Chip
                    icon={<DataUsage />}
                    label={getSelectedLabel()}
                    color="primary"
                    variant="outlined"
                    sx={{ height: 56 }}
                  />
                </Box>
              </Box>
            </CardContent>

            {/* Chart Section */}
            <CardContent sx={{ p: 4 }}>
              <ChartContainer elevation={0}>
                {/* Loading State */}
                {loading && (
                  <LoadingOverlay>
                    <Box sx={{ position: 'relative', mb: 3 }}>
                      <CircularProgress
                        size={60}
                        thickness={4}
                        sx={{
                          color: theme.palette.primary.main,
                          animationDuration: '550ms',
                        }}
                      />
                      <CircularProgress
                        size={60}
                        thickness={4}
                        variant="determinate"
                        value={25}
                        sx={{
                          color: alpha(theme.palette.primary.main, 0.3),
                          position: 'absolute',
                          left: 0,
                          animationDuration: '550ms',
                        }}
                      />
                    </Box>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      Loading market data...
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Fetching latest S&P 500 performance
                    </Typography>
                  </LoadingOverlay>
                )}

                {/* Error State */}
                {error && (
                  <LoadingOverlay>
                    <Alert
                      severity="error"
                      sx={{
                        maxWidth: 500,
                        borderRadius: 2,
                        '& .MuiAlert-icon': { fontSize: 28 },
                      }}
                      action={
                        <IconButton
                          color="inherit"
                          size="small"
                          onClick={handleRetry}
                          sx={{ ml: 1 }}
                        >
                          <Refresh />
                        </IconButton>
                      }
                    >
                      <AlertTitle sx={{ fontWeight: 600 }}>
                        Failed to load data
                      </AlertTitle>
                      {error}
                    </Alert>
                  </LoadingOverlay>
                )}

                {/* Chart */}
                {!loading && !error && heatmapData && (
                  <Fade in timeout={500}>
                    <Box sx={{ width: '100%', height: '100%' }}>
                      <Plot
                        data={heatmapData.data}
                        layout={{
                          ...heatmapData.layout,
                          paper_bgcolor: 'rgba(0,0,0,0)',
                          plot_bgcolor: 'rgba(0,0,0,0)',
                          font: {
                            color: theme.palette.text.primary,
                            family: theme.typography.fontFamily,
                          },
                          margin: { t: 60, r: 40, b: 60, l: 60 },
                          colorway: [
                            theme.palette.primary.main,
                            theme.palette.secondary.main,
                            theme.palette.error.main,
                            theme.palette.warning.main,
                            theme.palette.info.main,
                            theme.palette.success.main,
                          ],
                        }}
                        config={{
                          ...heatmapData.config,
                          displayModeBar: true,
                          modeBarButtonsToRemove: ['pan2d', 'lasso2d'],
                          displaylogo: false,
                          responsive: true,
                          toImageButtonOptions: {
                            format: 'png',
                            filename: `spy-heatmap-${selectedDateRange}`,
                            height: 700,
                            width: 1200,
                            scale: 2,
                          },
                        }}
                        useResizeHandler={true}
                        style={{ width: '100%', height: '700px' }}
                      />
                    </Box>
                  </Fade>
                )}

                {/* No Data State */}
                {!loading && !error && !heatmapData && (
                  <LoadingOverlay>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        bgcolor: alpha(theme.palette.warning.main, 0.1),
                        mb: 3,
                      }}
                    >
                      <ErrorOutline
                        sx={{ fontSize: 40, color: theme.palette.warning.main }}
                      />
                    </Box>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      No heatmap data available
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Please try selecting a different time period
                    </Typography>
                  </LoadingOverlay>
                )}
              </ChartContainer>
            </CardContent>
          </StyledCard>
        </Fade>

        {/* Footer */}
        <Fade in timeout={1200}>
          <Box sx={{ textAlign: 'center', mt: 4, mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Data updates in real-time • Last updated: {new Date().toLocaleTimeString()}
            </Typography>
          </Box>
        </Fade>
      </Container>
    </GradientBox>
  );
};

export default SPYHeatmap;