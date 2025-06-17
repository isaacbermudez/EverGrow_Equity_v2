import React, { useState } from 'react';
import { Button, Box, Alert, Paper, Typography, CircularProgress, Chip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { teal } from '@mui/material/colors';

export default function FileUpload({ onUpload, isDataLoaded, isLoading: propIsLoading }) {
  const [error, setError] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [internalIsLoading, setInternalIsLoading] = useState(false);

  const isLoading = propIsLoading || internalIsLoading;

  const processFile = async (file) => {
    if (!file) return;

    setInternalIsLoading(true);
    setError(null);

    if (!file.name.endsWith('.json')) {
      setError("Please upload a JSON file.");
      setInternalIsLoading(false);
      return;
    }

    try {
      const text = await file.text();
      const parsedData = JSON.parse(text); // Parse the JSON content

      // --- IMPORTANT CHANGE HERE ---
      // Instead of checking for Array, check if it's an object and contains expected keys
      if (typeof parsedData !== 'object' || parsedData === null) {
          throw new Error("Invalid JSON format. Expected a top-level object.");
      }
      if (!parsedData.Assets) {
          // You can refine this check based on whether 'Assets' is strictly mandatory
          // or if other top-level keys like 'Transactions'/'Deposits' are always expected.
          console.warn("Uploaded JSON does not contain an 'Assets' key at the top level. Proceeding with potentially empty assets.");
      }
      // --- END IMPORTANT CHANGE ---

      await onUpload(parsedData); // Pass the ENTIRE parsed object to onUpload
      setError(null);
    } catch (e) {
      console.error("File processing or upload error:", e);
      setError(`Error processing or uploading file: ${e.message}. Please check format or try again.`);
      // On error, send a default empty structure expected by App.jsx,
      // rather than just an empty array.
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
    e.target.value = null;
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDataLoaded && !isLoading) {
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

    if (isDataLoaded || isLoading) return;

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
            fontSize: '0.85rem',
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
            border: isDragOver ? '2px dashed #00C49F' : '2px dashed rgba(255,255,255,0.5)',
            backgroundColor: isDragOver ? teal[800] : 'transparent',
            textAlign: 'center',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease-in-out',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1,
            '&:hover': {
              backgroundColor: teal[800],
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
                  fontSize: '0.75rem',
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
          <Alert severity="error" sx={{ fontSize: '0.8rem', py: 0.5, px: 1 }}>{error}</Alert>
        </Box>
      )}
    </Box>
  );
}