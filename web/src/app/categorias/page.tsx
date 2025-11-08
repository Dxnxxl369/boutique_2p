'use client';

import { useState } from 'react';
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
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Add, Close, Category as CategoryIcon } from '@mui/icons-material';
import type { SelectChangeEvent } from '@mui/material/Select';
import Grid from '@mui/material/GridLegacy';
import AdminLayout from '@/components/AdminLayout';

export default function CategoriasPage() {
  const [openModal, setOpenModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active',
  });

  const handleOpen = () => setOpenModal(true);
  const handleClose = () => {
    setOpenModal(false);
    setFormData({
      name: '',
      description: '',
      status: 'active',
    });
  };

  const handleChange = (
    event:
      | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      | SelectChangeEvent<string>
  ) => {
    const { name, value } = event.target as { name: string; value: string };
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = () => {
    // TODO: Implementar guardado con API
    console.log('Categoría:', formData);
    handleClose();
  };

  return (
    <AdminLayout>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Categorías
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Organiza tus productos por categorías y subcategorías
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleOpen}
          sx={{ borderRadius: 2, px: 3 }}
        >
          Nueva Categoría
        </Button>
      </Box>

      {/* Modal de Registro */}
      <Dialog
        open={openModal}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CategoryIcon color="primary" />
              <Typography variant="h5" fontWeight={700}>
                Nueva Categoría
              </Typography>
            </Box>
            <IconButton onClick={handleClose} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3 }}>
          <Grid container spacing={3}>
            {/* Nombre de la Categoría */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nombre de la Categoría"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Ej: Vestidos de Verano"
                autoFocus
              />
            </Grid>

            {/* Descripción */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descripción"
                name="description"
                value={formData.description}
                onChange={handleChange}
                multiline
                rows={3}
                placeholder="Describe esta categoría..."
              />
            </Grid>

            {/* Estado */}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  label="Estado"
                  required
                >
                  <MenuItem value="active">Activa</MenuItem>
                  <MenuItem value="inactive">Inactiva</MenuItem>
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
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            sx={{ borderRadius: 2, px: 3 }}
          >
            Crear Categoría
          </Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
}

