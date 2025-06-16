// src/components/ChatWidget.jsx
import React, { useState, useRef, useEffect } from 'react';
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
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import CloseIcon from '@mui/icons-material/Close';

// --- NEW IMPORTS FOR MARKDOWN ---
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
// --- END NEW IMPORTS ---

const ChatWidget = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const [tokenLimit, setTokenLimit] = useState(null);
  const [tokensRemaining, setTokensRemaining] = useState(null);
  const [tokenReset, setTokenReset] = useState(null);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (inputMessage.trim() === '') return;

    const newUserMessage = { role: 'user', content: inputMessage };
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
        { role: 'assistant', content: `Error: ${error.message}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSendMessage();
    }
  };

  const toggleWidget = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      <Fab
        color="primary"
        aria-label="chat"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1300,
          boxShadow: 6,
          '&:hover': {
            boxShadow: 8,
          },
        }}
        onClick={toggleWidget}
      >
        {isOpen ? <CloseIcon /> : <ChatBubbleOutlineIcon />}
      </Fab>

      {isOpen && (
        <Paper
          elevation={10}
          sx={{
            position: 'fixed',
            bottom: 100,
            right: 24,
            width: { xs: '90%', sm: 350 },
            height: 600,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 2,
            overflow: 'hidden',
            zIndex: 1200,
            bgcolor: 'background.paper',
            boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.3)',
          }}
        >
          <Box sx={{
            bgcolor: 'primary.main',
            color: 'white',
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
          }}>
            <Typography variant="h6" sx={{ flexGrow: 1, textAlign: 'center', fontWeight: 'bold' }}>
              DeepDive Stocks
            </Typography>
            <IconButton size="small" onClick={toggleWidget} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </Box>

          {(tokenLimit !== null || tokensRemaining !== null) && (
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
                          label={`Tokens: ${tokensRemaining}`}
                          size="small"
                          color={
                            tokensRemaining < 200 ? "error" :
                            tokensRemaining < (tokenLimit * 0.2) ? "warning" :
                            "info"
                          }
                          variant="outlined"
                      />
                  )}
                  {tokenLimit !== null && (
                      <Chip
                          label={`Límite: ${tokenLimit}`}
                          size="small"
                          color="default"
                          variant="outlined"
                      />
                  )}
                  {tokenReset !== null && (
                      <Chip
                          label={`Restablece en: ${tokenReset}s`}
                          size="small"
                          color="default"
                          variant="outlined"
                      />
                  )}
              </Box>
          )}

          <Box
            sx={{
              flexGrow: 1,
              overflowY: 'auto',
              p: 2,
              bgcolor: 'background.default',
            }}
          >
            {messages.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 2 }}>
                Start a conversation!
              </Typography>
            )}
            {messages.map((msg, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  mb: 1,
                }}
              >
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1.2,
                    borderRadius: 2,
                    maxWidth: '80%',
                    wordBreak: 'break-word',
                    bgcolor: msg.role === 'user' ? 'primary.light' : 'secondary.light',
                    color: msg.role === 'user' ? 'white' : 'text.primary',
                  }}
                >
                  {/* --- NEW: Use ReactMarkdown to render content --- */}
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    components={{
                        // Optional: Customize rendering for specific HTML/Markdown elements
                        // For example, to apply Material-UI typography to paragraphs:
                        p: ({node, ...props}) => <Typography variant="body2" component="p" {...props} />,
                        table: ({node, ...props}) => (
                            <Box sx={{ overflowX: 'auto', my: 1 }}> {/* Add scroll for wide tables */}
                                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }} {...props} />
                            </Box>
                        ),
                        th: ({node, ...props}) => <th style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f2f2f2', textAlign: 'left' }} {...props} />,
                        td: ({node, ...props}) => <td style={{ border: '1px solid #ddd', padding: '8px' }} {...props} />,
                        a: ({node, ...props}) => <a style={{ color: 'blue', textDecoration: 'underline' }} target="_blank" rel="noopener noreferrer" {...props} />,
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                  {/* --- END NEW --- */}
                </Paper>
              </Box>
            ))}
            {isLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 1 }}>
                    <Paper variant="outlined" sx={{ p: 1.2, borderRadius: 2, bgcolor: 'action.hover' }}>
                        <CircularProgress size={20} sx={{ mr: 1 }} />
                        <Typography variant="body2" component="span">Thinking...</Typography>
                    </Paper>
                </Box>
            )}
            <div ref={messagesEndRef} />
          </Box>

          <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              placeholder="Type your message..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              InputProps={{
                endAdornment: (
                  <Button
                    onClick={handleSendMessage}
                    disabled={isLoading || inputMessage.trim() === ''}
                    sx={{ minWidth: 'auto', p: 0.5 }}
                  >
                    {isLoading ? <CircularProgress size={20} /> : <SendIcon color="primary" />}
                  </Button>
                ),
              }}
              sx={{ '& fieldset': { borderRadius: 2 } }}
            />
          </Box>
        </Paper>
      )}
    </>
  );
};

export default ChatWidget;