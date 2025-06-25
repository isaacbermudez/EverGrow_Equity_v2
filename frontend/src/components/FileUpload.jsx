import React, { useState } from 'react';
import { Button, Box, Alert, Paper, Typography, CircularProgress, Chip, useTheme } from '@mui/material'; // Imported useTheme
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { teal } from '@mui/material/colors';

export default function FileUpload({ onUpload, isDataLoaded, isLoading: propIsLoading }) {
  const [error, setError] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [internalIsLoading, setInternalIsLoading] = useState(false);
  const theme = useTheme(); // Initialize useTheme hook

  const isLoading = propIsLoading || internalIsLoading;

  const processFile = async (file) => {
    if (!file) return;

    setInternalIsLoading(true);
    setError(null); // Clear previous errors

    if (!file.name.endsWith('.json')) {
      setError("Please upload a JSON file.");
      setInternalIsLoading(false);
      return;
    }

    try {
      const text = await file.text();
      let parsedData;
      try {
        parsedData = JSON.parse(text); // Attempt to parse the JSON content
      } catch (jsonParseError) {
        // Catch JSON parsing errors specifically with a custom message
        throw new Error(`Invalid JSON file content.`);
      }

      // Check if the parsed data is a top-level object
      if (typeof parsedData !== 'object' || parsedData === null || Array.isArray(parsedData)) {
          throw new Error("Invalid JSON format.");
      }
      
      // Optional: Check for presence of 'Assets' key, but don't error out if not strictly mandatory
      if (!parsedData.Assets) {
          console.warn("Uploaded JSON does not contain an 'Assets' key at the top level. Proceeding with potentially empty assets.");
      }
      // You can add similar warnings for 'Transactions' or 'Deposits' if their absence is notable but not fatal
      if (!parsedData.Transactions) {
        console.warn("Uploaded JSON does not contain a 'Transactions' key. Proceeding with potentially empty transactions.");
      }
      if (!parsedData.Deposits) {
        console.warn("Uploaded JSON does not contain a 'Deposits' key. Proceeding with potentially empty deposits.");
      }


      await onUpload(parsedData); // Pass the ENTIRE parsed object to onUpload
      // If upload is successful, error is already null from the start of processFile
    } catch (e) {
      console.error("File processing or upload error:", e);
      // Set the error state directly to the custom message thrown by the inner try/catch or format check.
      // This avoids prepending "Error processing file:"
      setError(e.message); 
      
      // On error, send a default empty structure expected by App.jsx,
      // rather than just an empty array, to prevent further issues.
      onUpload({ Assets: [], Transactions: [], Deposits: [] }); 
    } finally {
      setInternalIsLoading(false);
    }
  };

  const handleFile = async (e) => {
    const f = e.target.files[0];
    if (f) {
      await processFile(f);
    }
    e.target.value = null; // Clear the input so same file can be re-selected
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDataLoaded && !isLoading) { // Prevent drag over while data is loaded or loading
      setIsDragOver(true);
    }
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

    if (isDataLoaded || isLoading) return; // Prevent drop while data is loaded or loading

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await processFile(files[0]);
    }
  };

  return (
    <Box mb={1} sx={{ width: '100%' }}>
      {isDataLoaded ? (
        <Chip
          icon={<CheckCircleIcon sx={{ color: 'white' }} />}
          label="Data Loaded"
          sx={{
            backgroundColor: teal[700],
            color: 'white',
            border: '1px solid rgba(255,255,255,0.3)',
            width: '100%',
            justifyContent: 'flex-start',
            cursor: 'default',
            fontSize: '0.7rem',
            py: 0.5,
          }}
        />
      ) : (
        <Paper
          elevation={isDragOver ? 4 : 1}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          sx={{
            p: 1.5,
            border: isDragOver ? '2px dashed #00BCD4' : '2px dashed rgba(255,255,255,0.5)',
            backgroundColor: isDragOver ? theme.palette.background.paper : 'transparent', // Use theme color
            textAlign: 'center',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease-in-out',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1,
            '&:hover': {
              backgroundColor: theme.palette.background.paper, // Use theme color on hover
              borderColor: teal[500],
            },
          }}
        >
          {isLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <CircularProgress size={24} sx={{ color: 'white' }} />
              <Typography variant="caption" sx={{ mt: 1, color: 'white' }}>
                Processing...
              </Typography>
            </Box>
          ) : (
            <>
              <CloudUploadIcon sx={{ fontSize: 32, color: 'white' }} />
              <Typography variant="caption" sx={{ color: 'white' }}>
                Drag & Drop
              </Typography>

              <Button
                variant="contained"
                component="label"
                disabled={isLoading}
                sx={{
                  backgroundColor: teal[600],
                  '&:hover': { backgroundColor: teal[500] },
                  color: 'white',
                  textTransform: 'none',
                  fontSize: '0.7rem',
                  px: 1.5,
                  py: 0.5,
                }}
              >
                Upload JSON
                <input
                  hidden
                  id="file-input"
                  type="file"
                  accept=".json"
                  onChange={handleFile}
                  disabled={isLoading}
                />
              </Button>
            </>
          )}
        </Paper>
      )}

      {error && (
        <Box mt={1}>
          <Alert
            severity="error"
            sx={{
              bgcolor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.error.main}`,
              borderRadius: 2,
              color: theme.palette.text.primary,
              fontSize: '0.7rem',
              py: 1,
              px: 1.5,
              '& .MuiAlert-icon': {
                color: theme.palette.error.light,
              },
              '& .MuiAlert-message': {
                color: theme.palette.text.primary,
                fontWeight: 500,
              }
            }}
          >
            <Typography variant="body2" sx={{ color: theme.palette.text.primary }}>{error}</Typography>
          </Alert>
        </Box>
      )}
    </Box>
  );
}
