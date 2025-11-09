'use client';

import { useState, useEffect, type ChangeEvent } from 'react';
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
} from '@mui/material';
import { Add, Close, CloudUpload, Edit, Delete } from '@mui/icons-material';
import AdminLayout from '@/components/AdminLayout';
import type { SelectChangeEvent } from '@mui/material/Select';
import Grid from '@mui/material/GridLegacy';
import api from '@/lib/axios';

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
  status: string;
}

const currency = (value: number | string) =>
  Number(value).toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  });

export default function ProductosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState(false);
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
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await api.get<Product[]>('/products/');
        setProducts(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('No se pudieron cargar los productos.');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleOpen = () => setOpenModal(true);
  const handleClose = () => {
    setOpenModal(false);
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
    });
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
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    try {
      // Create a FormData object to handle file uploads
      const productData = new FormData();
      
      // Append all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value) { // only append if value is not empty
          if (key === 'stock') {
            productData.append(key, parseInt(value, 10).toString());
          } else if (key === 'price' || key === 'cost') {
            productData.append(key, parseFloat(value).toString());
          } else if (key === 'category') {
            productData.append(key, parseInt(value, 10).toString());
          } else {
            productData.append(key, value);
          }
        }
      });

      // Append the image file if it exists
      const imageInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (imageInput?.files?.[0]) {
        productData.append('image', imageInput.files[0]);
      }

      // The browser will automatically set the correct 'Content-Type' for FormData.
      await api.post('/products/', productData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Refetch products to show the new one
      const response = await api.get<Product[]>('/products/');
      setProducts(response.data);

      handleClose();
    } catch (err: any) {
      console.error('Error creating product:', err);
      console.log(err.response);
      setError('No se pudo crear el producto. Por favor, intente de nuevo.');
    }
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
          onClick={handleOpen}
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
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Imagen</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell>SKU</TableCell>
                <TableCell align="right">Precio</TableCell>
                <TableCell align="center">Stock</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <Box sx={{ position: 'relative', width: 40, height: 40, borderRadius: 1, overflow: 'hidden' }}>
                      {product.image ? (
                        <Image src="https://via.placeholder.com/40" alt={product.name} fill style={{ objectFit: 'cover' }} />
                      ) : (
                        <Box sx={{ bgcolor: 'grey.200', width: '100%', height: '100%' }} />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.sku}</TableCell>
                  <TableCell align="right">{currency(product.price)}</TableCell>
                  <TableCell align="center">{product.stock}</TableCell>
                  <TableCell>{product.status}</TableCell>
                  <TableCell align="center">
                    <IconButton size="small"><Edit fontSize="small" /></IconButton>
                    <IconButton size="small" color="error"><Delete fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Modal de Registro */}
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
              Registrar Nuevo Producto
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
                      onClick={() => setImagePreview(null)}
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
              <FormControl fullWidth>
                <InputLabel>Categoría</InputLabel>
                <Select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  label="Categoría"
                >
                  <MenuItem value="1">Vestidos</MenuItem>
                  <MenuItem value="2">Blusas</MenuItem>
                  <MenuItem value="3">Pantalones</MenuItem>
                  <MenuItem value="4">Faldas</MenuItem>
                  <MenuItem value="5">Accesorios</MenuItem>
                  <MenuItem value="6">Zapatos</MenuItem>
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

            {/* Marca */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Marca"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                placeholder="Ej: Zara, H&M"
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
            sx={{ borderRadius: 2, px: 3 }}
          >
            Registrar Producto
          </Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
}

