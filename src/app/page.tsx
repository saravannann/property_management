'use client';
import React from 'react';
import { 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Stack,
  alpha,
  useTheme,
  CircularProgress
} from '@mui/material';
import { 
  Building2, 
  Users, 
  Receipt, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock, 
  Plus,
  ArrowRight,
  Home,
  Percent,
  Wallet,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/components/LanguageProvider';

export default function Dashboard() {
  const theme = useTheme();
  const { t, locale } = useLanguage();
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState({
    propertyCount: 0,
    tenantCount: 0,
    totalRevenue: 0,
    totalAdvance: 0,
    pendingInvoices: 0,
    pendingAmount: 0,
    vacantApartments: 0,
    vacantCommercial: 0,
    occupancyRate: 0,
    pendingGenerationPercent: 100,
    prevMonthName: '',
    highRiskTenantsCount: 0,
    recentActivity: [] as any[]
  });

  React.useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Fetch User Profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        // 2. Fetch Properties with their tenant counts
        let query = supabase
          .from('properties')
          .select('id, name, property_type, total_units, created_at, tenants:tenants(count)');
        
        if (profile?.role !== 'admin') {
          query = query.or(`owner_id.eq.${user.id},assigned_managers.cs.{${user.id}}`);
        }

        const { data: props, error: propsError } = await query;
        if (propsError) throw propsError;
        
        const propertyCount = props?.length || 0;
        const propertyIds = props?.map(p => p.id) || [];
        
        let vacantApartments = 0;
        let vacantCommercial = 0;
        let tenantCount = 0;
        let totalUnits = 0;

        props?.forEach(p => {
          const type = (p.property_type || '').toLowerCase();
          const total = Number(p.total_units) || 0;
          const occupied = p.tenants?.[0]?.count || 0;
          const vacant = Math.max(0, total - occupied);

          totalUnits += total;
          tenantCount += occupied;

          if (type.includes('apartment') || type.includes('villa')) {
            vacantApartments += vacant;
          } else {
            vacantCommercial += vacant;
          }
        });

        const occupancyRate = totalUnits > 0 ? Math.round((tenantCount / totalUnits) * 100) : 0;

        // 3. Calculate Revenue & Advance (Only for properties visible to this user)
        let totalRevenue = 0;
        let totalAdvance = 0;
        if (propertyIds.length > 0) {
          const { data: activeTenants } = await supabase
            .from('tenants')
            .select('monthly_rent, security_deposit')
            .eq('is_active', true)
            .in('property_id', propertyIds);
          
          totalRevenue = activeTenants?.reduce((acc, t) => acc + Number(t.monthly_rent), 0) || 0;
          totalAdvance = activeTenants?.reduce((acc, t) => acc + Number(t.security_deposit || 0), 0) || 0;
        }

        // 4. Pending Invoices & Amount (Only for properties visible to this user)
        let pendingInvoices = 0;
        let pendingAmount = 0;
        if (propertyIds.length > 0) {
          const { data: invData, count } = await supabase
            .from('invoices')
            .select('amount, amount_paid', { count: 'exact' })
            .eq('status', 'pending')
            .in('property_id', propertyIds);
          
          pendingInvoices = count || 0;
          pendingAmount = invData?.reduce((acc, inv) => acc + Math.max(0, Number(inv.amount) - Number(inv.amount_paid || 0)), 0) || 0;
        }

        // 5. Calculate Pending Invoice Generation % for Previous Month
        let pendingGenerationPercent = 100;
        let prevMonthName = "";
        
        const today = new Date();
        const prevMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const prevMonthStr = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}-01`;
        prevMonthName = prevMonthDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });

        if (propertyIds.length > 0) {
          const { data: activeTenantsForCalc } = await supabase
            .from('tenants')
            .select('id')
            .eq('is_active', true)
            .in('property_id', propertyIds);
            
          const activeTenantCount = activeTenantsForCalc?.length || 0;
          
          if (activeTenantCount > 0) {
            const { count: generatedCount } = await supabase
              .from('invoices')
              .select('id', { count: 'exact', head: true })
              .in('property_id', propertyIds)
              .eq('billing_date', prevMonthStr);
              
            const generatedPercent = ((generatedCount || 0) / activeTenantCount) * 100;
            pendingGenerationPercent = Math.max(0, Math.round(100 - generatedPercent));
          } else {
            pendingGenerationPercent = 0; // 0 active tenants = 0% pending
          }
        }

        // 6. Calculate High Risk Tenants (Unpaid >= 80% of Security Deposit)
        let highRiskTenantsCount = 0;
        if (propertyIds.length > 0) {
          const { data: unpaidInvoices } = await supabase
            .from('invoices')
            .select('tenant_id, amount, amount_paid')
            .in('status', ['pending', 'overdue'])
            .in('property_id', propertyIds);

          const { data: activeTenantsList } = await supabase
            .from('tenants')
            .select('id, security_deposit')
            .eq('is_active', true)
            .in('property_id', propertyIds);

          if (unpaidInvoices && activeTenantsList) {
            const unpaidByTenant = unpaidInvoices.reduce((acc, inv) => {
              const balance = Math.max(0, Number(inv.amount) - Number(inv.amount_paid || 0));
              acc[inv.tenant_id] = (acc[inv.tenant_id] || 0) + balance;
              return acc;
            }, {} as Record<string, number>);

            highRiskTenantsCount = activeTenantsList.reduce((count, tenant) => {
              const unpaid = unpaidByTenant[tenant.id] || 0;
              const deposit = Number(tenant.security_deposit) || 0;
              if (deposit > 0 && unpaid >= deposit * 0.8) {
                return count + 1;
              }
              return count;
            }, 0);
          }
        }

        // 7. Recent Activity (Filtered by visible properties)
        const recentActivity = props
          ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 4)
          .map(p => ({
            title: locale === 'ta' ? "சொத்து சேர்க்கப்பட்டது" : "Property Added",
            description: locale === 'ta' ? `${p.name} உங்கள் சொத்து பட்டியலில் சேர்க்கப்பட்டது` : `${p.name} was added to your portfolio`,
            time: new Date(p.created_at).toLocaleDateString(locale === 'ta' ? 'ta-IN' : 'en-IN'),
            status: 'success'
          })) || [];

        setData({
          propertyCount,
          tenantCount,
          totalRevenue,
          totalAdvance,
          pendingInvoices,
          pendingAmount,
          vacantApartments,
          vacantCommercial,
          occupancyRate,
          pendingGenerationPercent,
          prevMonthName,
          highRiskTenantsCount,
          recentActivity
        });

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [locale]);

  const getSmartInsight = () => {
    const isTa = locale === 'ta';
    if (data.highRiskTenantsCount > 0) {
      return {
        text: isTa 
          ? `"${data.highRiskTenantsCount} வாடகையாளர்கள் தங்கள் முன்பண வரம்பை விட அதிக நிலுவைத் தொகையைக் கொண்டுள்ளனர். லீஸ் விபரங்களை மறுபரிசீலனை செய்யவும்."`
          : `"${data.highRiskTenantsCount} active tenant${data.highRiskTenantsCount > 1 ? 's have' : ' has'} pending balances close to or exceeding their security deposit limit. A lease review is advised."`,
        actionText: isTa ? "வாடகையாளர்களை ஆராய்க" : "Review High Risk Tenants",
        link: "/tenants"
      };
    }
    if (data.pendingGenerationPercent > 0) {
      return {
        text: isTa 
          ? `"${data.prevMonthName || 'கடந்த மாத'} வாடகை ரசீதுகளில் ${data.pendingGenerationPercent}% இன்னும் தயாரிக்கப்படவில்லை. பணப்புழக்கத்தைத் தக்கவைக்க ரசீதுகளை உருவாக்கவும்."`
          : `"${data.pendingGenerationPercent}% of invoices for the month of ${data.prevMonthName || 'last month'} are still pending generation. Complete billing to maintain cash flow."`,
        actionText: isTa ? "ரசீதுகளை உருவாக்கு" : "Generate Invoices",
        link: "/invoices/add"
      };
    }
    if (data.pendingAmount > 0) {
      return {
        text: isTa 
          ? `"உங்களுக்கு ₹${data.pendingAmount.toLocaleString()} நிலுவைத் தொகை வர வேண்டியுள்ளது (${data.pendingInvoices} ரசீதுகள்). வாடகையாளர்களுக்கு நினைவூட்டல் அனுப்பவும்."`
          : `"You have ₹${data.pendingAmount.toLocaleString()} in outstanding payments across ${data.pendingInvoices} pending invoices. Consider sending reminders."`,
        actionText: isTa ? "வாடகையை வசூலி" : "Collect Payments",
        link: "/invoices"
      };
    }
    if (data.occupancyRate < 85 && data.occupancyRate > 0) {
      return {
        text: isTa 
          ? `"உங்கள் சொத்துக்களின் ஒட்டுமொத்த வாடகைக்குடி வீதம் ${data.occupancyRate}% ஆக உள்ளது. வாடகை வருவாயை அதிகரிக்க காலியாக உள்ள வீடுகளை விளம்பரப்படுத்தவும்."`
          : `"Your portfolio occupancy is currently at ${data.occupancyRate}%. Consider listing the vacant spaces to optimize rent yield."`,
        actionText: isTa ? "சொத்துக்களை நிர்வகி" : "Manage Properties",
        link: "/properties"
      };
    }
    return {
      text: isTa 
        ? `"உங்கள் வாடகை சொத்துக்கள் மிகச் சிறப்பாக இயங்குகின்றன! 100% வாடகைக் குடியேற்றமும் ரசீதுகளும் முறையாக உள்ளன."`
        : `"Your property portfolio is highly optimized! Occupancy is strong and previous billing cycles are 100% completed."`,
      actionText: isTa ? "சொத்துக்களைப் பார்" : "View Properties",
      link: "/properties"
    };
  };

  const insight = getSmartInsight();

  const stats = [
    { 
      label: t('common.properties'), 
      value: data.propertyCount.toString(), 
      icon: <Building2 size={18} />, 
      color: theme.palette.primary.main,
      path: '/properties'
    },
    { 
      label: t('common.tenants'), 
      value: data.tenantCount.toString(), 
      icon: <Users size={18} />, 
      color: theme.palette.secondary.main,
      path: '/tenants'
    },
    { 
      label: t('dashboard.occupancy'), 
      value: `${data.occupancyRate}%`, 
      icon: <Percent size={18} />, 
      color: '#8b5cf6', // Violet
      path: '/properties'
    },
    { 
      label: t('dashboard.vacantUnits'), 
      isSplit: true,
      apartments: data.vacantApartments,
      commercial: data.vacantCommercial,
      icon: <Home size={18} />, 
      color: '#f59e0b', // Amber
      path: '/properties'
    },
    { 
      label: locale === 'ta' ? `நிலுவையிலுள்ள ரசீதுகள் (${data.prevMonthName})` : `Pending Generation (${data.prevMonthName})`, 
      value: `${data.pendingGenerationPercent}%`, 
      icon: <Receipt size={18} />, 
      color: data.pendingGenerationPercent > 0 ? '#ef4444' : '#10b981', // Red if pending, Green if 0%
      path: '/invoices/add'
    },
    { 
      label: t('dashboard.highRisk'), 
      value: data.highRiskTenantsCount.toString(), 
      icon: <AlertCircle size={18} />, 
      color: data.highRiskTenantsCount > 0 ? '#ef4444' : '#10b981', // Red if > 0
      path: '/tenants'
    },
    { 
      label: t('dashboard.revenue'), 
      value: `₹${(data.totalRevenue || 0).toLocaleString()}`, 
      icon: <TrendingUp size={18} />, 
      color: '#10b981', // Emerald
      path: '/invoices'
    },
    { 
      label: t('dashboard.pendingAmount'), 
      value: `₹${(data.pendingAmount || 0).toLocaleString()}`, 
      icon: <Clock size={18} />, 
      color: '#f59e0b', // Amber
      path: '/invoices'
    },
    { 
      label: t('dashboard.totalAdvance'), 
      value: `₹${(data.totalAdvance || 0).toLocaleString()}`, 
      icon: <Wallet size={18} />, 
      color: '#ec4899', // Pink
      path: '/tenants',
      extra: data.totalAdvance > 0 
        ? locale === 'ta' 
          ? `மதிப்பிடப்பட்ட வருவாய்: ₹${Math.round((data.totalAdvance * 0.09) / 12).toLocaleString()}/மாதம் (@9% வட்டி)`
          : `Est. Yield: ₹${Math.round((data.totalAdvance * 0.09) / 12).toLocaleString()}/mo (@9% p.a.)`
        : null
    },
  ];

  return (
    <Box sx={{ animation: 'fadeIn 0.5s ease' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: { xs: 3, md: 5 } }}>
        <Box>
          <Typography variant="h4" sx={{ 
            fontWeight: 800, 
            letterSpacing: -0.5,
            fontSize: { xs: '1.75rem', md: '2.5rem' }
          }}>
            {t('common.dashboard')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
            {t('common.welcome')}
          </Typography>
        </Box>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 6 }}>
        {stats.map((stat, i) => (
          <Grid size={{ xs: 6, sm: 6, lg: 3 }} key={i}>
            <Link href={stat.path} style={{ textDecoration: 'none' }}>
              <Card sx={{ 
                height: '100%', 
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'translateY(-6px)',
                  boxShadow: `0 12px 24px -10px ${alpha(stat.color, 0.3)}`,
                  borderColor: alpha(stat.color, 0.5),
                  '& .stat-icon': {
                    transform: 'scale(1.1)',
                    bgcolor: alpha(stat.color, 0.2)
                  }
                }
              }}>
                <CardContent sx={{ p: { xs: 1.5, sm: 3 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: { xs: 1, sm: 2 } }}>
                    <Box className="stat-icon" sx={{ 
                      p: { xs: 0.8, sm: 1.2 }, 
                      borderRadius: 1.5, 
                      bgcolor: alpha(stat.color, 0.1), 
                      color: stat.color,
                      display: 'flex',
                      transition: 'all 0.3s ease'
                    }}>
                      {stat.icon}
                    </Box>
                  </Box>
                  
                  {stat.isSplit ? (
                    <>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 1.5, fontSize: { xs: '0.65rem', sm: '0.875rem' }, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {stat.label}
                      </Typography>
                      <Stack 
                        direction="column" 
                        spacing={1} 
                        sx={{ alignItems: 'flex-start' }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                           <Typography variant="h6" sx={{ fontWeight: 800, fontSize: { xs: '0.9rem', sm: '1.25rem' } }}>
                            {loading ? <CircularProgress size={12} /> : stat.apartments}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.6rem' }}>APT</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 800, fontSize: { xs: '0.9rem', sm: '1.25rem' } }}>
                            {loading ? <CircularProgress size={12} /> : stat.commercial}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.6rem' }}>COM</Typography>
                        </Box>
                      </Stack>
                    </>
                  ) : (
                    <>
                      <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.2, fontSize: { xs: '1.1rem', sm: '2.125rem' } }}>
                        {loading ? <CircularProgress size={16} /> : stat.value}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>
                        {stat.label}
                      </Typography>
                      {stat.extra && (
                        <Typography variant="caption" sx={{ display: 'block', mt: 1.5, color: '#10b981', fontWeight: 700, fontSize: { xs: '0.55rem', sm: '0.725rem' } }}>
                          {stat.extra}
                        </Typography>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </Link>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={4}>
        {/* Recent Activity */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>{t('dashboard.recentActivity')}</Typography>
                <Button variant="text" endIcon={<ArrowRight size={16} />} size="small">
                  {locale === 'ta' ? "அனைத்தையும் பார்" : "View All"}
                </Button>
              </Box>
              <Stack spacing={4}>
                {loading ? (
                  <Box sx={{ py: 4, textAlign: 'center' }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : data.recentActivity.length > 0 ? (
                  data.recentActivity.map((activity, i) => (
                    <Box key={i} sx={{ display: 'flex', gap: 2.5 }}>
                      <Box sx={{ 
                        width: 10, 
                        height: 10, 
                        borderRadius: '50%', 
                        bgcolor: 'primary.main', 
                        mt: 0.75,
                        boxShadow: theme.palette.mode === 'dark' ? '0 0 10px rgba(99, 102, 241, 0.5)' : 'none'
                      }} />
                      <Box sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                            {activity.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Clock size={12} />
                            {activity.time}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {activity.description}
                        </Typography>
                      </Box>
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                    {t('dashboard.noActivity')}
                  </Typography>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Insights */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={3}>
            <Card sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05), border: '1px dashed', borderColor: 'primary.main' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="overline" color="primary" sx={{ fontWeight: 800, letterSpacing: 1 }}>
                  {t('dashboard.smartInsight')}
                </Typography>
                <Typography variant="body1" sx={{ mt: 1, mb: 2, fontWeight: 500, fontStyle: 'italic' }}>
                  {insight.text}
                </Typography>
                <Button 
                  variant="outlined" 
                  fullWidth 
                  size="small"
                  component={Link}
                  href={insight.link}
                >
                  {insight.actionText}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>{t('dashboard.quickActions')}</Typography>
                <Stack spacing={1.5}>
                  <Button variant="text" fullWidth sx={{ justifyContent: 'start', py: 1.5, bgcolor: theme.palette.mode === 'dark' ? alpha('#fff', 0.02) : alpha('#000', 0.02) }} startIcon={<Receipt size={18} color="#f59e0b" />}>
                    {t('dashboard.generateInvoices')}
                  </Button>
                  <Button variant="text" fullWidth sx={{ justifyContent: 'start', py: 1.5, bgcolor: theme.palette.mode === 'dark' ? alpha('#fff', 0.02) : alpha('#000', 0.02) }} startIcon={<Users size={18} color="#6366f1" />}>
                    {t('dashboard.pendingRequests')}
                  </Button>
                  <Button variant="text" fullWidth sx={{ justifyContent: 'start', py: 1.5, bgcolor: theme.palette.mode === 'dark' ? alpha('#fff', 0.02) : alpha('#000', 0.02) }} startIcon={<Building2 size={18} color="#c084fc" />}>
                    {t('dashboard.updateMedia')}
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
