'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Typography,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Autocomplete,
  Divider,
  Alert,
} from '@mui/material';
import { Add, Close, Delete } from '@mui/icons-material';
import AdminLayout from '@/components/AdminLayout';
import api from '@/lib/axios';
import { isAxiosError } from 'axios';
import Grid from '@mui/material/GridLegacy';

interface ProductOption {
  id: number;
  name: string;
  price: number;
  stock: number;
  sku: string;
}

interface ProductApiRecord {
  id: number;
  name: string;
  price: number | string;
  stock: number | string;
  sku: string;
}

interface OrderFormData {
  customer: string;
  phone: string;
  email: string;
  address: string;
  paymentMethod: string;
  notes: string;
}

interface OrderErrorResponse {
  detail?: string;
  non_field_errors?: string[];
}

interface OrderItemRow {
  id: string;
  productId: number;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

const paymentOptions = [
  { value: 'cash', label: 'Efectivo' },
  { value: 'card', label: 'Tarjeta' },
  { value: 'transfer', label: 'Transferencia' },
  { value: 'nequi', label: 'Nequi' },
  { value: 'daviplata', label: 'Daviplata' },
];

const currency = (value: number) =>
  value.toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  });

export default function OrdenesPage() {
  const [openModal, setOpenModal] = useState(false);
  const [formData, setFormData] = useState<OrderFormData>({
    customer: '',
    phone: '',
    email: '',
    address: '',
    paymentMethod: 'cash',
    notes: '',
  });
  const [orderItems, setOrderItems] = useState<OrderItemRow[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductOption | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true);
        const response = await api.get<ProductApiRecord[]>('/products/');
        const mapped: ProductOption[] = response.data.map((product) => ({
          id: product.id,
          name: product.name,
          price: Number(product.price),
          stock: Number(product.stock),
          sku: product.sku,
        }));
        setProducts(mapped);
      } catch (err: unknown) {
        console.error('Error cargando productos', err);
        setError('No se pudieron cargar los productos.');
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, []);

  const handleOpen = () => {
    setOpenModal(true);
    setSuccess(null);
    setError(null);
  };

  const resetForm = () => {
    setFormData({
      customer: '',
      phone: '',
      email: '',
      address: '',
      paymentMethod: 'cash',
      notes: '',
    });
    setOrderItems([]);
    setSelectedProduct(null);
    setQuantity(1);
  };

  const handleClose = () => {
    setOpenModal(false);
    resetForm();
  };

  const handleAddItem = () => {
    if (!selectedProduct) return;
    const product = products.find((p) => p.id === selectedProduct.id);
    if (!product) return;

    if (quantity > product.stock) {
      setError(`Stock insuficiente para ${product.name}. Disponible: ${product.stock}.`);
      return;
    }

    const newItem: OrderItemRow = {
      id: `${product.id}-${Date.now()}`,
      productId: product.id,
      name: product.name,
      sku: product.sku,
      quantity,
      unitPrice: product.price,
      total: product.price * quantity,
    };

    setOrderItems((prev) => [...prev, newItem]);
    setSelectedProduct(null);
    setQuantity(1);
    setError(null);
  };

  const handleRemoveItem = (id: string) => {
    setOrderItems((prev) => prev.filter((item) => item.id !== id));
  };

  const orderTotal = useMemo(
    () => orderItems.reduce((sum, item) => sum + item.total, 0),
    [orderItems]
  );

  const handleSubmit = async () => {
    if (!formData.customer || !formData.phone || orderItems.length === 0) {
      setError('Completa los datos del cliente y agrega al menos un producto.');
      return;
    }

    const payload = {
      customer_name: formData.customer,
      customer_email: formData.email || null,
      customer_phone: formData.phone,
      customer_address: formData.address || null,
      payment_method: formData.paymentMethod,
      notes: formData.notes || null,
      items: orderItems.map((item) => ({
        product: item.productId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
      })),
    };

    try {
      setLoadingSubmit(true);
      await api.post('/orders/', payload);
      setSuccess('Orden registrada exitosamente.');
      setError(null);
      handleClose();
    } catch (err: unknown) {
      const message = isAxiosError<OrderErrorResponse>(err)
        ? err.response?.data?.detail ?? err.response?.data?.non_field_errors?.[0]
        : undefined;
      setError(message ?? 'No se pudo registrar la orden.');
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <AdminLayout>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Órdenes
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gestiona las órdenes y ventas de tu boutique
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleOpen}
          sx={{ borderRadius: 2, px: 3 }}
        >
          Nueva Orden
        </Button>
      </Box>

      {error && !openModal && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Modal de Nueva Orden */}
      <Dialog
        open={openModal}
        onClose={handleClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5" fontWeight={700}>
              Registrar Nueva Orden
            </Typography>
            <IconButton onClick={handleClose} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          <Grid container spacing={3}>
            {/* Información del Cliente */}
            <Grid item xs={12}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Información del Cliente
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nombre del Cliente"
                value={formData.customer}
                onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                required
                placeholder="Ej: María García"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Teléfono"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
                placeholder="+57 300 123 4567"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="correo@ejemplo.com"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Método de Pago</InputLabel>
                <Select
                  value={formData.paymentMethod}
                  label="Método de Pago"
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                >
                  {paymentOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Dirección de Entrega"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                multiline
                rows={2}
                placeholder="Dirección completa..."
              />
            </Grid>

            {/* Productos */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Productos
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Autocomplete
                value={selectedProduct}
                onChange={(event, newValue) => setSelectedProduct(newValue)}
                options={products}
                loading={loadingProducts}
                getOptionLabel={(option) => `${option.name} (${option.sku})`}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Buscar Producto"
                    placeholder="Selecciona un producto"
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Cantidad"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                inputProps={{ min: 1 }}
              />
            </Grid>

            <Grid item xs={12} sm={3}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleAddItem}
                disabled={!selectedProduct}
                sx={{ height: 56, borderRadius: 2 }}
              >
                Agregar
              </Button>
            </Grid>

            {/* Tabla de Productos */}
            {orderItems.length > 0 && (
              <Grid item xs={12}>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Producto</TableCell>
                        <TableCell align="center">Cantidad</TableCell>
                        <TableCell align="right">Precio Unit.</TableCell>
                        <TableCell align="right">Total</TableCell>
                        <TableCell align="center">Acción</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {orderItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                              <Typography fontWeight={600}>{item.name}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                SKU: {item.sku}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="center">{item.quantity}</TableCell>
                          <TableCell align="right">{currency(item.unitPrice)}</TableCell>
                          <TableCell align="right">{currency(item.total)}</TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleRemoveItem(item.id)}
                            >
                              <Delete />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={3} align="right">
                          <Typography variant="h6" fontWeight={600}>
                            Total:
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="h6" fontWeight={700} color="primary">
                            {currency(orderTotal)}
                          </Typography>
                        </TableCell>
                        <TableCell />
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            )}

            {/* Notas */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notas Adicionales"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                multiline
                rows={3}
                placeholder="Observaciones o detalles especiales..."
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button
            onClick={handleClose}
            variant="outlined"
            sx={{ borderRadius: 2, px: 3 }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={
              loadingSubmit ||
              !formData.customer ||
              !formData.phone ||
              orderItems.length === 0
            }
            sx={{ borderRadius: 2, px: 3 }}
          >
            {loadingSubmit ? 'Guardando...' : 'Registrar Orden'}
          </Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
}
