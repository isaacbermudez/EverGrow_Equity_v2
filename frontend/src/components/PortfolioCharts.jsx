// src/components/PortfolioCharts.jsx
import React, { useState, useEffect, useCallback } from 'react'; // Import useCallback
import {
  Box,
  Typography,
  useTheme,
  Tooltip as MuiTooltip,
} from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { teal } from '@mui/material/colors';

const safeNum = (n) => (typeof n === 'number' ? n : 0);

const COLORS = [
  teal[500], '#1A237E', '#B71C1C', '#E65100', '#33691E', '#4A148C',
  '#BF360C', '#1B5E20', '#880E4F', '#E91E63', '#3F51B5', '#795548',
  '#607D8B', '#FF5722', '#9C27B0', '#2E7D32', '#C62828', '#5D4037'
];

// Advanced label renderer with multiple display modes
const renderAdvancedLabel = ({
  cx, cy, midAngle, innerRadius, outerRadius, percent, value, name
}, labelMode, minPercent = 2) => {
  const RADIAN = Math.PI / 180;

  // Skip small segments to avoid clutter
  if (percent * 100 < minPercent) return null;

  // Calculate label position
  const labelRadius = outerRadius + 35;
  const x = cx + labelRadius * Math.cos(-midAngle * RADIAN);
  const y = cy + labelRadius * Math.sin(-midAngle * RADIAN);

  // Calculate line coordinates for connecting line
  const lineRadius = outerRadius + 5;
  const lineX = cx + lineRadius * Math.cos(-midAngle * RADIAN);
  const lineY = cy + lineRadius * Math.sin(-midAngle * RADIAN);

  let labelText = '';
  let subText = '';

  // Use a more robust switch for label modes
  switch (labelMode) {
    case 'name':
      labelText = name.length > 5 ? `${name.substring(0, 10)}...` : name;
      subText = `$${Math.ceil(value)}`;
      break;
    /* case 'percentage':
       labelText = `${(percent * 100).toFixed(1)}%`;
       break;
     case 'value':
       labelText = `$${(value / 1000).toFixed(0)}K`;
       break;
     case 'nameValue':
       labelText = name;
       subText = `$${(value / 1000).toFixed(0)}K`;
       break;
     case 'full':
       labelText = `${(percent * 100).toFixed(1)}%`;
       subText = `$${(value / 1000).toFixed(0)}K`;
       break;*/
    default:
      labelText = `${(percent * 100).toFixed(1)}%`;
  }

  const textAnchor = x > cx ? 'start' : 'end';
  const isLeft = x < cx;

  // Dynamic width based on text length
  const textWidth = Math.max(60, labelText.length * 6 + 20);

  return (
    <g>
      {/* Connecting line */}
      <path
        d={`M${lineX},${lineY}L${x},${y}`}
        stroke="rgba(255,255,255,0.6)"
        strokeWidth="1"
        fill="none"
      />

      {/* Label background - dynamic width */}
      <rect
        x={isLeft ? x - textWidth : x}
        y={subText ? y - 16 : y - 8} // Adjust Y position based on subtext
        width={textWidth}
        height={subText ? "30" : "20"} // Adjust height based on subtext
        fill="rgba(0, 0, 0, 0.85)" // Slightly darker for better contrast
        rx="4"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="1"
      />

      {/* Main label text */}
      <text
        x={isLeft ? x - textWidth / 2 : x + textWidth / 2}
        y={subText ? y - 6 : y} // Adjust Y position for main text
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="12" // Slightly larger font for readability
        fontWeight="600"
        fill="white"
      >
        {labelText}
      </text>

      {/* Sub text */}
      {subText && (
        <text
          x={isLeft ? x - textWidth / 2 : x + textWidth / 2}
          y={y + 8} // Adjust Y position for subtext
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="10" // Slightly larger font for readability
          fill="#FFBB28"
          fontWeight="500"
        >
          {subText}
        </text>
      )}
    </g>
  );
};

// Inner labels for larger segments
const renderInnerLabel = ({
  cx, cy, midAngle, innerRadius, outerRadius, percent, value, name
}, showInner, minPercent = 8) => {
  if (!showInner || percent * 100 < minPercent) return null;

  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="middle"
      fontSize="14"
      fontWeight="700"
      stroke="rgba(0, 0, 0, 0.14)"
      strokeWidth="1"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// Custom Tooltip component - no changes needed here, looks good.
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <Box sx={{
        p: 2,
        background: 'rgba(0,0,0,0.9)',
        borderRadius: 2,
        border: '1px solid rgba(255,255,255,0.2)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
      }}>
        <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold', mb: 0.5 }}>
          {data.name}
        </Typography>
        <Typography variant="caption" sx={{ color: teal[300], display: 'block' }}>
          Value: ${data.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Typography>
        <Typography variant="caption" sx={{ color: '#FFBB28', display: 'block' }}>
          Weight: {((data.value / data.total) * 100).toFixed(2)}%
        </Typography>
      </Box>
    );
  }
  return null;
};

