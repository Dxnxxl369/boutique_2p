'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Alert,
  FormControl,
  InputLabel,
  Select,
  Avatar,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import AdminLayout from '@/components/AdminLayout';
import api from '@/lib/axios';
import { isAxiosError } from 'axios';
import Grid from '@mui/material/GridLegacy';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  role_display: string;
  phone: string;
  hired_date: string | null;
  is_active: boolean;
  created_at: string;
}

interface UserFormData {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  role: string;
  phone: string;
  address: string;
  hired_date: string;
}

interface UserErrorResponse {
  username?: string[];
  email?: string[];
  detail?: string;
}

const roleColors: Record<string, 'primary' | 'secondary' | 'success' | 'warning' | 'info'> = {
  admin: 'primary',
  vendedor: 'success',
  bodeguero: 'warning',
  cajero: 'info',
  user: 'secondary',
};

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    role: 'vendedor',
    phone: '',
    address: '',
    hired_date: '',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/users/');
      setUsers(response.data);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      setError('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        password: '',
        role: user.role,
        phone: user.phone || '',
        address: '',
        hired_date: user.hired_date || '',
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        password: '',
        role: 'vendedor',
        phone: '',
        address: '',
        hired_date: '',
      });
    }
    setOpenModal(true);
    setError('');
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setEditingUser(null);
    setError('');
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const submitData: Partial<UserFormData> & { password?: string } = { ...formData };

      // No enviar password vacío en edición
      if (editingUser && submitData.password === '') {
        delete submitData.password;
      }

      if (editingUser) {
        await api.patch(`/auth/users/${editingUser.id}/`, submitData);
      } else {
        await api.post('/auth/users/', submitData);
      }

      await fetchUsers();
      handleCloseModal();
    } catch (error: unknown) {
      console.error('Error al guardar usuario:', error);
      const message = isAxiosError<UserErrorResponse>(error)
        ? error.response?.data?.username?.[0] ?? error.response?.data?.email?.[0] ?? error.response?.data?.detail
        : undefined;
      setError(message ?? 'Error al guardar usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      await api.post(`/auth/users/${user.id}/toggle_active/`);
      await fetchUsers();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
    }
  };

  const getRoleChip = (role: string, roleDisplay: string) => {
    return (
      <Chip
        label={roleDisplay}
        color={roleColors[role] || 'default'}
        size="small"
      />
    );
  };

  return (
    <AdminLayout>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Usuarios
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gestiona los usuarios y roles del sistema
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenModal()}
          sx={{ borderRadius: 2, px: 3 }}
        >
          Nuevo Usuario
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Usuario</TableCell>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Rol</TableCell>
                  <TableCell>Teléfono</TableCell>
                  <TableCell>Fecha Contratación</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading && users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      Cargando...
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      No hay usuarios registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 32, height: 32 }}>
                            {user.username.charAt(0).toUpperCase()}
                          </Avatar>
                          {user.username}
                        </Box>
                      </TableCell>
                      <TableCell>{`${user.first_name} ${user.last_name}`}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{getRoleChip(user.role, user.role_display)}</TableCell>
                      <TableCell>{user.phone || '-'}</TableCell>
                      <TableCell>
                        {user.hired_date
                          ? new Date(user.hired_date).toLocaleDateString('es-ES')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={user.is_active ? <ActiveIcon /> : <InactiveIcon />}
                          label={user.is_active ? 'Activo' : 'Inactivo'}
                          color={user.is_active ? 'success' : 'default'}
                          size="small"
                          onClick={() => handleToggleActive(user)}
                          sx={{ cursor: 'pointer' }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleOpenModal(user)}
                        >
                          <EditIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Modal de Registro/Edición */}
      <Dialog 
        open={openModal} 
        onClose={handleCloseModal} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5" fontWeight={700}>
              {editingUser ? 'Editar Usuario' : 'Registrar Nuevo Usuario'}
            </Typography>
            <IconButton onClick={handleCloseModal} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3 }}>
          <Grid container spacing={3}>
            {/* Usuario */}
            <Grid item xs={12}>
              <TextField
                label="Usuario"
                fullWidth
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                disabled={!!editingUser}
                required
                placeholder="Ej: jperez"
              />
            </Grid>

            {/* Nombre y Apellido */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Nombre"
                fullWidth
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                placeholder="Ej: Juan"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Apellido"
                fullWidth
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                placeholder="Ej: Pérez"
              />
            </Grid>

            {/* Email */}
            <Grid item xs={12}>
              <TextField
                label="Email"
                type="email"
                fullWidth
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                placeholder="correo@ejemplo.com"
              />
            </Grid>

            {/* Contraseña */}
            <Grid item xs={12}>
              <TextField
                label={editingUser ? 'Nueva Contraseña (dejar vacío para no cambiar)' : 'Contraseña'}
                type="password"
                fullWidth
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!editingUser}
                placeholder="Mínimo 8 caracteres"
              />
            </Grid>

            {/* Rol */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Rol</InputLabel>
                <Select
                  value={formData.role}
                  label="Rol"
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <MenuItem value="admin">Administrador</MenuItem>
                  <MenuItem value="vendedor">Vendedor</MenuItem>
                  <MenuItem value="bodeguero">Bodeguero</MenuItem>
                  <MenuItem value="cajero">Cajero</MenuItem>
                  <MenuItem value="user">Cliente</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Teléfono */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Teléfono"
                fullWidth
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Ej: +57 300 123 4567"
              />
            </Grid>

            {/* Fecha de Contratación */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Fecha de Contratación"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={formData.hired_date}
                onChange={(e) => setFormData({ ...formData, hired_date: e.target.value })}
              />
            </Grid>

            {/* Dirección */}
            <Grid item xs={12}>
              <TextField
                label="Dirección"
                fullWidth
                multiline
                rows={2}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Dirección completa..."
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button
            onClick={handleCloseModal}
            variant="outlined"
            sx={{ borderRadius: 2, px: 3 }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || !formData.username || !formData.email || (!editingUser && !formData.password)}
            sx={{ borderRadius: 2, px: 3 }}
          >
            {editingUser ? 'Actualizar Usuario' : 'Registrar Usuario'}
          </Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
}
