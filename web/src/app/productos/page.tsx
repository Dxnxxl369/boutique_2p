'use client';

import { useState, useEffect, useCallback, type ChangeEvent } from 'react';
import Image from 'next/image';
import {
  Typography,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Snackbar,
  DialogContentText,
} from '@mui/material';
import { Add, Close, CloudUpload, Edit, Delete } from '@mui/icons-material';
import AdminLayout from '@/components/AdminLayout';
import type { SelectChangeEvent } from '@mui/material/Select';
import Grid from '@mui/material/Grid';
import api from '@/lib/axios';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams } from 'next/navigation'; // Import useSearchParams

interface Product {
  id: number;
  name: string;
  description: string;
  sku: string;
  price: string;
  cost: string;
  category: number;
  category_name: string;
  stock: number;
  size: string;
  color: string;
  brand: string;
  image: string | null;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

interface Category {
  id: number;
  name: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000';

const currency = (value: number | string) =>
  Number(value).toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  });

export default function ProductosPage() {
  const { accessToken } = useAuth();
  const searchParams = useSearchParams(); // Initialize useSearchParams
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    cost: '',
    sku: '',
    category: '',
    stock: '',
    size: '',
    color: '',
    brand: '',
    status: 'active',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const lowStockParam = searchParams.get('low_stock'); // Read low_stock parameter
      const productApiUrl = lowStockParam === 'true' ? '/products/?low_stock=true' : '/products/';

      const [productsResponse, categoriesResponse] = await Promise.all([
        api.get<Product[]>(productApiUrl, { // Use productApiUrl
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        api.get<Category[]>('/categories/', {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      ]);
      setProducts(productsResponse.data);
      setCategories(categoriesResponse.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('No se pudieron cargar los datos iniciales.');
      setSnackbarMessage('Error al cargar los datos iniciales.');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  }, [accessToken, searchParams]); // Add searchParams to dependencies

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpen = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price,
        cost: product.cost || '',
        sku: product.sku,
        category: product.category ? String(product.category) : '',
        stock: String(product.stock),
        size: product.size,
        color: product.color,
        brand: product.brand,
        status: product.status,
      });
      setImagePreview(getImageUrl(product.image));
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        cost: '',
        sku: '',
        category: '',
        stock: '',
        size: '',
        color: '',
        brand: '',
        status: 'active',
      });
      setImagePreview(null);
    }
    setImageFile(null); // Clear file input on open
    setSnackbarOpen(false); // Close any open snackbar
    setOpenModal(true);
  };

  const handleClose = () => {
    setOpenModal(false);
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      cost: '',
      sku: '',
      category: '',
      stock: '',
      size: '',
      color: '',
      brand: '',
      status: 'active',
    });
    setImageFile(null);
    setImagePreview(null);
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!accessToken) return;
    setIsSubmitting(true);
    setSnackbarOpen(false);

    const productData = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value) {
        productData.append(key, value);
      }
    });

    if (imageFile) {
      productData.append('image', imageFile);
    } else if (editingProduct && !imagePreview) {
      // If editing and image was removed, send a signal to clear it on backend
      // This might require backend adjustment to handle 'null' or specific string for image clear
      // For now, we'll just not send the 'image' field if no new file and no preview
      // A more robust solution would be to send a specific flag or null value
    }

    try {
      if (editingProduct) {
        await api.patch(`/products/${editingProduct.id}/`, productData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${accessToken}`,
          },
        });
        setSnackbarMessage('Producto actualizado exitosamente.');
      } else {
        await api.post<Product>('/products/', productData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${accessToken}`,
          },
        });
        setSnackbarMessage('Producto creado exitosamente.');
      }

      setSnackbarOpen(true);
      fetchData();
      handleClose();
    } catch (err: any) {
      console.error('Error saving product:', err);
      const errorData = err.response?.data;
      let errorMessage = 'Ocurrió un error inesperado.';
      if (errorData) {
        errorMessage = Object.entries(errorData)
          .map(([key, value]) => `${key}: ${(value as string[]).join(', ')}`)
          .join('; ');
      }
      setSnackbarMessage(`Error: ${errorMessage}`);
      setSnackbarOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = (id: number) => {
    setProductToDelete(id);
    setConfirmDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!accessToken || productToDelete === null) return;
    try {
      await api.delete(`/products/${productToDelete}/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setSnackbarMessage('Producto eliminado exitosamente.');
      setSnackbarOpen(true);
      fetchData();
      setConfirmDeleteOpen(false);
      setProductToDelete(null);
    } catch (err) {
      console.error('Error deleting product:', err);
      setSnackbarMessage('Error al eliminar el producto.');
      setSnackbarOpen(true);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const getImageUrl = (imagePath: string | null): string => {
    if (!imagePath) {
      return '/window.svg'; // Default placeholder
    }

    // Specific fix for malformed URLs like "/https:/..." or "/http%3A..."
    if (imagePath.startsWith('/http')) {
      const urlPart = imagePath.substring(1); // Remove the leading '/'
      try {
        return decodeURIComponent(urlPart);
      } catch (e) {
        console.error('Failed to decode image URL:', imagePath);
        return '/window.svg';
      }
    }

    // Handle regular absolute URLs
    if (imagePath.startsWith('http')) {
      return imagePath;
    }

    // Handle relative paths
    return `${API_BASE_URL}${imagePath}`;
  };

  return (
    <AdminLayout>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Productos
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gestiona el inventario de productos de tu boutique
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpen()}
          sx={{ borderRadius: 2, px: 3 }}
        >
          Nuevo Producto
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Table>
            <TableHead sx={{ backgroundColor: (theme) => theme.palette.grey[100] }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Imagen</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Nombre</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>SKU</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Precio</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="center">Stock</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Categoría</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No hay productos disponibles.
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <Box sx={{ position: 'relative', width: 40, height: 40, borderRadius: 1, overflow: 'hidden' }}>
                        <Image src={getImageUrl(product.image)} alt={product.name} fill style={{ objectFit: 'cover' }} />
                      </Box>
                    </TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.sku}</TableCell>
                    <TableCell align="right">{currency(product.price)}</TableCell>
                    <TableCell align="center">{product.stock}</TableCell>
                    <TableCell>{product.category_name}</TableCell>
                    <TableCell>{product.status === 'active' ? 'Activo' : 'Inactivo'}</TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpen(product)}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteConfirm(product.id)}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Modal de Creación/Edición */}
      <Dialog
        open={openModal}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5" fontWeight={700}>
              {editingProduct ? 'Editar Producto' : 'Registrar Nuevo Producto'}
            </Typography>
            <IconButton onClick={handleClose} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3 }}>
          <Grid container spacing={3}>
            {/* Imagen del Producto */}
            <Grid item xs={12}>
              <Box
                sx={{
                  border: '2px dashed',
                  borderColor: 'divider',
                  borderRadius: 2,
                  p: 3,
                  textAlign: 'center',
                  bgcolor: 'background.default',
                  position: 'relative',
                  minHeight: 200,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {imagePreview ? (
                  <Box
                    sx={{
                      position: 'relative',
                      width: '100%',
                      maxWidth: 320,
                      height: 200,
                    }}
                  >
                    <Image
                      src={imagePreview}
                      alt="Vista previa del producto"
                      fill
                      sizes="(max-width: 600px) 100vw, 320px"
                      style={{ objectFit: 'contain' }}
                    />
                    <IconButton
                      onClick={() => {
                        setImagePreview(null);
                        setImageFile(null);
                      }}
                      sx={{
                        position: 'absolute',
                        top: -10,
                        right: -10,
                        bgcolor: 'background.paper',
                        boxShadow: 1,
                      }}
                      size="small"
                    >
                      <Close fontSize="small" />
                    </IconButton>
                  </Box>
                ) : (
                  <>
                    <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                    <Typography variant="body1" gutterBottom>
                      Arrastra una imagen o haz clic para seleccionar
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      PNG, JPG hasta 5MB
                    </Typography>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        opacity: 0,
                        cursor: 'pointer',
                      }}
                    />
                  </>
                )}
              </Box>
            </Grid>

            {/* Información Básica */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nombre del Producto"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Ej: Vestido Floral de Verano"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descripción"
                name="description"
                value={formData.description}
                onChange={handleChange}
                multiline
                rows={3}
                placeholder="Describe el producto..."
              />
            </Grid>

            {/* Precios */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Precio de Venta"
                name="price"
                value={formData.price}
                onChange={handleChange}
                type="number"
                required
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Costo"
                name="cost"
                value={formData.cost}
                onChange={handleChange}
                type="number"
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>

            {/* SKU y Categoría */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="SKU"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                placeholder="Ej: VEST-001"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Categoría</InputLabel>
                <Select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  label="Categoría"
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Inventario y Detalles */}
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Stock Inicial"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                type="number"
                required
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Talla</InputLabel>
                <Select
                  name="size"
                  value={formData.size}
                  onChange={handleChange}
                  label="Talla"
                >
                  <MenuItem value="">Ninguna</MenuItem>
                  <MenuItem value="XS">XS</MenuItem>
                  <MenuItem value="S">S</MenuItem>
                  <MenuItem value="M">M</MenuItem>
                  <MenuItem value="L">L</MenuItem>
                  <MenuItem value="XL">XL</MenuItem>
                  <MenuItem value="XXL">XXL</MenuItem>
                  <MenuItem value="Única">Única</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Color"
                name="color"
                value={formData.color}
                onChange={handleChange}
                placeholder="Ej: Rosa, Azul"
              />
            </Grid>

            {/* Marca y Estado */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Marca"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                placeholder="Ej: Zara, H&M"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  label="Estado"
                  required
                >
                  <MenuItem value="active">Activo</MenuItem>
                  <MenuItem value="inactive">Inactivo</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button
            onClick={handleClose}
            variant="outlined"
            sx={{ borderRadius: 2, px: 3 }}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            sx={{ borderRadius: 2, px: 3 }}
            disabled={isSubmitting}
          >
            {isSubmitting ? <CircularProgress size={24} color="inherit" /> : (editingProduct ? 'Guardar Cambios' : 'Registrar Producto')}
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

      {/* Diálogo de Confirmación de Eliminación */}
      <Dialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"Confirmar Eliminación"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            ¿Estás seguro de que quieres eliminar este producto? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteOpen(false)}>Cancelar</Button>
          <Button onClick={handleDelete} color="error" autoFocus>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
}