export default function PortfolioCharts({ rows = [] }) {
  const theme = useTheme();
  // Fixed values instead of state - you can change these defaults as needed
  const labelMode = 'name'; // Default label mode
  const showInnerLabels = true; // Show inner labels by default
  const showOuterLabels = true; // Show outer labels by default
  const minPercentThreshold = 0; // Show all segments by default

  // Use filteredRows directly, no local filtering needed based on categoryFilter anymore.
  const filteredRows = rows; // 'rows' prop already comes filtered from HomeContent

  // Memoize data calculations to prevent unnecessary re-calculations on every render
  const totalValue = React.useMemo(() => {
    return filteredRows.reduce((acc, stock) => acc + (safeNum(stock.currentPrice) * safeNum(stock.holdings)), 0);
  }, [filteredRows]);

  const totalInvestedAmount = React.useMemo(() => {
    return filteredRows.reduce((acc, stock) => acc + safeNum(stock.CI), 0);
  }, [filteredRows]);

  const sectorData = React.useMemo(() => {
    return filteredRows.reduce((acc, stock) => {
      const sector = stock.sector || 'Uncategorized';
      const marketValue = safeNum(stock.currentPrice) * safeNum(stock.holdings);
      acc[sector] = (acc[sector] || 0) + marketValue;
      return acc;
    }, {});
  }, [filteredRows]);

  const baseChartData = React.useMemo(() => {
    return Object.entries(sectorData)
      .map(([name, value]) => ({ name, value, total: totalValue }))
      .filter(entry => entry.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [sectorData, totalValue]);

  const investedChartData = React.useMemo(() => {
    return filteredRows
      .map(stock => ({
        name: stock.symbol || 'N/A',
        value: safeNum(stock.CI),
        total: totalInvestedAmount
      }))
      .filter(e => e.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [filteredRows, totalInvestedAmount]);

  // ChartCard component - moved inside PortfolioCharts to leverage its state and data
  const ChartCard = useCallback(({ title, data, dataKey = 'value' }) => {
    // We'll manage activeItems locally within ChartCard, but reset it if data changes
    const [activeItems, setActiveItems] = useState(() => data.map(() => true));
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    // Reset activeItems whenever the data prop changes
    useEffect(() => {
      setActiveItems(data.map(() => true));
      // Only set initial load to false after first data load
      if (data.length > 0) {
        setIsInitialLoad(false);
      }
    }, [data]);

    const toggleItem = (index) => {
      const updated = [...activeItems];
      updated[index] = !updated[index];
      setActiveItems(updated);
    };

    const visibleData = data.map((entry, index) => ({ ...entry, index })).filter((_, i) => activeItems[i]);

    if (!data.length) {
      return (
        <Box sx={{ flex: 1, minWidth: 320, maxWidth: 600, p: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 5 }}>
          <Box sx={{ textAlign: 'center', opacity: 0.5 }}>
            <img src="/no-data.svg" alt="No data" style={{ maxWidth: '140px', opacity: 0.5, marginBottom: 16 }} />
          </Box>
        </Box>
      );
    }

    return (
      <Box sx={{ flex: 1, minWidth: 320, maxWidth: 600, p: 1 }}>
        <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 700, mb: 2, textAlign: 'center' }}>
          {title}
        </Typography>
        <Box sx={{ height: 400, position: 'relative' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 40, right: 80, bottom: 40, left: 80 }}>
              <Pie
                key={`pie-${title}`} // Stable key per chart
                data={visibleData}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={100}
                dataKey={dataKey}
                labelLine={false}
                label={showOuterLabels ? (props) => renderAdvancedLabel(props, labelMode, minPercentThreshold) : false}
                isAnimationActive={!isInitialLoad} // Only animate after initial load
                animationBegin={0}
                animationDuration={600} // Shorter duration for smoother experience
                animationEasing="ease-out"
              >
                {visibleData.map((entry, i) => (
                  <Cell
                    key={`cell-${entry.name}-${entry.value}`} // More stable key combining name and value
                    fill={COLORS[entry.index % COLORS.length]}
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              {showInnerLabels && (
                <Pie // A separate Pie for inner labels ensures they animate independently if desired
                  key={`inner-pie-${title}`} // Stable key for inner pie
                  data={visibleData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={100}
                  dataKey={dataKey}
                  labelLine={false}
                  label={(props) => renderInnerLabel(props, showInnerLabels, 8)}
                  fill="transparent" // Make this pie transparent
                  stroke='transparent' // Make this pie transparent
                  isAnimationActive={false} // Keep disabled to avoid label flickering
                />
              )}
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </Box>
        <Box sx={{ mt: 2, maxHeight: 80, overflowY: 'auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 0.5 }}>
          {data.map((entry, index) => (
            <MuiTooltip key={index} title={`${entry.name}: $${entry.value.toLocaleString()} (${((entry.value / entry.total) * 100).toFixed(1)}%)`} arrow>
              <Box
                onClick={() => toggleItem(index)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  opacity: activeItems[index] ? 1 : 0.35,
                  px: 1,
                  py: 0.5,
                  borderRadius: 1.5,
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.12)',
                    transform: 'translateY(-1px)'
                  }
                }}
              >
                <Box sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor: COLORS[index % COLORS.length],
                  mr: 0.8,
                  border: '1px solid rgba(255,255,255,0.3)'
                }} />
                <Typography variant="caption" sx={{
                  color: 'rgb(255, 255, 255)',
                  fontSize: '0.6rem',
                  fontWeight: 600
                }}>
                  {entry.name}
                </Typography>
              </Box>
            </MuiTooltip>
          ))}
        </Box>
      </Box>
    );
  }, [labelMode, showInnerLabels, showOuterLabels, minPercentThreshold, COLORS]); // Dependencies for ChartCard memoization

  const hasData = baseChartData.length > 0 || investedChartData.length > 0;

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Box sx={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: theme.spacing(3),
        py: 2
      }}>
        {/* Pass processed data to ChartCard */}
        <ChartCard title="🚀 Sector Mix" data={baseChartData} />
        <ChartCard title="⚡ Active Investments" data={investedChartData} />
      </Box>
    </Box>
  );
}