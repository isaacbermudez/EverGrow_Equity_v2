// src/components/PortfolioCharts.jsx
import React, { useState } from 'react';
import {
  Box,
  Typography,
  useTheme,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip as MuiTooltip,
  Switch,
  FormControlLabel,
  ButtonGroup,
  Button
} from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Zap, Eye, Percent, DollarSign, Tag } from 'lucide-react';
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

  switch (labelMode) {
    case 'name':
      labelText = name.length > 5 ? `${name.substring(0, 10)}...` : name;
      subText = `$${Math.ceil(value)}`;
      break;
    /*case 'percentage':
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
        y={subText ? y - 12 : y - 8}
        width={textWidth}
        height={subText ? "24" : "16"}
        fill="rgba(0, 0, 0, 0.8)"
        rx="4"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="1"
      />

      {/* Main label text */}
      <text
        x={isLeft ? x - textWidth / 2 : x + textWidth / 2}
        y={subText ? y - 2 : y}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="11"
        fontWeight="600"
        fill="white"
      >
        {labelText}
      </text>

      {/* Sub text */}
      {subText && (
        <text
          x={isLeft ? x - textWidth / 2 : x + textWidth / 2}
          y={y + 8}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="9"
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
  const [categoryFilter, setCategoryFilter] = useState('SATELLITES');
  const [labelMode, setLabelMode] = useState('name');
  const [showInnerLabels, setShowInnerLabels] = useState(true);
  const [showOuterLabels, setShowOuterLabels] = useState(true);
  const [minPercentThreshold, setMinPercentThreshold] = useState(0);

  const filteredRows = rows.filter(stock => categoryFilter === 'ALL' || stock.category === categoryFilter);

  const totalValue = filteredRows.reduce((acc, stock) => acc + (safeNum(stock.currentPrice) * safeNum(stock.holdings)), 0);
  const totalInvestedAmount = filteredRows.reduce((acc, stock) => acc + safeNum(stock.CI), 0);

  const sectorData = filteredRows.reduce((acc, stock) => {
    const sector = stock.sector || 'Uncategorized';
    const marketValue = safeNum(stock.currentPrice) * safeNum(stock.holdings);
    acc[sector] = (acc[sector] || 0) + marketValue;
    return acc;
  }, {});

  const baseChartData = Object.entries(sectorData)
    .map(([name, value]) => ({ name, value, total: totalValue }))
    .filter(entry => entry.value > 0)
    .sort((a, b) => b.value - a.value);

  const investedChartData = filteredRows
    .map(stock => ({
      name: stock.symbol || 'N/A',
      value: safeNum(stock.CI),
      total: totalInvestedAmount
    }))
    .filter(e => e.value > 0)
    .sort((a, b) => b.value - a.value);

  const ChartCard = ({ title, data, dataKey = 'value' }) => {
    const [activeItems, setActiveItems] = useState(data.map(() => true));
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
                data={visibleData}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={100}
                dataKey={dataKey}
                labelLine={false}
                label={showOuterLabels ? (props) => renderAdvancedLabel(props, labelMode, minPercentThreshold) : false}

              >
                {visibleData.map((entry, i) => (
                  <Cell
                    key={`cell-${entry.name}`}
                    fill={COLORS[entry.index % COLORS.length]}
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              {showInnerLabels && (
                <Pie
                  data={visibleData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={100}
                  dataKey={dataKey}
                  labelLine={false}
                  label={(props) => renderInnerLabel(props, showInnerLabels, 8)}
                  fill="transparent"
                  stroke='transparent'
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
  };

  const hasData = baseChartData.length > 0 || investedChartData.length > 0;

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Box sx={{ mb: 3, textAlign: 'center' }}>
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
            justifyContent: 'center',
            mb: 3
          }}
        >
          <Zap size={28} color="#f9a825" style={{ marginRight: 12 }} />
          Portfolio Dashboard
        </Typography>

        {hasData && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
            {/* Category Filter */}
            <ToggleButtonGroup
              color="primary"
              value={categoryFilter}
              exclusive
              onChange={(e, newValue) => newValue && setCategoryFilter(newValue)}
              size="small"
              sx={{
                '& .MuiToggleButton-root': {
                  color: 'rgba(255,255,255,0.8)',
                  borderColor: 'rgba(255,255,255,0.3)',
                  '&.Mui-selected': {
                    backgroundColor: teal[600],
                    color: 'white'
                  }
                }
              }}
            >
              <ToggleButton value="ALL">All Holdings</ToggleButton>
              <ToggleButton value="ETF">ETFs</ToggleButton>
              <ToggleButton value="SATELLITES">Satellites</ToggleButton>
            </ToggleButtonGroup>

            {/* Label Controls */}
            <Box sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 2,
              alignItems: 'center',
              p: 2,
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderRadius: 2,
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              {/* Label Mode Selector */}
              <ButtonGroup size="small" variant="outlined">
                {[
                  //{ value: 'percentage', icon: Percent, label: '%' },
                  //{ value: 'value', icon: DollarSign, label: '$' },
                  //{ value: 'name', icon: Tag, label: 'Name' },
                  //{ value: 'full', icon: Eye, label: 'Full' }
                ].map(({ value, icon: Icon, label }) => (
                  <Button
                    key={value}
                    onClick={() => setLabelMode(value)}
                    variant={labelMode === value ? 'contained' : 'outlined'}
                    startIcon={<Icon size={14} />}
                    sx={{
                      color: labelMode === value ? 'white' : 'rgba(255,255,255,0.7)',
                      borderColor: 'rgba(255,255,255,0.3)',
                      backgroundColor: labelMode === value ? teal[600] : 'transparent',
                      fontSize: '0.75rem'
                    }}
                  >
                    {label}
                  </Button>
                ))}
              </ButtonGroup>

              {/* Toggle Switches */}
              <FormControlLabel
                control={
                  <Switch
                    checked={showOuterLabels}
                    onChange={(e) => setShowOuterLabels(e.target.checked)}
                    size="small"
                    sx={{ '& .MuiSwitch-thumb': { backgroundColor: teal[400] } }}
                  />
                }
                label={<Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>Outer Labels</Typography>}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={showInnerLabels}
                    onChange={(e) => setShowInnerLabels(e.target.checked)}
                    size="small"
                    sx={{ '& .MuiSwitch-thumb': { backgroundColor: teal[400] } }}
                  />
                }
                label={<Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>Inner Labels</Typography>}
              />

              {/* Threshold Selector */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  Min %:
                </Typography>
                <ButtonGroup size="small">
                  {/* New "All" button */}
                  <Button
                    onClick={() => setMinPercentThreshold(0)}
                    variant={minPercentThreshold === 0 ? 'contained' : 'outlined'}
                    sx={{
                      minWidth: 35,
                      color: minPercentThreshold === 0 ? 'white' : 'rgba(255,255,255,0.7)',
                      borderColor: 'rgba(255,255,255,0.3)',
                      backgroundColor: minPercentThreshold === 0 ? teal[600] : 'transparent',
                      fontSize: '0.7rem'
                    }}
                  >
                    All
                  </Button>
                  {[5, 10].map(threshold => (
                    <Button
                      key={threshold}
                      onClick={() => setMinPercentThreshold(threshold)}
                      variant={minPercentThreshold === threshold ? 'contained' : 'outlined'}
                      sx={{
                        minWidth: 35,
                        color: minPercentThreshold === threshold ? 'white' : 'rgba(255,255,255,0.7)',
                        borderColor: 'rgba(255,255,255,0.3)',
                        backgroundColor: minPercentThreshold === threshold ? teal[600] : 'transparent',
                        fontSize: '0.7rem'
                      }}
                    >
                      {threshold}%
                    </Button>
                  ))}
                </ButtonGroup>
              </Box>
            </Box>
          </Box>
        )}
      </Box>

      <Box sx={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: theme.spacing(3),
        py: 2
      }}>
        <ChartCard title="🚀 Sector Mix" data={baseChartData} />
        <ChartCard title="⚡ Active Investments" data={investedChartData} />
      </Box>
    </Box>
  );
}
