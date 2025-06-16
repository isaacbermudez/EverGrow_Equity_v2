// src/components/ChatWidget.jsx
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  CircularProgress,
  IconButton,
  Fab,
  Chip,
  Fade,
  Slide,
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import SendIcon from '@mui/icons-material/Send';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import CloseIcon from '@mui/icons-material/Close';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

// Dark theme configuration
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#6366f1',
      light: '#818cf8',
      dark: '#4f46e5',
    },
    secondary: {
      main: '#f59e0b',
      light: '#fbbf24',
      dark: '#d97706',
    },
    background: {
      default: '#1a1a1a',
      paper: '#2d2d2d',
    },
    text: {
      primary: '#f5f5f5',
      secondary: '#a3a3a3',
    },
    divider: '#404040',
    action: {
      hover: '#374151',
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#374151',
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#6366f1',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#818cf8',
            },
          },
        },
      },
    },
  },
});

// Memoized message component for performance
const MessageBubble = React.memo(({ message, index }) => {
  const isUser = message.role === 'user';
  
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        mb: 1.5,
        animation: 'fadeInUp 0.3s ease-out',
        '@keyframes fadeInUp': {
          from: {
            opacity: 0,
            transform: 'translateY(10px)',
          },
          to: {
            opacity: 1,
            transform: 'translateY(0)',
          },
        },
      }}
    >
      <Paper
        elevation={2}
        sx={{
          p: 1.5,
          borderRadius: 3,
          maxWidth: '85%',
          wordBreak: 'break-word',
          bgcolor: isUser ? 'primary.main' : 'background.paper',
          color: isUser ? 'white' : 'text.primary',
          border: isUser ? 'none' : '1px solid',
          borderColor: 'divider',
          position: 'relative',
          '&::before': isUser ? {} : {
            content: '""',
            position: 'absolute',
            top: 10,
            left: -8,
            width: 0,
            height: 0,
            borderTop: '8px solid transparent',
            borderBottom: '8px solid transparent',
            borderRight: '8px solid',
            borderRightColor: 'background.paper',
          },
          '&::after': isUser ? {
            content: '""',
            position: 'absolute',
            top: 10,
            right: -8,
            width: 0,
            height: 0,
            borderTop: '8px solid transparent',
            borderBottom: '8px solid transparent',
            borderLeft: '8px solid',
            borderLeftColor: 'primary.main',
          } : {},
        }}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={{
            p: ({ node, ...props }) => (
              <Typography 
                variant="body2" 
                component="p" 
                sx={{ 
                  m: 0, 
                  lineHeight: 1.5,
                  '&:not(:last-child)': { mb: 1 }
                }} 
                {...props} 
              />
            ),
            table: ({ node, ...props }) => (
              <Box sx={{ overflowX: 'auto', my: 1, borderRadius: 1 }}>
                <table 
                  style={{ 
                    width: '100%', 
                    borderCollapse: 'collapse', 
                    border: '1px solid #404040',
                    backgroundColor: '#1a1a1a'
                  }} 
                  {...props} 
                />
              </Box>
            ),
            th: ({ node, ...props }) => (
              <th 
                style={{ 
                  border: '1px solid #404040', 
                  padding: '12px 8px', 
                  backgroundColor: '#374151', 
                  textAlign: 'left',
                  fontWeight: 600
                }} 
                {...props} 
              />
            ),
            td: ({ node, ...props }) => (
              <td 
                style={{ 
                  border: '1px solid #404040', 
                  padding: '8px' 
                }} 
                {...props} 
              />
            ),
            a: ({ node, ...props }) => (
              <a 
                style={{ 
                  color: '#818cf8', 
                  textDecoration: 'underline',
                  '&:hover': { color: '#6366f1' }
                }} 
                target="_blank" 
                rel="noopener noreferrer" 
                {...props} 
              />
            ),
            code: ({ node, inline, ...props }) => (
              <Box
                component={inline ? 'span' : 'pre'}
                sx={{
                  bgcolor: '#1a1a1a',
                  color: '#f59e0b',
                  p: inline ? 0.5 : 1,
                  borderRadius: 1,
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  border: '1px solid #404040',
                  display: inline ? 'inline' : 'block',
                  overflowX: 'auto',
                  whiteSpace: inline ? 'nowrap' : 'pre',
                }}
                {...props}
              />
            ),
          }}
        >
          {message.content}
        </ReactMarkdown>
      </Paper>
    </Box>
  );
});

MessageBubble.displayName = 'MessageBubble';

