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

  // Use explicit string formatting to prevent timezone shifts (e.g. IST +5:30 pushes 1st back to 31st)
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1; // 1-12
  const currentMonthStr = String(currentMonth).padStart(2, '0');
  
  const initialBillingMonthStart = `${currentYear}-${currentMonthStr}-01`;
  const prevPeriodMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const prevPeriodYear = currentMonth === 1 ? currentYear - 1 : currentYear;
  const prevPeriodMonthStr = String(prevPeriodMonth).padStart(2, '0');
  
  const initialPeriodStart = `${prevPeriodYear}-${prevPeriodMonthStr}-01`;
  const daysInPrevPeriodMonth = new Date(prevPeriodYear, prevPeriodMonth, 0).getDate();
  const initialPeriodEnd = `${prevPeriodYear}-${prevPeriodMonthStr}-${daysInPrevPeriodMonth}`;
  
  // Due Date is 15th of the current billing month
  const initialDueDate = `${currentYear}-${currentMonthStr}-15`;

  const [formData, setFormData] = useState({
    property_id: '',
    tenant_id: '',
    billing_month: initialBillingMonthStart,
    due_date: initialDueDate,
    billing_period_start: initialPeriodStart,
    billing_period_end: initialPeriodEnd,
    rent_amount: '' as string | number,
    water_charges: '' as string | number,
    prev_electricity_reading: '' as string | number,
    curr_electricity_reading: '' as string | number,
    electricity_rate: '' as string | number,
    misc_charges: '' as string | number,
    previous_balance: '' as string | number,
    description: ''
  });

  // When billing month changes, update due date and period
  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value; // Format: YYYY-MM
    if (!value) return;

    const [yearStr, monthStr] = value.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10); // 1-12
    
    // Explicitly generate the dates as literal strings to defeat timezone shifts
    const billingMonthStart = `${yearStr}-${monthStr}-01`;
    
    // Period is the previous full month
    const prevPeriodMonth = month === 1 ? 12 : month - 1;
    const prevPeriodYear = month === 1 ? year - 1 : year;
    const prevPeriodMonthStr = String(prevPeriodMonth).padStart(2, '0');
    
    const periodStart = `${prevPeriodYear}-${prevPeriodMonthStr}-01`;
    const daysInPrevMonth = new Date(prevPeriodYear, prevPeriodMonth, 0).getDate();
    const periodEnd = `${prevPeriodYear}-${prevPeriodMonthStr}-${daysInPrevMonth}`;
    
    // Due Date is 15th of the current billing month
    const dueDate = `${yearStr}-${monthStr}-15`;

    setFormData(prev => ({
      ...prev,
      billing_month: billingMonthStart,
      due_date: dueDate,
      billing_period_start: periodStart,
      billing_period_end: periodEnd
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

  // Track which tenants have already been invoiced for the selected billing month
  const [invoicedTenantIds, setInvoicedTenantIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchInvoicedTenants = async () => {
      if (!formData.billing_month) return;
      try {
        const { data, error } = await supabase
          .from('invoices')
          .select('tenant_id')
          .eq('billing_date', formData.billing_month);
          
        if (error) throw error;
        
        const ids = data?.map(d => d.tenant_id) || [];
        setInvoicedTenantIds(ids);
      } catch (error) {
        console.error('Error fetching invoiced tenants:', error);
      }
    };
    fetchInvoicedTenants();
  }, [formData.billing_month]);

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
          .select('amount, amount_paid')
          .eq('tenant_id', formData.tenant_id)
          .in('status', ['pending', 'overdue']);
        
        const totalUnpaid = unpaidInvoices?.reduce((sum, inv) => sum + Math.max(0, Number(inv.amount) - Number(inv.amount_paid || 0)), 0) || 0;

        setFormData(prev => ({
          ...prev,
          rent_amount: tenant?.monthly_rent || '',
          electricity_rate: tenant?.electricity_rate || '',
          water_charges: tenant?.water_charges || '',
          prev_electricity_reading: lastInv?.curr_electricity_reading || '',
          previous_balance: totalUnpaid || ''
        }));
        setLastInvoice(lastInv);

      } catch (error) {
        console.error('Error fetching tenant data:', error);
        // If no last invoice, just set rent
        setFormData(prev => ({
          ...prev,
          rent_amount: tenant?.monthly_rent || '',
          electricity_rate: tenant?.electricity_rate || '',
          water_charges: tenant?.water_charges || '',
          prev_electricity_reading: '',
          previous_balance: ''
        }));
      }
    };

    fetchTenantData();
  }, [formData.tenant_id, tenants]);

  // Compute unique properties for the first dropdown
  const uniqueProperties = useMemo(() => {
    const propsMap = new Map();
    tenants.forEach(t => {
      if (t.property_id && t.properties?.name) {
        propsMap.set(t.property_id, { id: t.property_id, name: t.properties.name });
      }
    });
    return Array.from(propsMap.values());
  }, [tenants]);

  // Filter tenants based on selected property and whether they've been invoiced
  const filteredTenants = useMemo(() => {
    return formData.property_id 
      ? tenants.filter(t => t.property_id === formData.property_id && !invoicedTenantIds.includes(t.id))
      : [];
  }, [tenants, formData.property_id, invoicedTenantIds]);

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
    const usage = Number(formData.curr_electricity_reading) - Number(formData.prev_electricity_reading);
    return usage > 0 ? usage : 0;
  }, [formData.curr_electricity_reading, formData.prev_electricity_reading]);

  const electricityAmount = useMemo(() => {
    return electricityUsage * Number(formData.electricity_rate);
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
    if (name === 'property_id') {
      setFormData(prev => ({
        ...prev,
        property_id: value,
        tenant_id: '',
        rent_amount: '',
        water_charges: '',
        prev_electricity_reading: '',
        curr_electricity_reading: '',
        electricity_rate: '',
        misc_charges: '',
        previous_balance: ''
      }));
      setLastInvoice(null);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    if (!formData.tenant_id) {
      alert('Please select a tenant');
      return;
    }

    if (Number(formData.curr_electricity_reading) < Number(formData.prev_electricity_reading)) {
      alert('Current electricity reading cannot be less than the previous reading.');
      return;
    }

    if (electricityUsage >= 500) {
      if (!window.confirm(`High Electricity Usage Warning: The calculated usage is ${electricityUsage} kWh. Are you sure you want to generate this invoice?`)) {
        return;
      }
    }

    try {
      setLoading(true);
      const tenant = tenants.find(t => t.id === formData.tenant_id);
      if (!tenant) throw new Error('Tenant not found');

      // 0. Prevent Duplicate Bills
      const { data: existingInvoice } = await supabase
        .from('invoices')
        .select('id')
        .eq('tenant_id', formData.tenant_id)
        .eq('billing_date', formData.billing_month)
        .maybeSingle();

      if (existingInvoice) {
        alert('An invoice has already been generated for this tenant for the selected billing month.');
        setLoading(false);
        return;
      }

      // 1. Use full Unit Number as Property/Unit Identifier (e.g. MEA05 or EMA01)
      const unitNum = tenant.unit_number || 'PROP';
      const propCode = unitNum.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      
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
      
      // If we are rolling over a previous balance, mark older open invoices as 'elapsed'
      if (Number(formData.previous_balance) > 0) {
        await supabase
          .from('invoices')
          .update({ status: 'elapsed' })
          .eq('tenant_id', formData.tenant_id)
          .in('status', ['pending', 'overdue'])
          .neq('invoice_number', invoiceNumber);
      }
      
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
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField 
                      fullWidth select label="Select Property" name="property_id" value={formData.property_id} onChange={handleChange} required
                      disabled={fetchingTenants}
                    >
                      {uniqueProperties.map((p) => (
                        <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField 
                      fullWidth select label="Select Tenant" name="tenant_id" value={formData.tenant_id} onChange={handleChange} required
                      disabled={!formData.property_id || fetchingTenants}
                    >
                      {filteredTenants.length === 0 && formData.property_id && (
                        <MenuItem disabled value="">All tenants invoiced / No active tenants</MenuItem>
                      )}
                      {filteredTenants.map((t) => (
                        <MenuItem key={t.id} value={t.id}>{t.name} {t.unit_number ? `(${t.unit_number})` : ''}</MenuItem>
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
                      onBlur={() => {
                        if (formData.curr_electricity_reading !== '' && Number(formData.curr_electricity_reading) < Number(formData.prev_electricity_reading)) {
                          setFormData(prev => ({ ...prev, curr_electricity_reading: '' }));
                        }
                      }}
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
                  {formData.curr_electricity_reading !== '' && Number(formData.curr_electricity_reading) < Number(formData.prev_electricity_reading) && (
                    <Grid size={{ xs: 12 }}>
                      <Alert severity="error" sx={{ bgcolor: alpha(theme.palette.error.main, 0.05), border: '1px solid', borderColor: alpha(theme.palette.error.main, 0.2) }}>
                        <strong>Invalid Reading:</strong> Current reading ({formData.curr_electricity_reading}) cannot be less than the previous reading ({formData.prev_electricity_reading}).
                      </Alert>
                    </Grid>
                  )}
                  {electricityUsage >= 500 && (
                    <Grid size={{ xs: 12 }}>
                      <Alert severity="warning" sx={{ bgcolor: alpha(theme.palette.warning.main, 0.05), border: '1px solid', borderColor: alpha(theme.palette.warning.main, 0.2) }}>
                        <strong>High Electricity Usage Warning:</strong> The calculated usage is <strong>{electricityUsage} kWh</strong>. Please double-check the readings before proceeding.
                      </Alert>
                    </Grid>
                  )}
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
