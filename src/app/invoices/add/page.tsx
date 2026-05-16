'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  TextField, 
  MenuItem, 
  Grid, 
  Stack, 
  alpha, 
  useTheme, 
  CircularProgress,
  InputAdornment,
  Divider,
  Alert
} from '@mui/material';
import { 
  ChevronLeft, 
  Save, 
  User, 
  Zap, 
  Droplets, 
  PlusCircle, 
  History,
  IndianRupee,
  FileText,
  Calendar
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from '@/lib/supabase';

export default function AddInvoicePage() {
  const theme = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [tenants, setTenants] = useState<any[]>([]);
  const [fetchingTenants, setFetchingTenants] = useState(true);
  const [lastInvoice, setLastInvoice] = useState<any>(null);

  const [formData, setFormData] = useState({
    tenant_id: '',
    billing_month: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    due_date: new Date(new Date().getFullYear(), new Date().getMonth(), 15).toISOString().split('T')[0],
    billing_period_start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    billing_period_end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
    rent_amount: 0,
    water_charges: 0,
    prev_electricity_reading: 0,
    curr_electricity_reading: 0,
    electricity_rate: 10, // Default rate
    misc_charges: 0,
    previous_balance: 0,
    description: ''
  });

  // When billing month changes, update due date and period
  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = new Date(e.target.value);
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    
    const firstDay = new Date(year, month, 1).toISOString().split('T')[0];
    const lastDay = new Date(year, month + 1, 0).toISOString().split('T')[0];
    const dueDate = new Date(year, month, 15).toISOString().split('T')[0];

    setFormData(prev => ({
      ...prev,
      billing_month: firstDay,
      due_date: dueDate,
      billing_period_start: firstDay,
      billing_period_end: lastDay
    }));
  };

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const { data, error } = await supabase
          .from('tenants')
          .select('id, name, property_id, unit_number, monthly_rent, electricity_rate, water_charges, properties(name)')
          .eq('is_active', true)
          .order('name');
        if (error) throw error;
        setTenants(data || []);
      } catch (error) {
        console.error('Error fetching tenants:', error);
      } finally {
        setFetchingTenants(false);
      }
    };
    fetchTenants();
  }, []);

  // When tenant changes, fetch their last invoice and current rent
  useEffect(() => {
    const fetchTenantData = async () => {
      if (!formData.tenant_id) return;

      const tenant = tenants.find(t => t.id === formData.tenant_id);
      
      try {
        // Fetch last invoice for electricity readings and balance
        const { data: lastInv, error } = await supabase
          .from('invoices')
          .select('*')
          .eq('tenant_id', formData.tenant_id)
          .order('billing_date', { ascending: false })
          .limit(1)
          .single();

        // Also fetch any pending/overdue balance
        const { data: unpaidInvoices } = await supabase
          .from('invoices')
          .select('amount')
          .eq('tenant_id', formData.tenant_id)
          .in('status', ['pending', 'overdue']);
        
        const totalUnpaid = unpaidInvoices?.reduce((sum, inv) => sum + Number(inv.amount), 0) || 0;

        setFormData(prev => ({
          ...prev,
          rent_amount: tenant?.monthly_rent || 0,
          electricity_rate: tenant?.electricity_rate || 10,
          water_charges: tenant?.water_charges || 0,
          prev_electricity_reading: lastInv?.curr_electricity_reading || 0,
          previous_balance: totalUnpaid
        }));
        setLastInvoice(lastInv);

      } catch (error) {
        console.error('Error fetching tenant data:', error);
        // If no last invoice, just set rent
        setFormData(prev => ({
          ...prev,
          rent_amount: tenant?.monthly_rent || 0,
          prev_electricity_reading: 0,
          previous_balance: 0
        }));
      }
    };

    fetchTenantData();
  }, [formData.tenant_id, tenants]);

  // Proration Logic
  const prorationDetails = useMemo(() => {
    const start = new Date(formData.billing_period_start);
    const end = new Date(formData.billing_period_end);
    
    // Days in this month (based on start date)
    const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
    
    // Days in selected period
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const daysInPeriod = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    const dailyRate = Number(formData.rent_amount) / daysInMonth;
    const proratedAmount = daysInPeriod >= daysInMonth ? Number(formData.rent_amount) : dailyRate * daysInPeriod;
    
    return {
      daysInMonth,
      daysInPeriod,
      dailyRate,
      proratedAmount,
      isProrated: daysInPeriod < daysInMonth
    };
  }, [formData.billing_period_start, formData.billing_period_end, formData.rent_amount]);

  const electricityUsage = useMemo(() => {
    const usage = formData.curr_electricity_reading - formData.prev_electricity_reading;
    return usage > 0 ? usage : 0;
  }, [formData.curr_electricity_reading, formData.prev_electricity_reading]);

  const electricityAmount = useMemo(() => {
    return electricityUsage * formData.electricity_rate;
  }, [electricityUsage, formData.electricity_rate]);

  const totalAmount = useMemo(() => {
    return (
      Number(prorationDetails.proratedAmount) +
      Number(formData.water_charges) +
      Number(electricityAmount) +
      Number(formData.misc_charges) +
      Number(formData.previous_balance)
    );
  }, [prorationDetails.proratedAmount, formData.water_charges, electricityAmount, formData.misc_charges, formData.previous_balance]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!formData.tenant_id) {
      alert('Please select a tenant');
      return;
    }

    try {
      setLoading(true);
      const tenant = tenants.find(t => t.id === formData.tenant_id);
      if (!tenant) throw new Error('Tenant not found');

      // 1. Generate Property Shortcode from Unit Prefix (e.g. EMA from EMA-01)
      const unitNum = tenant.unit_number || '';
      let propCode = 'PROP';
      if (unitNum.includes('-')) {
        propCode = unitNum.split('-')[0].toUpperCase();
      } else {
        propCode = unitNum.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() || 'PROP';
      }
      
      // 2. Generate YearMonth (YYYYMM)
      const yyyymm = formData.billing_month.replace(/-/g, '').slice(0, 6);

      // 3. Get next sequence number (SS) for this property and month
      const { count } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('property_id', tenant.property_id)
        .eq('billing_date', formData.billing_month);

      const sequence = String((count || 0) + 1).padStart(2, '0');
      
      // 4. Final Format: INV-PROP-YYYYMM-SS
      const invoiceNumber = `INV-${propCode}-${yyyymm}-${sequence}`;

      const { error } = await supabase
        .from('invoices')
        .insert([{
          tenant_id: formData.tenant_id,
          property_id: tenant.property_id,
          invoice_number: invoiceNumber,
          billing_date: formData.billing_month,
          due_date: formData.due_date,
          billing_period_start: formData.billing_period_start,
          billing_period_end: formData.billing_period_end,
          rent_amount: Number(prorationDetails.proratedAmount),
          water_charges: Number(formData.water_charges),
          prev_electricity_reading: Number(formData.prev_electricity_reading),
          curr_electricity_reading: Number(formData.curr_electricity_reading),
          electricity_rate: Number(formData.electricity_rate),
          misc_charges: Number(formData.misc_charges),
          previous_balance: Number(formData.previous_balance),
          amount: totalAmount,
          status: 'pending',
          description: formData.description
        }]);

      if (error) throw error;
      
      router.push('/invoices');
      router.refresh();
    } catch (error: any) {
      console.error('Error saving invoice:', error);
      alert('Error saving invoice: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', animation: 'fadeIn 0.5s ease' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <Button 
          component={Link} 
          href="/invoices" 
          startIcon={<ChevronLeft size={18} />}
          sx={{ color: 'text.secondary' }}
        >
          Back
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>Generate Monthly Invoice</Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Stack spacing={3}>
            <Card>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                  <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', display: 'flex' }}>
                    <User size={20} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Tenant Selection</Typography>
                </Box>
                
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12 }}>
                    <TextField 
                      fullWidth select label="Select Tenant" name="tenant_id" value={formData.tenant_id} onChange={handleChange} required
                      disabled={fetchingTenants}
                    >
                      {tenants.map((t) => (
                        <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField 
                      fullWidth 
                      type="month" 
                      label="Billing Month" 
                      name="billing_month" 
                      value={formData.billing_month.slice(0, 7)} 
                      onChange={handleMonthChange} 
                      required 
                      slotProps={{ inputLabel: { shrink: true } }} 
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField 
                      fullWidth 
                      type="date" 
                      label="Due Date (Fixed to 15th)" 
                      name="due_date" 
                      value={formData.due_date} 
                      slotProps={{ 
                        input: { readOnly: true },
                        inputLabel: { shrink: true } 
                      }} 
                    />
                  </Grid>
                  
                  <Grid size={{ xs: 12 }}>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="subtitle2" sx={{ mb: 2, mt: 1, fontWeight: 700, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Calendar size={16} /> BILLING PERIOD (FOR RENT PRORATION)
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField fullWidth type="date" label="Period Start" name="billing_period_start" value={formData.billing_period_start} onChange={handleChange} required slotProps={{ inputLabel: { shrink: true } }} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField fullWidth type="date" label="Period End" name="billing_period_end" value={formData.billing_period_end} onChange={handleChange} required slotProps={{ inputLabel: { shrink: true } }} />
                  </Grid>
                  
                  {prorationDetails.isProrated && (
                    <Grid size={{ xs: 12 }}>
                      <Alert severity="warning" sx={{ bgcolor: alpha(theme.palette.warning.main, 0.05), border: '1px solid', borderColor: alpha(theme.palette.warning.main, 0.2) }}>
                        Rent is being prorated for <strong>{prorationDetails.daysInPeriod} days</strong> out of {prorationDetails.daysInMonth}.
                        <br/>Daily Rate: ₹{prorationDetails.dailyRate.toFixed(2)}
                      </Alert>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>

            <Card>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                  <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: alpha('#fbbf24', 0.1), color: '#fbbf24', display: 'flex' }}>
                    <Zap size={20} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Utility Charges</Typography>
                </Box>
                
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, color: 'primary.main' }}>ELECTRICITY BILLING</Typography>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField 
                      fullWidth type="number" label="Prev Reading" name="prev_electricity_reading" value={formData.prev_electricity_reading} onChange={handleChange}
                      slotProps={{ input: { endAdornment: <InputAdornment position="end">kWh</InputAdornment> } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField 
                      fullWidth type="number" label="Curr Reading" name="curr_electricity_reading" value={formData.curr_electricity_reading} onChange={handleChange}
                      slotProps={{ input: { endAdornment: <InputAdornment position="end">kWh</InputAdornment> } }}
                      autoFocus
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField 
                      fullWidth type="number" label="Rate/Unit" name="electricity_rate" value={formData.electricity_rate} onChange={handleChange}
                      slotProps={{ input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Alert icon={<History size={18} />} severity="info" sx={{ bgcolor: alpha(theme.palette.info.main, 0.05), color: 'info.main', border: '1px solid', borderColor: alpha(theme.palette.info.main, 0.2) }}>
                      Usage: <strong>{electricityUsage} Units</strong> × ₹{formData.electricity_rate} = <strong>₹{electricityAmount.toLocaleString()}</strong>
                    </Alert>
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="subtitle2" sx={{ mb: 2, mt: 2, fontWeight: 700, color: '#38bdf8' }}>WATER & OTHERS</Typography>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField 
                      fullWidth type="number" label="Water Charges (LumpSum)" name="water_charges" value={formData.water_charges} onChange={handleChange}
                      slotProps={{ input: { startAdornment: <InputAdornment position="start"><Droplets size={16} style={{ marginRight: 8 }} /> ₹</InputAdornment> } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField 
                      fullWidth type="number" label="Misc Charges" name="misc_charges" value={formData.misc_charges} onChange={handleChange}
                      slotProps={{ input: { startAdornment: <InputAdornment position="start"><PlusCircle size={16} style={{ marginRight: 8 }} /> ₹</InputAdornment> } }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                  <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: alpha('#ef4444', 0.1), color: '#ef4444', display: 'flex' }}>
                    <History size={20} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Arrears & Carry Forward</Typography>
                </Box>
                <TextField 
                  fullWidth type="number" label="Previous Balance" name="previous_balance" value={formData.previous_balance} onChange={handleChange}
                  helperText="Unpaid amounts from previous months"
                  slotProps={{ input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> } }}
                />
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ position: 'sticky', top: 24, bgcolor: alpha(theme.palette.primary.main, 0.03), border: '1px solid', borderColor: alpha(theme.palette.primary.main, 0.1) }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>Invoice Summary</Typography>
              
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color="text.secondary">
                    {prorationDetails.isProrated ? 'Prorated Rent' : 'Monthly Rent'}
                  </Typography>
                  <Typography sx={{ fontWeight: 600 }}>₹{Number(prorationDetails.proratedAmount).toLocaleString()}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color="text.secondary">Electricity</Typography>
                  <Typography sx={{ fontWeight: 600 }}>₹{electricityAmount.toLocaleString()}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color="text.secondary">Water Charges</Typography>
                  <Typography sx={{ fontWeight: 600 }}>₹{Number(formData.water_charges).toLocaleString()}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color="text.secondary">Misc Charges</Typography>
                  <Typography sx={{ fontWeight: 600 }}>₹{Number(formData.misc_charges).toLocaleString()}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color="text.secondary">Arrears</Typography>
                  <Typography sx={{ fontWeight: 600, color: '#ef4444' }}>₹{Number(formData.previous_balance).toLocaleString()}</Typography>
                </Box>
                
                <Divider sx={{ my: 1 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>Total Due</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: 'primary.main' }}>
                    ₹{totalAmount.toLocaleString()}
                  </Typography>
                </Box>

                <Button 
                  fullWidth variant="contained" size="large" onClick={handleSave} disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Save size={20} />}
                  sx={{ py: 2, mt: 2, fontWeight: 800 }}
                >
                  {loading ? 'Generating...' : 'Generate Invoice'}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
