'use client';
import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  CardMedia,
  Typography, 
  Button, 
  Avatar,
  Chip,
  IconButton,
  InputBase,
  Stack,
  alpha,
  useTheme,
  CircularProgress,
  Menu,
  MenuItem
} from '@mui/material';
import { 
  Building2, 
  MapPin, 
  MoreVertical, 
  Plus, 
  Search, 
  Filter,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from '@/lib/supabase';

export default function PropertiesPage() {
  const theme = useTheme();
  const router = useRouter();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, id: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedPropertyId(id);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedPropertyId(null);
  };

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      let query = supabase
        .from('properties')
        .select(`
          *,
          tenants:tenants(count)
        `);

      // If not admin, restrict view
      if (profile?.role !== 'admin') {
        query = query.or(`owner_id.eq.${user.id},assigned_to.eq.${user.id}`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data to include a flat occupied count
      const propertiesWithCounts = data?.map(p => ({
        ...p,
        occupied: p.tenants?.[0]?.count || 0
      }));

      setProperties(propertiesWithCounts || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
      // Fallback to mock data if fetch fails
      setProperties([
        {
          id: "1",
          name: "Emerald Heights",
          address: "Sector 45, Gurgaon",
          total_units: 12,
          property_type: "Apartment",
          image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=600",
        },
        {
          id: "2",
          name: "Sapphire Villas",
          address: "Whitefield, Bangalore",
          total_units: 4,
          property_type: "Villa",
          image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=600",
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  return (
    <Box sx={{ animation: 'fadeIn 0.5s ease' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
            Properties
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your real estate portfolio across multiple locations.
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" startIcon={<Filter size={18} />}>
            Filter
          </Button>
          <Link href="/properties/add" style={{ textDecoration: 'none' }}>
            <Button 
              variant="contained" 
              startIcon={<Plus size={18} />}
            >
              Add Property
            </Button>
          </Link>
        </Stack>
      </Box>

      {/* Search Bar */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        bgcolor: 'background.paper', 
        px: 3, 
        py: 1.5, 
        borderRadius: 3,
        border: '1px solid rgba(255, 255, 255, 0.05)',
        mb: 4
      }}>
        <Search size={20} style={{ color: alpha('#f8fafc', 0.5) }} />
        <InputBase
          placeholder="Search by property name, address or type..."
          sx={{ ml: 2, flex: 1, color: 'text.primary', fontSize: '0.95rem' }}
        />
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={4}>
          {properties.map((property) => (
            <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={property.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                {(() => {
                  const type = (property.property_type || property.type || 'Apartment').toLowerCase();
                  const getDefaultImage = () => {
                    if (type.includes('commercial')) return "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=600";
                    if (type.includes('villa')) return "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=600";
                    if (type.includes('office')) return "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=600";
                    return "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=600";
                  };
                  return (
                    <CardMedia
                      component="img"
                      height="220"
                      image={property.image || getDefaultImage()}
                      alt={property.name}
                      sx={{ transition: 'transform 0.5s ease', '&:hover': { transform: 'scale(1.05)' } }}
                    />
                  );
                })()}
                <Box sx={{ position: 'absolute', top: 12, right: 12 }}>
                  <IconButton 
                    size="small" 
                    onClick={(e) => handleMenuOpen(e, property.id)}
                    sx={{ bgcolor: alpha('#000', 0.4), color: '#fff', '&:hover': { bgcolor: alpha('#000', 0.6) } }}
                  >
                    <MoreVertical size={18} />
                  </IconButton>
                </Box>
                
                {(() => {
                  const type = (property.property_type || property.type || 'Apartment').toLowerCase();
                  const getChipColor = () => {
                    if (type.includes('commercial')) return { bg: '#f59e0b', text: '#fff' }; // Amber
                    if (type.includes('villa')) return { bg: '#10b981', text: '#fff' }; // Emerald
                    if (type.includes('office')) return { bg: '#8b5cf6', text: '#fff' }; // Violet
                    return { bg: theme.palette.primary.main, text: '#fff' }; // Default Indigo
                  };
                  const colors = getChipColor();
                  
                  return (
                    <Chip 
                      label={property.property_type || property.type || 'Apartment'} 
                      size="small"
                      sx={{ 
                        position: 'absolute', 
                        top: 180, 
                        left: 12, 
                        bgcolor: colors.bg, 
                        color: colors.text,
                        fontWeight: 800,
                        fontSize: '0.65rem',
                        textTransform: 'uppercase',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                      }} 
                    />
                  );
                })()}
                
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                    {property.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, color: 'text.secondary' }}>
                    <MapPin size={16} color="#6366f1" />
                    <Typography variant="body2">{property.city || property.address}</Typography>
                  </Box>

                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    bgcolor: alpha('#fff', 0.02),
                    p: 2,
                    borderRadius: 2,
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    mb: 3
                  }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block', mb: 0.5 }}>UNITS</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>{property.total_units || property.units}</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block', mb: 0.5 }}>OCCUPIED</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>{property.occupied || 0}</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block', mb: 0.5 }}>VACANT</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: 'warning.main' }}>{(property.total_units || property.units) - (property.occupied || 0)}</Typography>
                    </Box>
                  </Box>

                  <Stack direction="row" spacing={2}>
                    <Button variant="outlined" fullWidth size="small">Details</Button>
                    <Link href={`/tenants?propertyId=${property.id}`} style={{ textDecoration: 'none', width: '100%' }}>
                      <Button variant="contained" fullWidth size="small" endIcon={<ArrowRight size={16} />}>Tenants</Button>
                    </Link>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}

          {/* Add Property Card */}
          <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
            <Link href="/properties/add" style={{ textDecoration: 'none' }}>
              <Card 
                sx={{ 
                  height: '100%', 
                  minHeight: 400,
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  borderStyle: 'dashed',
                  borderWidth: 2,
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  bgcolor: 'transparent',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: alpha(theme.palette.primary.main, 0.02)
                  }
                }}
              >
                <Box sx={{ 
                  p: 2.5, 
                  borderRadius: '50%', 
                  bgcolor: alpha('#fff', 0.03),
                  mb: 2,
                  color: 'text.secondary'
                }}>
                  <Plus size={40} />
                </Box>
                <Typography variant="h6" color="text.primary" sx={{ fontWeight: 700 }}>Add Property</Typography>
                <Typography variant="body2" color="text.secondary">Expand your portfolio</Typography>
              </Card>
            </Link>
          </Grid>
        </Grid>
      )}

      {/* Property Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => {
          router.push(`/properties/${selectedPropertyId}/edit`);
          handleMenuClose();
        }}>
          Edit Property
        </MenuItem>
        <MenuItem onClick={async () => {
          if (confirm('Are you sure you want to delete this property?')) {
            await supabase.from('properties').delete().eq('id', selectedPropertyId);
            fetchProperties();
          }
          handleMenuClose();
        }} sx={{ color: 'error.main' }}>
          Delete Property
        </MenuItem>
      </Menu>
    </Box>
  );
}
