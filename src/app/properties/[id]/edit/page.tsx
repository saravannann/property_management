'use client';
import React, { useEffect, useState, use } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  Grid, 
  TextField, 
  MenuItem, 
  IconButton,
  Breadcrumbs,
  Stack,
  alpha,
  useTheme,
  CircularProgress
} from '@mui/material';
import { 
  ChevronLeft, 
  Upload, 
  MapPin, 
  Info,
  Save,
  Trash2
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from '@/lib/supabase';

export default function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const theme = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    property_type: 'Apartment',
    total_units: '' as string | number,
    address: '',
    city: '',
    state: '',
    pincode: '',
    description: ''
  });

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        if (data) {
          setFormData({
            name: data.name || '',
            property_type: data.property_type || 'Apartment',
            total_units: data.total_units || '',
            address: data.address || '',
            city: data.city || '',
            state: data.state || '',
            pincode: data.pincode || '',
            description: data.description || ''
          });
        }
      } catch (error) {
        console.error('Error fetching property:', error);
        alert('Could not find property details');
        router.push('/properties');
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'total_units' ? (value === '' ? '' : parseInt(value)) : value
    }));
  };

  const handleSave = async () => {
    if (!formData.name) {
      alert('Please enter a property name');
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from('properties')
        .update({
          ...formData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      
      router.push('/properties');
      router.refresh();
    } catch (error: any) {
      console.error('Error updating property:', error);
      alert('Error updating property: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this property? This cannot be undone.')) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', id);

      if (error) throw error;
      router.push('/properties');
    } catch (error: any) {
      alert('Error deleting property: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const propertyTypes = [
    { value: 'Apartment', label: 'Apartment' },
    { value: 'Villa', label: 'Villa' },
    { value: 'Commercial', label: 'Commercial' },
    { value: 'Office', label: 'Office Space' },
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ animation: 'fadeIn 0.5s ease' }}>
      <Box sx={{ mb: 4 }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link href="/" style={{ textDecoration: 'none', color: theme.palette.text.secondary }}>Dashboard</Link>
          <Link href="/properties" style={{ textDecoration: 'none', color: theme.palette.text.secondary }}>Properties</Link>
          <Typography color="text.primary" sx={{ fontWeight: 600 }}>Edit Property</Typography>
        </Breadcrumbs>
        
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => router.back()} sx={{ bgcolor: alpha('#fff', 0.05) }}>
              <ChevronLeft size={20} />
            </IconButton>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800 }}>Edit {formData.name}</Typography>
              <Typography variant="body2" color="text.secondary">Update property information or change status.</Typography>
            </Box>
          </Box>
          <Button 
            color="error" 
            variant="outlined" 
            startIcon={<Trash2 size={18} />}
            onClick={handleDelete}
            disabled={saving}
          >
            Delete Property
          </Button>
        </Box>
      </Box>

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={4}>
            <Card>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                  <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', display: 'flex' }}>
                    <Info size={20} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Basic Information</Typography>
                </Box>
                
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12 }}>
                    <TextField 
                      fullWidth 
                      label="Property Name" 
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required 
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField 
                      fullWidth 
                      select 
                      label="Property Type" 
                      name="property_type"
                      value={formData.property_type}
                      onChange={handleChange}
                    >
                      {propertyTypes.map((option) => (
                        <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField 
                      fullWidth 
                      type="number" 
                      label="Total Units" 
                      name="total_units"
                      value={formData.total_units}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField 
                      fullWidth 
                      multiline 
                      rows={3} 
                      label="Description" 
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                  <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: alpha('#c084fc', 0.1), color: '#c084fc', display: 'flex' }}>
                    <MapPin size={20} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Location Details</Typography>
                </Box>
                
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12 }}>
                    <TextField fullWidth label="Address Line 1" name="address" value={formData.address} onChange={handleChange} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField fullWidth label="City" name="city" value={formData.city} onChange={handleChange} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField fullWidth label="State" name="state" value={formData.state} onChange={handleChange} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField fullWidth label="Postal Code" name="pincode" value={formData.pincode} onChange={handleChange} />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={4}>
            <Card>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                  <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: alpha('#fbbf24', 0.1), color: '#fbbf24', display: 'flex' }}>
                    <Upload size={20} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Property Media</Typography>
                </Box>
                <Box sx={{ border: '2px dashed', borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 3, p: 4, textAlign: 'center' }}>
                  <Upload size={32} style={{ color: theme.palette.text.secondary, marginBottom: 12 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Click to upload new photos</Typography>
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05), border: '1px solid', borderColor: alpha(theme.palette.primary.main, 0.1) }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Confirm Changes</Typography>
                <Stack spacing={2}>
                  <Button 
                    variant="contained" 
                    fullWidth 
                    startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Save size={18} />} 
                    size="large"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? 'Updating...' : 'Update Property'}
                  </Button>
                  <Button variant="outlined" fullWidth onClick={() => router.back()}>Cancel</Button>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