const ChatWidget = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [tokenLimit, setTokenLimit] = useState(null);
  const [tokensRemaining, setTokensRemaining] = useState(null);
  const [tokenReset, setTokenReset] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Focus input when widget opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      const timer = setTimeout(() => {
        inputRef.current.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Memoized send message handler
  const handleSendMessage = useCallback(async () => {
    if (inputMessage.trim() === '' || isLoading) return;

    const newUserMessage = { role: 'user', content: inputMessage.trim() };
    setMessages((prevMessages) => [...prevMessages, newUserMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: newUserMessage.content,
          history: conversationHistory,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response from AI.');
      }

      const assistantMessage = { role: 'assistant', content: data.response };
      setMessages((prevMessages) => [...prevMessages, assistantMessage]);

      if (data.rateLimits) {
        setTokenLimit(data.rateLimits.limitTokens);
        setTokensRemaining(data.rateLimits.remainingTokens);
        setTokenReset(data.rateLimits.resetTokens);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prevMessages) => [
        ...prevMessages,
        { role: 'assistant', content: `❌ Error: ${error.message}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [inputMessage, messages, isLoading]);

  // Optimized key press handler
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage, isLoading]);

  const toggleWidget = useCallback(() => {
    setIsOpen(!isOpen);
  }, [isOpen]);

  // Memoized token chips
  const tokenChips = useMemo(() => {
    if (tokenLimit === null && tokensRemaining === null) return null;

    return (
      <Box sx={{
        p: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 0.5,
        bgcolor: 'action.hover',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}>
        {tokensRemaining !== null && (
          <Chip
            label={`Tokens: ${tokensRemaining.toLocaleString()}`}
            size="small"
            color={
              tokensRemaining < 200 ? "error" :
                tokensRemaining < (tokenLimit * 0.2) ? "warning" :
                  "success"
            }
            variant="filled"
            sx={{ fontWeight: 500 }}
          />
        )}
        {tokenLimit !== null && (
          <Chip
            label={`Limit: ${tokenLimit.toLocaleString()}`}
            size="small"
            color="info"
            variant="outlined"
          />
        )}
        {tokenReset !== null && (
          <Chip
            label={`Reset: ${tokenReset}s`}
            size="small"
            color="default"
            variant="outlined"
          />
        )}
      </Box>
    );
  }, [tokenLimit, tokensRemaining, tokenReset]);

  return (
    <ThemeProvider theme={darkTheme}>
      <Fab
        color="primary"
        aria-label="chat"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1300,
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          boxShadow: '0px 8px 25px rgba(99, 102, 241, 0.3)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: '0px 12px 35px rgba(99, 102, 241, 0.4)',
            transform: 'translateY(-2px)',
          },
        }}
        onClick={toggleWidget}
      >
        {isOpen ? <CloseIcon /> : <ChatBubbleOutlineIcon />}
      </Fab>

      <Slide direction="up" in={isOpen} mountOnEnter unmountOnExit>
        <Paper
          elevation={24}
          sx={{
            position: 'fixed',
            bottom: 100,
            right: 24,
            width: { xs: '90%', sm: 500 },
            height: 600,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 3,
            overflow: 'hidden',
            zIndex: 1200,
            bgcolor: 'background.paper',
            boxShadow: '0px 20px 60px rgba(0, 0, 0, 0.5)',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          {/* Header */}
          <Box sx={{
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            color: 'white',
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
          }}>
            <Typography variant="h6" sx={{ 
              flexGrow: 1, 
              textAlign: 'center', 
              fontWeight: 600,
              fontSize: '1.1rem'
            }}>
              🚀 DeepDive Stocks
            </Typography>
            <IconButton 
              size="small" 
              onClick={toggleWidget} 
              sx={{ 
                color: 'white',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Token Status */}
          <Fade in={Boolean(tokenChips)} timeout={300}>
            <div>{tokenChips}</div>
          </Fade>

          {/* Messages Container */}
          <Box
            sx={{
              flexGrow: 1,
              overflowY: 'auto',
              p: 2,
              bgcolor: 'background.default',
              '&::-webkit-scrollbar': {
                width: '6px',
              },
              '&::-webkit-scrollbar-track': {
                bgcolor: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                bgcolor: 'primary.main',
                borderRadius: '3px',
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
              },
            }}
          >
            {messages.length === 0 && (
              <Box sx={{ 
                textAlign: 'center', 
                mt: 4,
                opacity: 0.7
              }}>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                  💬 Ready to chat!
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Ask me anything about stocks, markets, or trading strategies.
                </Typography>
              </Box>
            )}
            
            {messages.map((msg, index) => (
              <MessageBubble key={index} message={msg} index={index} />
            ))}
            
            {isLoading && (
              <Fade in={isLoading}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 1.5 }}>
                  <Paper 
                    elevation={1}
                    sx={{ 
                      p: 1.5, 
                      borderRadius: 3, 
                      bgcolor: 'background.paper',
                      border: '1px solid',
                      borderColor: 'divider',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}
                  >
                    <CircularProgress size={16} sx={{ color: 'primary.main' }} />
                    <Typography variant="body2" color="text.secondary">
                      Thinking...
                    </Typography>
                  </Paper>
                </Box>
              </Fade>
            )}
            <div ref={messagesEndRef} />
          </Box>

          {/* Input Area */}
          <Box sx={{ 
            p: 2, 
            borderTop: '1px solid', 
            borderColor: 'divider', 
            bgcolor: 'background.paper'
          }}>
            <TextField
              ref={inputRef}
              fullWidth
              multiline
              maxRows={3}
              variant="outlined"
              size="small"
              placeholder="Type your message..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={handleSendMessage}
                    disabled={isLoading || inputMessage.trim() === ''}
                    size="small"
                    sx={{ 
                      ml: 1,
                      color: 'primary.main',
                      '&:hover': { 
                        bgcolor: 'primary.main',
                        color: 'white',
                      },
                      '&:disabled': {
                        color: 'text.disabled',
                      },
                      transition: 'all 0.2s ease-in-out',
                    }}
                  >
                    {isLoading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <SendIcon fontSize="small" />
                    )}
                  </IconButton>
                ),
              }}
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />
          </Box>
        </Paper>
      </Slide>
    </ThemeProvider>
  );
};

export default ChatWidget;