'use client';

import { useState, useEffect, useCallback, type ChangeEvent } from 'react';
import {
  Typography,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  FormControl,
  Select,
  MenuItem,
  Alert,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Snackbar,
} from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  Add,
  Close,
  Inventory as InventoryIcon,
  TrendingUp,
  TrendingDown,
  Warning,
} from '@mui/icons-material';
import AdminLayout from '@/components/AdminLayout';
import api from '@/lib/axios';
import type { SelectChangeEvent } from '@mui/material/Select';
import { isAxiosError } from 'axios';
import Grid from '@mui/material/Grid';

interface Product {
  id: number;
  name: string;
  sku: string;
  stock: number;
  size: string;
  price: string;
}

interface MovementFormData {
  product: string;
  movementType: 'entrada' | 'salida' | 'ajuste';
  quantity: string;
  reason: string;
  notes: string;
}

export default function InventarioPage() {
  const { accessToken } = useAuth();
  const router = useRouter(); // Initialize useRouter
  const [openModal, setOpenModal] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true); // Separate loading for products list
  const [loadingMovement, setLoadingMovement] = useState(false); // Loading for movement submission
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<MovementFormData>({
    product: '',
    movementType: 'entrada',
    quantity: '',
    reason: '',
    notes: '',
  });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const loadProducts = useCallback(async () => {
    if (!accessToken) return;
    setLoadingProducts(true);
    setError(null);
    try {
      const response = await api.get<Product[]>('/products/', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      setProducts(response.data);
    } catch (err) {
      console.error('Error loading products:', err);
      setError('Error al cargar los productos.');
      setSnackbarMessage('Error al cargar los productos.');
      setSnackbarOpen(true);
    } finally {
      setLoadingProducts(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleOpen = () => setOpenModal(true);
  const handleClose = () => {
    setOpenModal(false);
    setFormData({
      product: '',
      movementType: 'entrada',
      quantity: '',
      reason: '',
      notes: '',
    });
  };

  const handleChange = (
    event:
      | ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      | SelectChangeEvent<string>
  ) => {
    const { name, value } = event.target as { name: string; value: string };
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!accessToken) return;
    try {
      setLoadingMovement(true);
      await api.post('/inventory-movements/', {
        product: Number.parseInt(formData.product, 10),
        movement_type: formData.movementType,
        quantity: Number.parseInt(formData.quantity, 10),
        reason: formData.reason,
        notes: formData.notes,
      }, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      
      setSnackbarMessage('Movimiento registrado exitosamente.');
      setSnackbarOpen(true);
      await loadProducts(); // Recargar productos para actualizar el stock
      handleClose();
      
    } catch (error: unknown) {
      console.error('Error al registrar movimiento:', error);
      const message = isAxiosError(error)
        ? (error.response?.data as { message?: string })?.message ?? 'Error al registrar el movimiento'
        : 'Error al registrar el movimiento';
      setSnackbarMessage(message);
      setSnackbarOpen(true);
    } finally {
      setLoadingMovement(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const totalProducts = products.length;
  const lowStockProducts = products.filter(product => product.stock < 10).length;

  return (
    <AdminLayout>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Inventario
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Controla y gestiona el stock de tus productos
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleOpen}
          sx={{ borderRadius: 2, px: 3 }}
        >
          Registrar Movimiento
        </Button>
      </Box>

      {/* Resumen de Inventario */}
      <Box
        sx={{
          display: 'grid',
          gap: 3,
          mb: 4,
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(4, 1fr)',
          },
        }}
      >
        <Card sx={{ cursor: 'pointer' }} onClick={() => router.push('/productos')}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 2,
                  bgcolor: 'primary.lighter',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <InventoryIcon color="primary" />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight={700}>
                  {loadingProducts ? <CircularProgress size={24} /> : totalProducts}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Productos
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ cursor: 'pointer' }} onClick={() => router.push('/movimientos-inventario?movement_type=entrada')}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 2,
                  bgcolor: 'success.lighter',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <TrendingUp sx={{ color: 'success.main' }} />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight={700}>
                  0
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Entradas
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ cursor: 'pointer' }} onClick={() => router.push('/movimientos-inventario?movement_type=salida')}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 2,
                  bgcolor: 'error.lighter',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <TrendingDown sx={{ color: 'error.main' }} />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight={700}>
                  0
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Salidas
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ cursor: 'pointer' }} onClick={() => router.push('/productos?low_stock=true')}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 2,
                  bgcolor: 'warning.lighter',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Warning sx={{ color: 'warning.main' }} />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight={700}>
                  {loadingProducts ? <CircularProgress size={24} /> : lowStockProducts}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Stock Bajo
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Modal de Registro de Movimiento */}
      <Dialog
        open={openModal}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { 
            borderRadius: 3,
          }
        }}
      >
        <DialogTitle sx={{ pb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  bgcolor: 'primary.lighter',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <InventoryIcon color="primary" sx={{ fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight={700}>
                  Registrar Movimiento
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Gestiona las entradas y salidas de tu inventario
                </Typography>
              </Box>
            </Box>
            <IconButton 
              onClick={handleClose} 
              size="small"
              sx={{
                bgcolor: 'action.hover',
                '&:hover': {
                  bgcolor: 'action.selected',
                }
              }}
            >
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 4 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 3 }}>
            {/* Tipo de Movimiento */}
            // @ts-ignore
            <Box sx={{ gridColumn: 'span 12' }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ mb: 1 }}>
                Tipo de Movimiento *
              </Typography>
              <FormControl fullWidth required>
                <Select
                  name="movementType"
                  value={formData.movementType}
                  onChange={handleChange}
                  displayEmpty
                  sx={{
                    '& .MuiSelect-select': {
                      py: 1.5,
                    }
                  }}
                >
                  <MenuItem value="entrada">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: 1.5,
                          bgcolor: 'success.lighter',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <TrendingUp sx={{ color: 'success.main', fontSize: 20 }} />
                      </Box>
                      <Box>
                        <Typography variant="body1" fontWeight={600}>Entrada</Typography>
                        <Typography variant="caption" color="text.secondary">Agregar stock al inventario</Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                  <MenuItem value="salida">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: 1.5,
                          bgcolor: 'error.lighter',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <TrendingDown sx={{ color: 'error.main', fontSize: 20 }} />
                      </Box>
                      <Box>
                        <Typography variant="body1" fontWeight={600}>Salida</Typography>
                        <Typography variant="caption" color="text.secondary">Reducir stock del inventario</Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                  <MenuItem value="ajuste">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: 1.5,
                          bgcolor: 'primary.lighter',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <InventoryIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                      </Box>
                      <Box>
                        <Typography variant="body1" fontWeight={600}>Ajuste</Typography>
                        <Typography variant="caption" color="text.secondary">Corrección de inventario</Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Producto */}
            <Box sx={{ gridColumn: 'span 12' }}>

            {/* Cantidad y Motivo */}
            <Grid item xs={12} sm={5}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ mb: 1 }}>
                Cantidad *
              </Typography>
              <TextField
                fullWidth
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                type="number"
                required
                placeholder="0"
                inputProps={{ min: 1 }}
                sx={{
                  '& .MuiInputBase-input': {
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} sm={7}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ mb: 1 }}>
                Motivo *
              </Typography>
              <FormControl fullWidth required>
                <Select
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  displayEmpty
                  sx={{
                    '& .MuiSelect-select': {
                      py: 1.5,
                    }
                  }}
                >
                  {formData.movementType === 'entrada' ? [
                    <MenuItem key="placeholder" value="" disabled>
                      <Typography color="text.secondary">Selecciona un motivo</Typography>
                    </MenuItem>,
                    <MenuItem key="compra" value="compra">Compra a Proveedor</MenuItem>,
                    <MenuItem key="devolucion" value="devolucion">Devolución de Cliente</MenuItem>,
                    <MenuItem key="produccion" value="produccion">Producción Interna</MenuItem>,
                    <MenuItem key="otro" value="otro">Otro</MenuItem>
                  ] : formData.movementType === 'salida' ? [
                    <MenuItem key="placeholder" value="" disabled>
                      <Typography color="text.secondary">Selecciona un motivo</Typography>
                    </MenuItem>,
                    <MenuItem key="venta" value="venta">Venta</MenuItem>,
                    <MenuItem key="merma" value="merma">Merma o Daño</MenuItem>,
                    <MenuItem key="obsequio" value="obsequio">Obsequio/Promoción</MenuItem>,
                    <MenuItem key="devolucion_proveedor" value="devolucion_proveedor">Devolución a Proveedor</MenuItem>,
                    <MenuItem key="otro" value="otro">Otro</MenuItem>
                  ] : [
                    <MenuItem key="placeholder" value="" disabled>
                      <Typography color="text.secondary">Selecciona un motivo</Typography>
                    </MenuItem>,
                    <MenuItem key="inventario_fisico" value="inventario_fisico">Inventario Físico</MenuItem>,
                    <MenuItem key="correccion" value="correccion">Corrección de Error</MenuItem>,
                    <MenuItem key="otro" value="otro">Otro</MenuItem>
                  ]}
                </Select>
              </FormControl>
            </Grid>

            {/* Notas */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ mb: 1 }}>
                Notas <Typography component="span" variant="caption" color="text.secondary">(Opcional)</Typography>
              </Typography>
              <TextField
                fullWidth
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                multiline
                rows={3}
                placeholder="Ej: Factura #12345, Proveedor ABC, Observaciones..."
              />
            </Grid>

            {/* Alerta informativa */}
            <Grid item xs={12}>
              <Alert 
                severity={formData.movementType === 'entrada' ? 'success' : formData.movementType === 'salida' ? 'warning' : 'info'}
                icon={formData.movementType === 'entrada' ? <TrendingUp /> : formData.movementType === 'salida' ? <TrendingDown /> : <InventoryIcon />}
                sx={{ borderRadius: 2 }}
              >
                <Typography variant="body2" fontWeight={600}>
                  {formData.movementType === 'entrada' 
                    ? '✓ Entrada de Stock'
                    : formData.movementType === 'salida'
                    ? '⚠ Salida de Stock'
                    : 'ℹ Ajuste de Stock'}
                </Typography>
                <Typography variant="caption">
                  {formData.movementType === 'entrada' 
                    ? 'Se aumentará el inventario del producto seleccionado.'
                    : formData.movementType === 'salida'
                    ? 'Se reducirá el inventario del producto seleccionado.'
                    : 'Se ajustará el inventario del producto seleccionado.'}
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 4, py: 3, bgcolor: 'background.default', gap: 2 }}>
          <Button
            onClick={handleClose}
            variant="outlined"
            size="large"
            disabled={loadingMovement}
            sx={{ 
              borderRadius: 2, 
              px: 4,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            size="large"
            disabled={loadingMovement || !formData.product || !formData.quantity || !formData.reason}
            sx={{ 
              borderRadius: 2, 
              px: 4,
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: 3,
            }}
          >
            {loadingMovement ? 'Registrando...' : 'Registrar Movimiento'}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Snackbar para mensajes de éxito/error */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        message={snackbarMessage}
        action={
          <IconButton size="small" aria-label="close" color="inherit" onClick={handleSnackbarClose}>
            <Close fontSize="small" />
          </IconButton>
        }
      />
    </AdminLayout>
  );
}

