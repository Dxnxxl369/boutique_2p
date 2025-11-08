'use client';

import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/AdminLayout';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Avatar,
  Divider,
} from '@mui/material';
import { Person, Email, Phone, Lock } from '@mui/icons-material';
import { useState } from 'react';
import Grid from '@mui/material/GridLegacy';

export default function ProfilePage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = () => {
    // TODO: Implementar actualización de perfil con API
    console.log('Guardando perfil:', formData);
    setIsEditing(false);
  };

  return (
    <AdminLayout>
      <Box>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Mi Perfil
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Gestiona tu información personal y configuración de cuenta
        </Typography>

        <Grid container spacing={3}>
          {/* Información del Usuario */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Avatar
                  sx={{
                    width: 120,
                    height: 120,
                    mx: 'auto',
                    mb: 2,
                    fontSize: '3rem',
                    bgcolor: 'primary.main',
                  }}
                >
                  {user?.first_name?.[0] || user?.username?.[0] || 'A'}
                </Avatar>
                <Typography variant="h5" fontWeight={600} gutterBottom>
                  {user?.first_name} {user?.last_name}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  @{user?.username}
                </Typography>
                <Box
                  sx={{
                    display: 'inline-block',
                    mt: 2,
                    px: 2,
                    py: 0.5,
                    borderRadius: 2,
                    bgcolor: 'primary.lighter',
                    color: 'primary.main',
                  }}
                >
                  <Typography variant="caption" fontWeight={600}>
                    {user?.role === 'admin' ? 'Administrador' : 'Usuario'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Formulario de Edición */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" fontWeight={600}>
                    Información Personal
                  </Typography>
                  {!isEditing ? (
                    <Button
                      variant="contained"
                      onClick={() => setIsEditing(true)}
                      sx={{ borderRadius: 2 }}
                    >
                      Editar Perfil
                    </Button>
                  ) : (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        onClick={() => {
                          setIsEditing(false);
                          setFormData({
                            first_name: user?.first_name || '',
                            last_name: user?.last_name || '',
                            email: user?.email || '',
                            phone: user?.phone || '',
                          });
                        }}
                        sx={{ borderRadius: 2 }}
                      >
                        Cancelar
                      </Button>
                      <Button
                        variant="contained"
                        onClick={handleSave}
                        sx={{ borderRadius: 2 }}
                      >
                        Guardar
                      </Button>
                    </Box>
                  )}
                </Box>

                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Nombre"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      disabled={!isEditing}
                      InputProps={{
                        startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Apellido"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      disabled={!isEditing}
                      InputProps={{
                        startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Correo Electrónico"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={!isEditing}
                      InputProps={{
                        startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Teléfono"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={!isEditing}
                      InputProps={{
                        startAdornment: <Phone sx={{ mr: 1, color: 'text.secondary' }} />,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Nombre de Usuario"
                      value={user?.username || ''}
                      disabled
                      helperText="El nombre de usuario no se puede modificar"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Cambiar Contraseña */}
            <Card sx={{ mt: 3 }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Seguridad
                </Typography>
                <Divider sx={{ mb: 3 }} />
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Contraseña Actual"
                      type="password"
                      InputProps={{
                        startAdornment: <Lock sx={{ mr: 1, color: 'text.secondary' }} />,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Nueva Contraseña"
                      type="password"
                      InputProps={{
                        startAdornment: <Lock sx={{ mr: 1, color: 'text.secondary' }} />,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Confirmar Contraseña"
                      type="password"
                      InputProps={{
                        startAdornment: <Lock sx={{ mr: 1, color: 'text.secondary' }} />,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      color="secondary"
                      sx={{ borderRadius: 2 }}
                    >
                      Cambiar Contraseña
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </AdminLayout>
  );
}
