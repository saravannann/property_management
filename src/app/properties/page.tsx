'use client';
import { 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  CardMedia,
  Typography, 
  Button, 
  IconButton,
  alpha,
  Chip,
  InputBase,
  Stack,
  useTheme
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

export default function PropertiesPage() {
  const theme = useTheme();
  const properties = [
    {
      id: "1",
      name: "Emerald Heights",
      address: "Sector 45, Gurgaon",
      units: 12,
      occupied: 10,
      type: "Apartment",
      image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=600",
    },
    {
      id: "2",
      name: "Sapphire Villas",
      address: "Whitefield, Bangalore",
      units: 4,
      occupied: 4,
      type: "Villa",
      image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=600",
    },
    {
      id: "3",
      name: "Crystal Plaza",
      address: "Andheri West, Mumbai",
      units: 25,
      occupied: 18,
      type: "Commercial",
      image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=600",
    },
  ];

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
          <Button 
            variant="contained" 
            startIcon={<Plus size={18} />}
            component={Link}
            href="/properties/add"
          >
            Add Property
          </Button>
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

      <Grid container spacing={4}>
        {properties.map((property) => (
          <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={property.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
              <CardMedia
                component="img"
                height="220"
                image={property.image}
                alt={property.name}
                sx={{ transition: 'transform 0.5s ease', '&:hover': { transform: 'scale(1.05)' } }}
              />
              <Box sx={{ position: 'absolute', top: 12, right: 12 }}>
                <IconButton size="small" sx={{ bgcolor: alpha('#000', 0.4), color: '#fff', '&:hover': { bgcolor: alpha('#000', 0.6) } }}>
                  <MoreVertical size={18} />
                </IconButton>
              </Box>
              <Chip 
                label={property.type} 
                size="small"
                sx={{ 
                  position: 'absolute', 
                  top: 180, 
                  left: 12, 
                  bgcolor: 'primary.main', 
                  color: 'white',
                  fontWeight: 800,
                  fontSize: '0.65rem',
                  textTransform: 'uppercase'
                }} 
              />
              
              <CardContent sx={{ flexGrow: 1, p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                  {property.name}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, color: 'text.secondary' }}>
                  <MapPin size={16} color="#6366f1" />
                  <Typography variant="body2">{property.address}</Typography>
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
                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block', mb: 0.5 }}>TOTAL</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>{property.units}</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block', mb: 0.5 }}>OCCUPIED</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>{property.occupied}</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block', mb: 0.5 }}>VACANT</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'warning.main' }}>{property.units - property.occupied}</Typography>
                  </Box>
                </Box>

                <Stack direction="row" spacing={2}>
                  <Button variant="outlined" fullWidth size="small">Details</Button>
                  <Button variant="contained" fullWidth size="small" endIcon={<ArrowRight size={16} />}>Tenants</Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}

        {/* Add Property Card */}
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <Card 
            component={Link} 
            href="/properties/add"
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
              textDecoration: 'none',
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
        </Grid>
      </Grid>
    </Box>
  );
}
