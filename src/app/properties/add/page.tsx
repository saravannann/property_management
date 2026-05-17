'use client';
import React, { useState } from 'react';
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
  Building2, 
  MapPin, 
  Home, 
  Info,
  Save
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from '@/lib/supabase';

export default function AddPropertyPage() {
  const theme = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    property_type: 'Apartment',
    total_units: '',
    address: '',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '',
    description: ''
  });

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
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to add a property');
      }

      // 1. Generate PPX prefix
      const pp = formData.name.substring(0, 2).toUpperCase();
      
      // Fetch existing prefixes starting with this PP
      const { data: existingProps } = await supabase
        .from('properties')
        .select('unit_prefix')
        .ilike('unit_prefix', `${pp}%`);
      
      const takenX = existingProps?.map(p => p.unit_prefix.charAt(2)) || [];
      
      // Find first available X (A, B, C...)
      let x = 'A';
      for (let i = 0; i < 26; i++) {
        const char = String.fromCharCode(65 + i);
        if (!takenX.includes(char)) {
          x = char;
          break;
        }
      }
      
      const unitPrefix = `${pp}${x}`;

      // 2. Insert Property
      const { data: property, error: propError } = await supabase
        .from('properties')
        .insert([
          {
            ...formData,
            unit_prefix: unitPrefix,
            owner_id: user.id,
          }
        ])
        .select()
        .single();

      if (propError) throw propError;

      // 3. Generate and Insert Units
      if (property && formData.total_units) {
        const totalUnits = parseInt(formData.total_units.toString());
        const unitsToInsert = [];
        
        for (let i = 1; i <= totalUnits; i++) {
          const nn = i.toString().padStart(2, '0');
          unitsToInsert.push({
            property_id: property.id,
            unit_number: `${unitPrefix}${nn}`,
            status: 'vacant'
          });
        }

        const { error: unitsError } = await supabase
          .from('units')
          .insert(unitsToInsert);
          
        if (unitsError) throw unitsError;
      }
      
      router.push('/properties');
      router.refresh();
    } catch (error: any) {
      console.error('Error saving property:', error);
      alert('Error saving property: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const propertyTypes = [
    { value: 'Apartment', label: 'Apartment' },
    { value: 'Villa', label: 'Villa' },
    { value: 'Commercial', label: 'Commercial' },
    { value: 'Office', label: 'Office Space' },
  ];

  return (
    <Box sx={{ animation: 'fadeIn 0.5s ease' }}>
      {/* Header & Breadcrumbs */}
      <Box sx={{ mb: 4 }}>
        <Breadcrumbs sx={{ mb: 2, '& .MuiBreadcrumbs-separator': { color: 'text.secondary' } }}>
          <Link href="/" style={{ textDecoration: 'none', color: theme.palette.text.secondary }}>Dashboard</Link>
          <Link href="/properties" style={{ textDecoration: 'none', color: theme.palette.text.secondary }}>Properties</Link>
          <Typography color="text.primary" sx={{ fontWeight: 600 }}>Add New</Typography>
        </Breadcrumbs>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => router.back()} sx={{ bgcolor: alpha('#fff', 0.05) }}>
            <ChevronLeft size={20} />
          </IconButton>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>Add New Property</Typography>
            <Typography variant="body2" color="text.secondary">Create a new listing in your portfolio.</Typography>
          </Box>
        </Box>
      </Box>

      <Grid container spacing={4}>
        {/* Main Form */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={4}>
            {/* Basic Information */}
            <Card>
              <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
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
                      placeholder="e.g. Emerald Heights" 
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
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
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
                      placeholder="0" 
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
                      placeholder="Describe the property, amenities, etc." 
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Location Details */}
            <Card>
              <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                  <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: alpha('#c084fc', 0.1), color: '#c084fc', display: 'flex' }}>
                    <MapPin size={20} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Location Details</Typography>
                </Box>
                
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12 }}>
                    <TextField 
                      fullWidth 
                      label="Address Line 1" 
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Street address, P.O. box, etc." 
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField 
                      fullWidth 
                      label="City" 
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="e.g. Gurgaon" 
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField 
                      fullWidth 
                      label="State / Province" 
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      placeholder="e.g. Haryana" 
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField 
                      fullWidth 
                      label="Postal Code" 
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleChange}
                      placeholder="e.g. 122001" 
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        {/* Sidebar / Uploads */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={4}>
            {/* Media Upload */}
            <Card>
              <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                  <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: alpha('#fbbf24', 0.1), color: '#fbbf24', display: 'flex' }}>
                    <Upload size={20} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Property Media</Typography>
                </Box>
                
                <Box sx={{ 
                  border: '2px dashed', 
                  borderColor: 'rgba(255, 255, 255, 0.1)', 
                  borderRadius: 3, 
                  p: 4, 
                  textAlign: 'center',
                  bgcolor: alpha('#fff', 0.01),
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: alpha(theme.palette.primary.main, 0.03)
                  }
                }}>
                  <Upload size={32} style={{ color: theme.palette.text.secondary, marginBottom: 12 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Click to upload or drag & drop</Typography>
                  <Typography variant="caption" color="text.secondary">PNG, JPG or WebP (Max 5MB)</Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05), border: '1px solid', borderColor: alpha(theme.palette.primary.main, 0.1) }}>
              <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Ready to Publish?</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Ensure all details are correct. You can edit this property later at any time.
                </Typography>
                <Stack spacing={2}>
                  <Button 
                    variant="contained" 
                    fullWidth 
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Save size={18} />} 
                    size="large"
                    onClick={handleSave}
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Property'}
                  </Button>
                  <Button variant="outlined" fullWidth onClick={() => router.back()}>
                    Cancel
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
