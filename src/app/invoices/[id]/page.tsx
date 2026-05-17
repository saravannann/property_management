'use client';
import React, { useEffect, useState, use } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  Button, 
  Divider, 
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Stack,
  alpha,
  useTheme,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import { ChevronLeft, Printer, Download, CheckCircle, Clock, AlertCircle, History } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from '@/lib/supabase';

export default function InvoiceDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const theme = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [invoice, setInvoice] = useState<any>(null);
  
  // Partial Payment Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('invoices')
          .select(`
            *,
            tenants (
              name,
              unit_number,
              phone_number,
              email
            ),
            properties (
              name,
              address,
              city,
              state,
              pincode
            )
          `)
          .eq('id', resolvedParams.id)
          .single();

        if (error) throw error;
        setInvoice(data);
      } catch (error) {
        console.error('Error fetching invoice details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [resolvedParams.id]);

  const handleMarkAsPaid = async (isFull: boolean) => {
    try {
      setUpdating(true);
      
      const totalAmount = Number(invoice.amount);
      const currentlyPaid = Number(invoice.amount_paid || 0);
      
      let newPaid = totalAmount;
      if (!isFull) {
        const added = Number(paymentAmount);
        if (isNaN(added) || added <= 0) {
          alert("Please enter a valid amount");
          setUpdating(false);
          return;
        }
        newPaid = currentlyPaid + added;
      }

      const newStatus = newPaid >= totalAmount ? 'paid' : invoice.status;

      const { error } = await supabase
        .from('invoices')
        .update({ status: newStatus, amount_paid: newPaid })
        .eq('id', invoice.id);
        
      if (error) throw error;
      
      setInvoice({ ...invoice, status: newStatus, amount_paid: newPaid });
      setPaymentModalOpen(false);
      setPaymentAmount('');
    } catch (error) {
      console.error('Error recording payment:', error);
      alert('Failed to record payment.');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid': return { color: 'success', icon: <CheckCircle size={16} />, label: 'PAID' };
      case 'pending': return { color: 'warning', icon: <Clock size={16} />, label: 'PENDING' };
      case 'overdue': return { color: 'error', icon: <AlertCircle size={16} />, label: 'OVERDUE' };
      case 'elapsed': return { color: 'info', icon: <History size={16} />, label: 'ELAPSED (ROLLED OVER)' };
      default: return { color: 'default', icon: undefined, label: status?.toUpperCase() };
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!invoice) {
    return (
      <Box sx={{ textAlign: 'center', mt: 8 }}>
        <Typography variant="h5">Invoice not found</Typography>
        <Button component={Link} href="/invoices" sx={{ mt: 2 }}>Back to Invoices</Button>
      </Box>
    );
  }

  const statusInfo = getStatusDisplay(invoice.status);
  const electricityUsage = Math.max(0, Number(invoice.curr_electricity_reading) - Number(invoice.prev_electricity_reading));
  const electricityTotal = electricityUsage * Number(invoice.electricity_rate);

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', animation: 'fadeIn 0.5s ease', '@media print': { m: 0, p: 0, maxWidth: 'none' } }}>
      {/* Non-printable header actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, '@media print': { display: 'none' } }}>
        <Button 
          component={Link} 
          href="/invoices" 
          startIcon={<ChevronLeft size={18} />}
          sx={{ color: 'text.secondary' }}
        >
          Back to Invoices
        </Button>
        <Stack direction="row" spacing={2}>
          {(invoice.status === 'pending' || invoice.status === 'overdue') && (
            <>
              <Button 
                variant="outlined" 
                color="primary" 
                onClick={() => setPaymentModalOpen(true)}
                disabled={updating}
              >
                Record Partial Payment
              </Button>
              <Button 
                variant="contained" 
                color="success" 
                startIcon={updating ? <CircularProgress size={18} color="inherit" /> : <CheckCircle size={18} />} 
                onClick={() => handleMarkAsPaid(true)}
                disabled={updating}
              >
                Mark as Paid in Full
              </Button>
            </>
          )}
          <Button variant="outlined" startIcon={<Printer size={18} />} onClick={handlePrint}>
            Print
          </Button>
          <Button variant="contained" startIcon={<Download size={18} />}>
            Download PDF
          </Button>
        </Stack>
      </Box>

      <Card sx={{ '@media print': { boxShadow: 'none', border: 'none' } }}>
        <CardContent sx={{ p: { xs: 3, md: 6 } }}>
          {/* Invoice Header */}
          <Grid container spacing={4} sx={{ mb: 6 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="h3" sx={{ fontWeight: 900, color: 'primary.main', mb: 1 }}>INVOICE</Typography>
              <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 600 }}>#{invoice.invoice_number}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
              <Chip 
                // @ts-ignore
                color={statusInfo.color} 
                icon={statusInfo.icon} 
                label={statusInfo.label} 
                sx={{ fontWeight: 800, px: 1, py: 2.5, borderRadius: 2, fontSize: '0.9rem', mb: 2 }} 
              />
            </Grid>
          </Grid>

          <Divider sx={{ mb: 6 }} />

          {/* Billing Info */}
          <Grid container spacing={4} sx={{ mb: 6 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: 1 }}>Billed To</Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, mt: 1 }}>{invoice.tenants?.name}</Typography>
              <Typography variant="body1" sx={{ mt: 0.5 }}>{invoice.properties?.name}</Typography>
              <Typography variant="body2" color="text.secondary">Unit: {invoice.tenants?.unit_number || 'N/A'}</Typography>
              {invoice.tenants?.phone_number && <Typography variant="body2" color="text.secondary">Ph: {invoice.tenants.phone_number}</Typography>}
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
              <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: 1 }}>Payment Details</Typography>
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" color="text.secondary">Billing Month</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                  {new Date(invoice.billing_date).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                </Typography>
                
                <Typography variant="body2" color="text.secondary">Period</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                  {new Date(invoice.billing_period_start).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - {new Date(invoice.billing_period_end).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Typography>

                <Typography variant="body2" color="text.secondary">Due Date</Typography>
                <Typography variant="body1" sx={{ fontWeight: 800, color: 'error.main' }}>
                  {new Date(invoice.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* Itemized Breakdown */}
          <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: 1 }}>Charge Breakdown</Typography>
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', mt: 2, mb: 4 }}>
            <Table>
              <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Monthly Rent</Typography>
                  </TableCell>
                  <TableCell align="right">₹{Number(invoice.rent_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                </TableRow>
                
                {Number(invoice.water_charges) > 0 && (
                  <TableRow>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>Water Charges</Typography>
                      <Typography variant="caption" color="text.secondary">LumpSum</Typography>
                    </TableCell>
                    <TableCell align="right">₹{Number(invoice.water_charges).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                )}

                {(Number(invoice.curr_electricity_reading) > 0 || Number(invoice.electricity_rate) > 0) && (
                  <TableRow>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>Electricity Charges</Typography>
                      <Typography variant="caption" color="text.secondary">
                        (Curr: {invoice.curr_electricity_reading} - Prev: {invoice.prev_electricity_reading}) = {electricityUsage} units @ ₹{invoice.electricity_rate}/unit
                      </Typography>
                    </TableCell>
                    <TableCell align="right">₹{electricityTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                )}

                {Number(invoice.misc_charges) > 0 && (
                  <TableRow>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>Miscellaneous Charges</Typography>
                    </TableCell>
                    <TableCell align="right">₹{Number(invoice.misc_charges).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                )}

                {Number(invoice.previous_balance) > 0 && (
                  <TableRow>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }} color="error.main">Previous Balance (Arrears)</Typography>
                      <Typography variant="caption" color="text.secondary">Carried forward from unpaid invoices</Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ color: 'error.main' }}>₹{Number(invoice.previous_balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Totals */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Box sx={{ width: { xs: '100%', sm: '50%' } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Grand Total</Typography>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>
                  ₹{Number(invoice.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </Typography>
              </Box>
              
              {Number(invoice.amount_paid) > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, color: 'success.main' }}>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>Amount Paid</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 800 }}>
                    - ₹{Number(invoice.amount_paid).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Typography>
                </Box>
              )}

              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>Balance Due</Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, color: 'primary.main' }}>
                  ₹{Math.max(0, Number(invoice.amount) - Number(invoice.amount_paid || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </Typography>
              </Box>

              {invoice.description && (
                <Box sx={{ mt: 3, p: 2, bgcolor: alpha(theme.palette.info.main, 0.05), borderRadius: 2 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>Notes</Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>{invoice.description}</Typography>
                </Box>
              )}
            </Box>
          </Box>

        </CardContent>
      </Card>

      {/* Partial Payment Modal */}
      <Dialog open={paymentModalOpen} onClose={() => setPaymentModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Record Partial Payment</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
            Enter the amount the tenant has paid. This will be deducted from the total balance.
          </Typography>
          <TextField
            fullWidth
            label="Payment Amount (₹)"
            type="number"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            slotProps={{ htmlInput: { min: 1, max: Number(invoice.amount) - Number(invoice.amount_paid || 0) } }}
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setPaymentModalOpen(false)} color="inherit">Cancel</Button>
          <Button 
            onClick={() => handleMarkAsPaid(false)} 
            variant="contained" 
            disabled={!paymentAmount || Number(paymentAmount) <= 0}
          >
            Save Payment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
