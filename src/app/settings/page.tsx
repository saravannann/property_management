'use client';
import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  TextField, 
  Button, 
  MenuItem, 
  Avatar, 
  Stack, 
  alpha, 
  useTheme, 
  CircularProgress,
  Divider,
  Snackbar,
  Alert
} from '@mui/material';
import { 
  User, 
  Languages, 
  Moon, 
  Sun, 
  Shield, 
  Mail, 
  Phone,
  Save,
  CheckCircle2
} from "lucide-react";
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/components/LanguageProvider';
import { useColorMode } from '@/components/Providers';

export default function SettingsPage() {
  const theme = useTheme();
  const { t, locale, setLocale } = useLanguage();
  const { toggleColorMode } = useColorMode();
  const mode = theme.palette.mode;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    fullName: '',
    phone: ''
  });

  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
      setFormData({
        fullName: data.full_name || '',
        phone: data.phone_number || ''
      });
    } catch (error: any) {
      console.error('Error fetching profile settings:', error);
      setNotification({
        open: true,
        message: 'Could not load profile details.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.fullName,
          phone_number: formData.phone
        })
        .eq('id', user.id);

      if (error) throw error;
      setNotification({
        open: true,
        message: locale === 'ta' ? 'விபரங்கள் வெற்றிகரமாக சேமிக்கப்பட்டன!' : 'Profile details updated successfully!',
        severity: 'success'
      });
      fetchProfile();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setNotification({
        open: true,
        message: error.message || 'Error updating details.',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLanguageChange = (newLang: 'en' | 'ta') => {
    setLocale(newLang);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 15 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ animation: 'fadeIn 0.5s ease', maxWidth: 800, mx: 'auto' }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
          {locale === 'ta' ? 'அமைப்புகள்' : 'Settings'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {locale === 'ta' 
            ? 'உங்கள் கணக்கு விபரங்கள், மொழி மற்றும் தோற்றத்தை நிர்வகிக்கவும்.' 
            : 'Manage your profile details, application language, and display theme.'}
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Profile Card */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'center', mb: 4 }}>
                <Avatar sx={{ 
                  width: 70, 
                  height: 70, 
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: 'primary.main',
                  fontSize: '2rem',
                  fontWeight: 800
                }}>
                  {profile?.full_name ? profile.full_name[0] : (profile?.email ? profile.email[0].toUpperCase() : '?')}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {profile?.full_name || 'User Profile'}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 0.5, flexWrap: 'wrap', gap: 1 }}>
                    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', color: 'text.secondary' }}>
                      <Shield size={14} />
                      <Typography variant="caption" sx={{ textTransform: 'uppercase', fontWeight: 700 }}>
                        {profile?.role || 'User'}
                      </Typography>
                    </Stack>
                    <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
                    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', color: 'text.secondary' }}>
                      <Mail size={14} />
                      <Typography variant="caption">{profile?.email}</Typography>
                    </Stack>
                  </Stack>
                </Box>
              </Box>

              <Divider sx={{ mb: 4 }} />

              <form onSubmit={handleProfileSave}>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label={locale === 'ta' ? 'முழு பெயர்' : 'Full Name'}
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="e.g. Saravanan Elumalai"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label={locale === 'ta' ? 'அலைபேசி எண்' : 'Mobile Number'}
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+919962293848"
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                      <Button
                        type="submit"
                        variant="contained"
                        startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save size={16} />}
                        disabled={saving}
                        sx={{ px: 3 }}
                      >
                        {saving ? (locale === 'ta' ? 'சேமிக்கப்படுகிறது...' : 'Saving...') : (locale === 'ta' ? 'மாற்றங்களைச் சேமி' : 'Save Changes')}
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </form>
            </CardContent>
          </Card>
        </Grid>

        {/* Preferences Cards */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Languages size={20} className="text-indigo-400" />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {locale === 'ta' ? 'மொழித் தெரிவு' : 'Language preference'}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, flexGrow: 1 }}>
                {locale === 'ta' 
                  ? 'உங்கள் பயன்பாட்டிற்கான மொழியைத் தேர்ந்தெடுக்கவும்.' 
                  : 'Select your preferred language for layout buttons and dynamic screens.'}
              </Typography>
              
              <TextField
                select
                fullWidth
                value={locale}
                onChange={(e) => handleLanguageChange(e.target.value as 'en' | 'ta')}
                label={locale === 'ta' ? 'மொழி' : 'Select Language'}
              >
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="ta">தமிழ் (Tamil)</MenuItem>
              </TextField>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                {mode === 'dark' ? <Moon size={20} className="text-yellow-400" /> : <Sun size={20} className="text-orange-400" />}
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {locale === 'ta' ? 'தோற்றம்' : 'Display Theme'}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, flexGrow: 1 }}>
                {locale === 'ta' 
                  ? 'அடர் மற்றும் ஒளி தோற்றங்களுக்கு இடையே மாறவும்.' 
                  : 'Switch between premium dark theme and light theme visual styles.'}
              </Typography>

              <Button
                variant="outlined"
                fullWidth
                startIcon={mode === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                onClick={toggleColorMode}
                sx={{ height: 56, textTransform: 'none', fontWeight: 600 }}
              >
                {mode === 'dark' 
                  ? (locale === 'ta' ? 'ஒளித் தோற்றத்திற்கு மாற்றுக' : 'Switch to Light Theme') 
                  : (locale === 'ta' ? 'அடர் தோற்றத்திற்கு மாற்றுக' : 'Switch to Dark Theme')}
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Snackbar notification */}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setNotification({ ...notification, open: false })} 
          severity={notification.severity}
          sx={{ width: '100%', borderRadius: 2 }}
          icon={<CheckCircle2 size={20} />}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
