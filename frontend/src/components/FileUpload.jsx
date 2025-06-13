import React, { useState } from 'react';
import { Button, Box, Alert, Paper, Typography, CircularProgress } from '@mui/material';

export default function FileUpload({ onUpload }) {
  const [error, setError] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const processFile = async (file) => {
    if (!file) return;

    setIsLoading(true); // Set loading to true when processing starts
    setError(null); // Clear previous errors

    if (!file.name.endsWith('.json')) {
      setError("Please upload a JSON file.");
      // No need to call onUpload here as it's a frontend validation error
      setIsLoading(false); // Set loading to false if there's an error
      return;
    }
    
    try {
      const text = await file.text();
      const arr = JSON.parse(text);
      if (!Array.isArray(arr)) throw new Error("Not an array");

      // --- CRITICAL CHANGE HERE ---
      // Await the onUpload function.
      // onUpload MUST return a Promise that resolves when the backend call is complete.
      await onUpload(arr); // Now processFile waits for onUpload to finish

      setError(null); // Clear error if everything succeeded
    } catch (e) {
      // Catch errors from file parsing AND from the onUpload promise rejection
      console.error("File processing or upload error:", e);
      setError("Error processing or uploading file. Please check format or try again.");
      onUpload([]); // You might still want to call onUpload with an empty array on error
    } finally {
      setIsLoading(false); // Set loading to false when all operations (frontend and backend) finish
    }
  };

  const handleFile = async (e) => {
    const f = e.target.files[0];
    await processFile(f);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await processFile(files[0]);
    }
  };

  return (
    <Box mb={3}>
      <Paper
        elevation={isDragOver ? 4 : 1}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        sx={{
          p: 3,
          border: isDragOver ? '2px dashed #1976d2' : '2px dashed #ccc',
          backgroundColor: isDragOver ? '#f3f8ff' : '#fafafa',
          textAlign: 'center',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: '#f5f5f5',
            borderColor: '#999'
          }
        }}
      >
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100px' }}>
            <CircularProgress />
            <Typography variant="body1" color="textSecondary" ml={2}>
              Processing Assets...
            </Typography>
          </Box>
        ) : (
          <>
            <Typography variant="body1" color="textSecondary" mb={2}>
              Drag and drop your JSON file here, or click to browse
            </Typography>
            
            <Button
              variant="contained"
              component="label"
              disabled={isLoading}
              sx={{ mb: 1 }}
            >
              Upload Portfolio JSON
              <input
                hidden
                type="file"
                accept=".json"
                onChange={handleFile}
              />
            </Button>
          </>
        )}
      </Paper>
      
      {error && (
        <Box mt={2}>
          <Alert severity="error">{error}</Alert>
        </Box>
      )}
    </Box>
  );
}