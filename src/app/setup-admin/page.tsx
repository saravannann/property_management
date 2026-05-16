'use client';

import React, { useState } from 'react';
import { Box, Button, Typography, Paper, Alert, CircularProgress } from '@mui/material';
import { Shield, ArrowRight, CheckCircle2 } from 'lucide-react';
import { setupFirstAdmin } from './actions';
import { useRouter } from 'next/navigation';

export default function SetupAdminPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSetup = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await setupFirstAdmin();
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error || 'Failed to create admin');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default', p: 3 }}>
      <Paper sx={{ p: 5, maxWidth: 450, width: '100%', textAlign: 'center', borderRadius: 4 }}>
        <Box sx={{ mb: 3, color: 'primary.main' }}>
          <Shield size={60} />
        </Box>
        
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
          Initial Setup
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          This will initialize the first Administrator account for your PropManager application.
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        
        {success ? (
          <Box>
            <Alert icon={<CheckCircle2 />} severity="success" sx={{ mb: 4, borderRadius: 2 }}>
              Admin account created successfully!
            </Alert>
            <Typography variant="body2" sx={{ mb: 3 }}>
              <strong>Mobile:</strong> 9962293848<br/>
              <strong>Password:</strong> password123
            </Typography>
            <Button 
              fullWidth 
              variant="contained" 
              size="large" 
              onClick={() => router.push('/login')}
              endIcon={<ArrowRight />}
            >
              Go to Login
            </Button>
          </Box>
        ) : (
          <Button 
            fullWidth 
            variant="contained" 
            size="large" 
            onClick={handleSetup}
            disabled={loading}
            sx={{ py: 2 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Create First Admin'}
          </Button>
        )}
      </Paper>
    </Box>
  );
}
