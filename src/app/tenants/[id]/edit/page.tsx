'use client';
import React, { useEffect, useState, use } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  TextField, 
  MenuItem, 
  Grid,
  CircularProgress,
  Stack,
  alpha,
  useTheme,
  InputAdornment
} from '@mui/material';
import { Save, X, User, Phone, Mail, Building2, Hash, CreditCard, FileText, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from '@/lib/supabase';

export default function EditTenantPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const theme = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [properties, setProperties] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [agreementFile, setAgreementFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone_number: '',
    email: '',
    property_id: '',
    unit_number: '',
    monthly_rent: '',
    electricity_rate: 10,
    water_charges: 0,
    security_deposit: '',
    move_in_date: '',
    move_out_date: '',
    agreement_start_date: '',
    agreement_end_date: '',
    agreement_url: '',
    is_active: true
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 1. Fetch properties for dropdown
        const { data: props } = await supabase.from('properties').select('id, name');
        setProperties(props || []);

        // 2. Fetch tenant data
        const { data: tenant, error } = await supabase
          .from('tenants')
          .select('*')
          .eq('id', resolvedParams.id)
          .single();

        if (error) throw error;
        if (tenant) {
          setFormData({
            name: tenant.name || '',
            phone_number: tenant.phone_number || '',
            email: tenant.email || '',
            property_id: tenant.property_id || '',
            unit_number: tenant.unit_number || '',
            monthly_rent: tenant.monthly_rent?.toString() || '',
            electricity_rate: tenant.electricity_rate || 10,
            water_charges: tenant.water_charges || 0,
            security_deposit: tenant.security_deposit?.toString() || '',
            move_in_date: tenant.move_in_date || '',
            move_out_date: tenant.move_out_date || '',
            agreement_start_date: tenant.agreement_start_date || '',
            agreement_end_date: tenant.agreement_end_date || '',
            agreement_url: tenant.agreement_url || '',
            is_active: tenant.is_active ?? true
          });
          
          // Fetch units for the selected property
          if (tenant.property_id) {
            fetchUnits(tenant.property_id);
          }
        }
      } catch (error) {
        console.error('Error fetching tenant:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [resolvedParams.id]);

  const fetchUnits = async (propertyId: string) => {
    try {
      const { data } = await supabase
        .from('units')
        .select('unit_number, status')
        .eq('property_id', propertyId);
      
      setUnits(data || []);
    } catch (error) {
      console.error('Error fetching units:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'property_id') {
      fetchUnits(value);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);

      let agreementUrl = formData.agreement_url;

      // Upload new agreement if provided
      if (agreementFile) {
        const fileExt = agreementFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${formData.property_id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('tenant-agreements')
          .upload(filePath, agreementFile);

        if (uploadError) throw uploadError;
        agreementUrl = filePath;
      }

      const { error } = await supabase
        .from('tenants')
        .update({
          name: formData.name,
          phone_number: formData.phone_number,
          email: formData.email,
          property_id: formData.property_id,
          unit_number: formData.unit_number,
          monthly_rent: parseFloat(formData.monthly_rent),
          security_deposit: parseFloat(formData.security_deposit || '0'),
          move_in_date: formData.move_in_date,
          move_out_date: formData.move_out_date || null,
          agreement_start_date: formData.agreement_start_date || null,
          agreement_end_date: formData.agreement_end_date || null,
          agreement_url: agreementUrl,
          is_active: formData.is_active
        })
        .eq('id', resolvedParams.id);

      if (error) throw error;
      router.push('/tenants');
    } catch (error: any) {
      console.error('Error updating tenant:', error);
      alert(error.message || 'Failed to update tenant');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', animation: 'fadeIn 0.5s ease' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
            Edit Tenant
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Update resident information and lease details.
          </Typography>
        </Box>
        <Button 
          variant="outlined" 
          startIcon={<X size={18} />}
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </Box>

      <form onSubmit={handleSave}>
        <Grid container spacing={3}>
          {/* Personal Information */}
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <User size={20} color={theme.palette.primary.main} />
                  Personal Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Full Name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Phone Number"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleChange}
                      required
                      slotProps={{
                        input: {
                          startAdornment: <Phone size={16} style={{ marginRight: 8, color: alpha('#fff', 0.5) }} />
                        }
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="Email Address"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      slotProps={{
                        input: {
                          startAdornment: <Mail size={16} style={{ marginRight: 8, color: alpha('#fff', 0.5) }} />
                        }
                      }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Lease Information */}
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Building2 size={20} color={theme.palette.primary.main} />
                  Property & Lease
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      select
                      fullWidth
                      label="Property"
                      name="property_id"
                      value={formData.property_id}
                      onChange={handleChange}
                      required
                    >
                      {properties.map((prop) => (
                        <MenuItem key={prop.id} value={prop.id}>
                          {prop.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      select
                      fullWidth
                      label="Unit Number"
                      name="unit_number"
                      value={formData.unit_number}
                      onChange={handleChange}
                      required
                      disabled={!formData.property_id}
                    >
                      {units.map((unit) => (
                        <MenuItem key={unit.unit_number} value={unit.unit_number}>
                          {unit.unit_number} ({unit.status})
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Monthly Rent"
                      name="monthly_rent"
                      type="number"
                      value={formData.monthly_rent}
                      onChange={handleChange}
                      required
                      slotProps={{
                        input: {
                          startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>₹</Typography>
                        }
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Security Deposit"
                      name="security_deposit"
                      type="number"
                      value={formData.security_deposit}
                      onChange={handleChange}
                      slotProps={{
                        input: {
                          startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>₹</Typography>
                        }
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Electricity Rate"
                      name="electricity_rate"
                      type="number"
                      value={formData.electricity_rate}
                      onChange={handleChange}
                      slotProps={{
                        input: {
                          startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>₹</Typography>,
                          endAdornment: <InputAdornment position="end">/ unit</InputAdornment>
                        }
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Water Charges (LumpSum)"
                      name="water_charges"
                      type="number"
                      value={formData.water_charges}
                      onChange={handleChange}
                      slotProps={{
                        input: {
                          startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>₹</Typography>,
                          endAdornment: <InputAdornment position="end">/ month</InputAdornment>
                        }
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Move-in Date"
                      name="move_in_date"
                      type="date"
                      value={formData.move_in_date}
                      onChange={handleChange}
                      required
                      slotProps={{ 
                        inputLabel: { shrink: true },
                        htmlInput: { placeholder: '' } 
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Vacate Date (Only if vacating)"
                      name="move_out_date"
                      type="date"
                      value={formData.move_out_date}
                      onChange={handleChange}
                      slotProps={{ 
                        inputLabel: { shrink: true },
                        htmlInput: { placeholder: '' } 
                      }}
                      helperText="Leave empty if tenant is currently active"
                    />
                  </Grid>
                                 {/* Legal Agreement Section */}
                  <Grid size={{ xs: 12 }}>
                    <Box sx={{ mt: 2, mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main', textTransform: 'uppercase', letterSpacing: 1 }}>
                        Legal Agreement Period
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Agreement Start Date"
                      name="agreement_start_date"
                      type="date"
                      value={formData.agreement_start_date}
                      onChange={handleChange}
                      slotProps={{ 
                        inputLabel: { shrink: true },
                        htmlInput: { placeholder: '' } 
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Agreement End Date"
                      name="agreement_end_date"
                      type="date"
                      value={formData.agreement_end_date}
                      onChange={handleChange}
                      slotProps={{ 
                        inputLabel: { shrink: true },
                        htmlInput: { placeholder: '' } 
                      }}
                    />
                  </Grid>

                  {/* Agreement Document Management */}
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main', textTransform: 'uppercase', letterSpacing: 1, mt: 2, mb: 1 }}>
                      Lease Agreement Document
                    </Typography>
                    
                    {formData.agreement_url && !agreementFile && (
                      <Box sx={{ 
                        p: 2, 
                        bgcolor: alpha(theme.palette.success.main, 0.05), 
                        border: '1px solid', 
                        borderColor: alpha(theme.palette.success.main, 0.2),
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mb: 2
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <FileText size={20} color={theme.palette.success.main} />
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>Current Agreement Uploaded</Typography>
                        </Box>
                        <Button 
                          size="small" 
                          startIcon={<ExternalLink size={14} />}
                          onClick={() => {
                            const { data } = supabase.storage.from('tenant-agreements').getPublicUrl(formData.agreement_url);
                            window.open(data.publicUrl, '_blank');
                          }}
                        >
                          View
                        </Button>
                      </Box>
                    )}

                    <Box sx={{ p: 3, border: '2px dashed', borderColor: agreementFile ? 'primary.main' : 'rgba(255, 255, 255, 0.1)', borderRadius: 2, textAlign: 'center' }}>
                      <input
                        type="file"
                        accept=".pdf"
                        id="agreement-edit-upload"
                        style={{ display: 'none' }}
                        onChange={(e) => setAgreementFile(e.target.files?.[0] || null)}
                      />
                      <label htmlFor="agreement-edit-upload">
                        <Stack spacing={1} sx={{ alignItems: 'center', cursor: 'pointer' }}>
                          <FileText size={32} color={agreementFile ? theme.palette.primary.main : theme.palette.text.secondary} />
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {agreementFile ? agreementFile.name : formData.agreement_url ? 'Replace Current Agreement (PDF)' : 'Upload Lease Agreement (PDF)'}
                          </Typography>
                          {agreementFile && (
                            <Typography variant="caption" color="text.secondary">
                              {(agreementFile.size / 1024 / 1024).toFixed(2)} MB
                            </Typography>
                          )}
                          <Button size="small" component="span" variant="outlined" sx={{ mt: 1 }}>
                            {agreementFile ? 'Change Selection' : 'Select PDF'}
                          </Button>
                        </Stack>
                      </label>
                    </Box>
                  </Grid>
                  
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      select
                      fullWidth
                      label="Tenant Status"
                      name="is_active"
                      value={formData.is_active}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.value === 'true' }))}
                    >
                      <MenuItem value="true">Active (Currently Living)</MenuItem>
                      <MenuItem value="false">Inactive (Vacated)</MenuItem>
                    </TextField>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              type="submit"
              disabled={saving}
              startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Save size={20} />}
              sx={{ py: 2, fontWeight: 800, fontSize: '1rem' }}
            >
              {saving ? 'Updating Tenant...' : 'Save Tenant Updates'}
            </Button>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
}
