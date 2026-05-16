'use client';
import React, { useEffect, useState } from 'react';
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
  CircularProgress,
  InputAdornment
} from '@mui/material';
import { 
  ChevronLeft, 
  User, 
  Phone, 
  Mail, 
  Home, 
  Calendar,
  IndianRupee,
  Save,
  Building2,
  FileText
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from '@/lib/supabase';

export default function AddTenantPage() {
  const theme = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [fetchingProps, setFetchingProps] = useState(true);
  const [fetchingUnits, setFetchingUnits] = useState(false);
  const [agreementFile, setAgreementFile] = useState<File | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone_number: '',
    property_id: '',
    unit_number: '',
    monthly_rent: '',
    electricity_rate: 10,
    water_charges: 0,
    security_deposit: '',
    move_in_date: new Date().toISOString().split('T')[0],
    agreement_start_date: '',
    agreement_end_date: '',
  });

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const { data, error } = await supabase
          .from('properties')
          .select('id, name')
          .order('name');
        if (error) throw error;
        setProperties(data || []);
      } catch (error) {
        console.error('Error fetching properties:', error);
      } finally {
        setFetchingProps(false);
      }
    };
    fetchProperties();
  }, []);

  // Fetch units when property changes
  useEffect(() => {
    const fetchUnits = async () => {
      if (!formData.property_id) {
        setUnits([]);
        return;
      }
      try {
        setFetchingUnits(true);
        const { data, error } = await supabase
          .from('units')
          .select('unit_number')
          .eq('property_id', formData.property_id)
          .eq('status', 'vacant')
          .order('unit_number');
        
        if (error) throw error;
        setUnits(data || []);
      } catch (error) {
        console.error('Error fetching units:', error);
      } finally {
        setFetchingUnits(false);
      }
    };
    fetchUnits();
  }, [formData.property_id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: value,
      // Clear unit if property changes
      ...(name === 'property_id' ? { unit_number: '' } : {})
    }));
  };

  const handleSave = async () => {
    if (!formData.name || !formData.property_id || !formData.monthly_rent) {
      alert('Please fill in the required fields: Name, Property, and Rent');
      return;
    }

    try {
      setLoading(true);
      
      let agreementUrl = null;

      // 1. Upload Agreement if exists
      if (agreementFile) {
        const fileExt = agreementFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${formData.property_id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('tenant-agreements')
          .upload(filePath, agreementFile);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          // Check if bucket exists error
          if (uploadError.message.includes('bucket not found')) {
            throw new Error('Storage bucket "tenant-agreements" not found. Please create it in Supabase Dashboard.');
          }
          throw uploadError;
        }
        
        agreementUrl = filePath;
      }

      // 2. Insert Tenant
      const { error } = await supabase
        .from('tenants')
        .insert([{
          ...formData,
          monthly_rent: parseFloat(formData.monthly_rent),
          security_deposit: parseFloat(formData.security_deposit || '0'),
          agreement_start_date: formData.agreement_start_date || null,
          agreement_end_date: formData.agreement_end_date || null,
          agreement_url: agreementUrl,
          is_active: true
        }]);

      if (error) throw error;
      
      router.push('/tenants');
      router.refresh();
    } catch (error: any) {
      console.error('Error saving tenant:', error);
      const msg = error.message || error.details || 'Unknown database error';
      alert('Error saving tenant: ' + msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ animation: 'fadeIn 0.5s ease' }}>
      <Box sx={{ mb: 4 }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link href="/" style={{ textDecoration: 'none', color: theme.palette.text.secondary }}>Dashboard</Link>
          <Link href="/tenants" style={{ textDecoration: 'none', color: theme.palette.text.secondary }}>Tenants</Link>
          <Typography color="text.primary" sx={{ fontWeight: 600 }}>Add New</Typography>
        </Breadcrumbs>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => router.back()} sx={{ bgcolor: alpha('#fff', 0.05) }}>
            <ChevronLeft size={20} />
          </IconButton>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>Add New Tenant</Typography>
            <Typography variant="body2" color="text.secondary">Register a new resident and their lease details.</Typography>
          </Box>
        </Box>
      </Box>

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={4}>
            {/* Personal Information */}
            <Card>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                  <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', display: 'flex' }}>
                    <User size={20} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Tenant Information</Typography>
                </Box>
                
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12 }}>
                    <TextField 
                      fullWidth label="Full Name" name="name" value={formData.name} onChange={handleChange} required 
                      slotProps={{ input: { startAdornment: <InputAdornment position="start"><User size={18} /></InputAdornment> } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField 
                      fullWidth label="Mobile Number" name="phone_number" value={formData.phone_number} onChange={handleChange} required 
                      slotProps={{ input: { startAdornment: <InputAdornment position="start"><Phone size={18} /></InputAdornment> } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField 
                      fullWidth label="Email Address" name="email" value={formData.email} onChange={handleChange}
                      slotProps={{ input: { startAdornment: <InputAdornment position="start"><Mail size={18} /></InputAdornment> } }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Lease Details */}
            <Card>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                  <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: alpha('#c084fc', 0.1), color: '#c084fc', display: 'flex' }}>
                    <Home size={20} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Lease & Unit Details</Typography>
                </Box>
                
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField 
                      fullWidth select label="Select Property" name="property_id" value={formData.property_id} onChange={handleChange} required
                      disabled={fetchingProps}
                      slotProps={{ input: { startAdornment: <InputAdornment position="start"><Building2 size={18} /></InputAdornment> } }}
                    >
                      {properties.map((prop) => (
                        <MenuItem key={prop.id} value={prop.id}>{prop.name}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField 
                      fullWidth 
                      select 
                      label="Unit Number" 
                      name="unit_number" 
                      value={formData.unit_number} 
                      onChange={handleChange} 
                      required
                      disabled={!formData.property_id || fetchingUnits}
                      slotProps={{ input: { startAdornment: <InputAdornment position="start"><Home size={18} /></InputAdornment> } }}
                    >
                      <MenuItem value=""><em>Select Unit</em></MenuItem>
                      {units.map((u) => (
                        <MenuItem key={u.unit_number} value={u.unit_number}>
                          {u.unit_number}
                        </MenuItem>
                      ))}
                      {units.length === 0 && formData.property_id && !fetchingUnits && (
                        <MenuItem disabled>No vacant units available</MenuItem>
                      )}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField 
                      fullWidth type="number" label="Monthly Rent" name="monthly_rent" value={formData.monthly_rent} onChange={handleChange} required 
                      slotProps={{ input: { startAdornment: <InputAdornment position="start"><IndianRupee size={18} /></InputAdornment> } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField 
                      fullWidth type="number" label="Security Deposit" name="security_deposit" value={formData.security_deposit} onChange={handleChange}
                      slotProps={{ input: { startAdornment: <InputAdornment position="start"><IndianRupee size={18} /></InputAdornment> } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField 
                      fullWidth type="number" label="Electricity Rate" name="electricity_rate" value={formData.electricity_rate} onChange={handleChange}
                      slotProps={{ input: { startAdornment: <InputAdornment position="start">₹</InputAdornment>, endAdornment: <InputAdornment position="end">/ unit</InputAdornment> } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField 
                      fullWidth type="number" label="Water Charges (LumpSum)" name="water_charges" value={formData.water_charges} onChange={handleChange}
                      slotProps={{ input: { startAdornment: <InputAdornment position="start">₹</InputAdornment>, endAdornment: <InputAdornment position="end">/ month</InputAdornment> } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField 
                      fullWidth type="date" label="Move-in Date" name="move_in_date" value={formData.move_in_date} onChange={handleChange} required 
                      slotProps={{ 
                        inputLabel: { shrink: true },
                        input: { startAdornment: <InputAdornment position="start"><Calendar size={18} /></InputAdornment> },
                        htmlInput: { placeholder: '' }
                      }}
                    />
                  </Grid>
                  
                  {/* Agreement Section */}
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main', textTransform: 'uppercase', mb: 1, mt: 2 }}>
                      Legal Agreement Period
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField 
                      fullWidth type="date" label="Agreement Start Date" name="agreement_start_date" value={formData.agreement_start_date} onChange={handleChange}
                      slotProps={{ 
                        inputLabel: { shrink: true },
                        input: { startAdornment: <InputAdornment position="start"><Calendar size={18} /></InputAdornment> },
                        htmlInput: { placeholder: '' }
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField 
                      fullWidth type="date" label="Agreement End Date" name="agreement_end_date" value={formData.agreement_end_date} onChange={handleChange}
                      slotProps={{ 
                        inputLabel: { shrink: true },
                        input: { startAdornment: <InputAdornment position="start"><Calendar size={18} /></InputAdornment> },
                        htmlInput: { placeholder: '' }
                      }}
                    />
                  </Grid>

                  {/* Agreement Document Upload */}
                  <Grid size={{ xs: 12 }}>
                    <Box sx={{ mt: 2, p: 3, border: '2px dashed', borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 2, textAlign: 'center' }}>
                      <input
                        type="file"
                        accept=".pdf"
                        id="agreement-upload"
                        style={{ display: 'none' }}
                        onChange={(e) => setAgreementFile(e.target.files?.[0] || null)}
                      />
                      <label htmlFor="agreement-upload">
                        <Stack spacing={1} sx={{ alignItems: 'center', cursor: 'pointer' }}>
                          <FileText size={32} color={agreementFile ? theme.palette.success.main : theme.palette.text.secondary} />
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {agreementFile ? agreementFile.name : 'Upload Signed Agreement (PDF)'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {agreementFile ? `${(agreementFile.size / 1024 / 1024).toFixed(2)} MB` : 'Max size 5MB'}
                          </Typography>
                          <Button size="small" component="span" variant="outlined" sx={{ mt: 1 }}>
                            {agreementFile ? 'Change File' : 'Select PDF'}
                          </Button>
                        </Stack>
                      </label>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={4}>
            <Card sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05), border: '1px solid', borderColor: alpha(theme.palette.primary.main, 0.1) }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Ready to Onboard?</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  By adding this tenant, they will be registered in your property management system.
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
                    {loading ? 'Adding Tenant...' : 'Add Tenant'}
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
