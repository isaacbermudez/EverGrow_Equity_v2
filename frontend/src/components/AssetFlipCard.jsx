import React, { useState } from 'react';
import { Box, IconButton, Typography, useTheme, Divider } from '@mui/material';
import FlipIcon from '@mui/icons-material/Flip';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function AssetFlipCard({ stock, assetImageSrc, sx }) {
    const theme = useTheme();
    const [isFlipped, setIsFlipped] = useState(false);
    // Helper for safe number formatting
    const safeNum = (n) => (typeof n === 'number' || typeof n === 'string' && !isNaN(parseFloat(n)) ? parseFloat(n) : 0);

    const isPos = safeNum(stock.profitLoss) >= 0;

    const handleFlip = () => {
        setIsFlipped(!isFlipped);
    };

    const getProfitLossColor = (value) => {
        if (value > 0) return theme.palette.success.main;
        if (value < 0) return theme.palette.error.main;
        return theme.palette.text.primary;
    };

    return (
        <Box
            sx={{
                perspective: '1000px',
                width: '200px',
                height: '200px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                ...sx,
            }}
        >
            <Box
                sx={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    transition: 'transform 0.8s',
                    transformStyle: 'preserve-3d',
                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                }}
            >
                {/* Front Face - Core Overview */}
                <Box
                    sx={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        backfaceVisibility: 'hidden',
                        bgcolor: theme.palette.background.paper,
                        borderRadius: theme.shape.borderRadius,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        boxShadow: theme.shadows[3],
                        zIndex: 2,
                        color: theme.palette.text.primary,
                        border: `1px solid ${theme.palette.divider}`,
                        padding: theme.spacing(1.5),
                    }}
                >
                    {/* Top Section: Image, Symbol */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexGrow: 1, justifyContent: 'center' }}>
                        {assetImageSrc && (
                            <Box
                                component="img"
                                src={assetImageSrc}
                                alt={stock?.symbol || 'Asset'}
                                sx={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: '50%',
                                    mb: 0.5,
                                }}
                            />
                        )}

                        <Typography
                            variant="body1"
                            fontWeight="600"
                            sx={{
                                mb: 0.3,
                                fontSize: '0.95rem',
                                letterSpacing: '0.02em'
                            }}
                        >
                            {stock?.symbol || 'N/A'}
                        </Typography>

                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                                mb: 0.8,
                                fontSize: '0.85rem',
                                fontWeight: 400,
                                color: getProfitLossColor(stock?.profitLoss),
                            }}
                        >
                            {/* P/L Trend Icon */}
                            {isPos ? (
                                <TrendingUp sx={{ color: theme.palette.success.main, fontSize: 30 }} />
                            ) : (
                                <TrendingDown sx={{ color: theme.palette.error.main, fontSize: 30 }} />
                            )}
                        </Typography>

                        <Divider sx={{ width: '60%', mb: 0.8, opacity: 0.6 }} />

                        {/* Profit/Loss Section */}
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography
                                variant="body2"
                                fontWeight="500"
                                sx={{
                                    color: getProfitLossColor(stock?.profitLoss),
                                    mb: 0.1,
                                    fontSize: '0.9rem'
                                }}
                            >
                                ${stock?.profitLoss?.toFixed(2) || '0.00'}
                            </Typography>
                            <Typography
                                variant="caption"
                                fontWeight="400"
                                sx={{
                                    color: getProfitLossColor(stock?.profitLossPct),
                                    fontSize: '0.8rem',
                                    opacity: 0.8
                                }}
                            >
                                {stock?.profitLossPct > 0 ? '+' : ''}{stock?.profitLossPct?.toFixed(2) || '0.00'}%
                            </Typography>
                        </Box>
                    </Box>

                    {/* Flip Button */}
                    <IconButton
                        onClick={handleFlip}
                        sx={{
                            alignSelf: 'center',
                            mt: 0.5,
                            background: 'linear-gradient(100deg, #00BCD4, #9C27B0)',
                            color: theme.palette.primary.contrastText,
                            '&:hover': {
                                bgcolor: theme.palette.primary.dark,
                            },
                            zIndex: 3,
                            width: 26,
                            height: 26,
                        }}
                        aria-label="Flip card for details"
                    >
                        <FlipIcon sx={{ fontSize: '0.8rem' }} />
                    </IconButton>
                </Box>

                {/* Back Face - Detailed Information */}
                <Box
                    sx={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        backfaceVisibility: 'hidden',
                        bgcolor: theme.palette.background.paper,
                        borderRadius: theme.shape.borderRadius,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        alignItems: 'stretch',
                        boxShadow: theme.shadows[3],
                        transform: 'rotateY(180deg)',
                        zIndex: 1,
                        color: theme.palette.text.primary,
                        border: `1px solid ${theme.palette.divider}`,
                        padding: theme.spacing(1.5),
                    }}
                >
                    {/* Header */}
                    <Typography
                        variant="body2"
                        fontWeight="500"
                        sx={{
                            mb: 1,
                            textAlign: 'center',
                            fontSize: '0.9rem',
                            color: theme.palette.text.primary
                        }}
                    >
                        {stock?.symbol || 'N/A'}
                    </Typography>


                    {/* Detailed Stock Information - Flexbox Layout */}
                    <Box sx={{ width: '100%' }}>
                        {[
                            // ['Category:', stock?.category || 'N/A'],
                            // ['Sector:', stock?.sector || 'N/A'],
                            ['Holdings:', stock?.holdings || '0'],
                            ['Price:', `$${stock?.currentPrice?.toFixed(2) || '0.00'}`],
                            ['Invested:', `$${stock?.CI?.toFixed(2) || '0.00'}`],
                            ['Market:', `$${stock?.marketValue?.toFixed(2) || '0.00'}`]
                        ].map(([label, value], index) => (
                            <Box key={index} sx={{
                                display: 'flex',
                                mb: theme.spacing(0.4)
                            }}>
                                <Typography variant="caption" sx={{
                                    color: 'yellow',
                                    fontSize: '0.7rem',
                                    opacity: 0.7,
                                    textAlign: 'right',
                                    flexBasis: '50%', // Takes up half the space
                                    paddingRight: theme.spacing(0.5)
                                }}>
                                    {label}
                                </Typography>
                                <Typography variant="caption" sx={{
                                    color: theme.palette.text.primary,
                                    fontSize: '0.7rem',
                                    fontWeight: 400,
                                    textAlign: 'left',
                                    flexBasis: '50%', // Takes up half the space
                                    paddingLeft: theme.spacing(0.5)
                                }}>
                                    {value}
                                </Typography>
                            </Box>
                        ))}
                    </Box>

                    {/* Flip Button */}
                    <IconButton
                        onClick={handleFlip}
                        sx={{
                            alignSelf: 'center',
                            mt: 0.5,
                            background: 'linear-gradient(100deg, #00BCD4, #9C27B0)',
                            color: theme.palette.primary.contrastText,
                            '&:hover': {
                                bgcolor: theme.palette.primary.dark,
                            },
                            zIndex: 3,
                            width: 26,
                            height: 26,
                        }}
                        aria-label="Flip card for overview"
                    >
                        <FlipIcon sx={{ fontSize: '0.8rem' }} />
                    </IconButton>
                </Box>
            </Box>
        </Box>
    );
}