'use client';

import React, { useState } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  TextField, 
  Button, 
  InputAdornment, 
  IconButton, 
  Paper, 
  Checkbox, 
  FormControlLabel, 
  Link as MuiLink,
  Alert,
  CircularProgress,
  alpha,
  useTheme
} from '@mui/material';
import { 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  Building2,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const theme = useTheme();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
    rememberMe: false
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Basic validation
    if (!formData.phone || !formData.password) {
      setError('Please enter both mobile number and password');
      setLoading(false);
      return;
    }

    try {
      let phone = formData.phone.trim();
      
      // Auto-format Indian numbers if 10 digits are entered
      if (/^\d{10}$/.test(phone)) {
        phone = '+91' + phone;
      } else if (!phone.startsWith('+')) {
        if (/^\d+$/.test(phone)) {
          phone = '+' + phone;
        }
      }
      
      console.log('Attempting login for phone:', phone);

      // 1. Get the actual email (virtual or real) from the profiles table via RPC
      let email: string | null = null;
      
      try {
        const { data: rpcEmail, error: rpcError } = await supabase.rpc('get_email_by_phone', { 
          p_phone: phone 
        });
        if (!rpcError) email = rpcEmail;
      } catch (e) {
        console.warn('RPC check failed, trying fallback...');
      }

      // Fallback: If RPC failed or returned nothing, try the virtual email format directly
      // This is especially useful for newly added managers
      if (!email) {
        const virtualEmail = `${phone.replace('+', '')}@mobile.user`;
        
        // We can verify if this user exists in auth or profiles if we want, 
        // but trying to sign in directly is more efficient as it handles the verification
        email = virtualEmail;
      }

      // 2. Sign in using the retrieved email and password
      let { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: formData.password,
      });

      // Flexible Login: If the first attempt fails and it was a virtual email, 
      // try the alternative format (with or without 91 prefix)
      if (authError && email.endsWith('@mobile.user')) {
        const currentDigits = email.split('@')[0];
        const altDigits = currentDigits.startsWith('91') 
          ? currentDigits.substring(2) 
          : '91' + currentDigits;
        
        const altEmail = `${altDigits}@mobile.user`;
        console.log('Retrying with alternative format:', altEmail);
        
        const retry = await supabase.auth.signInWithPassword({
          email: altEmail,
          password: formData.password,
        });
        
        if (!retry.error) {
          authError = null;
          data = retry.data;
        }
      }

      if (authError) throw authError;

      // Redirect to dashboard on success
      router.push('/');
      router.refresh();
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        position: 'relative',
        background: theme.palette.mode === 'dark' 
          ? `linear-gradient(rgba(10, 10, 12, 0.7), rgba(10, 10, 12, 0.7)), url('/login-bg.png')`
          : `linear-gradient(rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.5)), url('/login-bg.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        p: 3
      }}
    >
      <Container maxWidth="sm">
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Box 
            sx={{ 
              display: 'inline-flex', 
              p: 2, 
              borderRadius: 4, 
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: 'primary.main',
              mb: 2,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
            }}
          >
            <Building2 size={40} />
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
            Welcome Back
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Log in to manage your properties with ease
          </Typography>
        </Box>

        <Paper 
          elevation={0}
          sx={{ 
            p: { xs: 3, md: 5 }, 
            borderRadius: 4, 
            border: '1px solid rgba(255, 255, 255, 0.05)',
            bgcolor: alpha(theme.palette.background.paper, 0.8),
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
          }}
        >
          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                fullWidth
                label="Mobile Number"
                name="phone"
                variant="outlined"
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={handleChange}
                disabled={loading}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Phone size={20} style={{ color: theme.palette.text.secondary }} />
                      </InputAdornment>
                    ),
                  }
                }}
              />

              <TextField
                fullWidth
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                variant="outlined"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock size={20} style={{ color: theme.palette.text.secondary }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          sx={{ color: 'text.secondary' }}
                        >
                          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }
                }}
              />

              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <FormControlLabel
                  control={
                    <Checkbox 
                      name="rememberMe" 
                      checked={formData.rememberMe} 
                      onChange={handleChange}
                      color="primary" 
                    />
                  }
                  label={<Typography variant="body2" color="text.secondary">Remember me</Typography>}
                />
                <MuiLink 
                  component={Link} 
                  href="/forgot-password" 
                  variant="body2" 
                  sx={{ color: 'primary.main', fontWeight: 600, textDecoration: 'none' }}
                >
                  Forgot Password?
                </MuiLink>
              </Box>

              <Button
                fullWidth
                size="large"
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{ 
                  py: 1.5, 
                  fontSize: '1rem',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight size={18} style={{ marginLeft: 8 }} />
                  </>
                )}
              </Button>
            </Box>
          </form>

          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Don't have an account?{' '}
              <MuiLink 
                component={Link} 
                href="/signup" 
                sx={{ color: 'primary.main', fontWeight: 600, textDecoration: 'none' }}
              >
                Sign Up
              </MuiLink>
            </Typography>
          </Box>
        </Paper>
        
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            © 2026 PropManager. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
