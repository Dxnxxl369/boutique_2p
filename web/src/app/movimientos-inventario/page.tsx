'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Typography,
  Box,
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Alert,
  Snackbar,
  IconButton,
  Chip,
} from '@mui/material';
import { Close, TrendingUp, TrendingDown, Inventory as InventoryIcon } from '@mui/icons-material';
import AdminLayout from '@/components/AdminLayout';
import api from '@/lib/axios';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams } from 'next/navigation';

interface Product {
  id: number;
  name: string;
  sku: string;
}

interface InventoryMovement {
  id: number;
  product: number;
  product_name: string;
  movement_type: 'entrada' | 'salida' | 'ajuste';
  quantity: number;
  reason: string;
  notes: string;
  created_by: number;
  created_by_name: string;
  stock_before: number;
  stock_after: number;
  created_at: string;
}

const MOVEMENT_TYPE_LABELS = {
  entrada: 'Entrada',
  salida: 'Salida',
  ajuste: 'Ajuste',
};

const REASON_LABELS: { [key: string]: string } = {
  compra: 'Compra a Proveedor',
  devolucion: 'Devolución de Cliente',
  produccion: 'Producción Interna',
  venta: 'Venta',
  merma: 'Merma o Daño',
  obsequio: 'Obsequio/Promoción',
  devolucion_proveedor: 'Devolución a Proveedor',
  inventario_fisico: 'Inventario Físico',
  correccion: 'Corrección de Error',
  otro: 'Otro',
};

export default function InventoryMovementsPage() {
  const { accessToken } = useAuth();
  const searchParams = useSearchParams();
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const fetchMovements = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const movementType = searchParams.get('movement_type');
      let apiUrl = '/inventory-movements/';
      if (movementType) {
        apiUrl += `?movement_type=${movementType}`;
      }

      const response = await api.get<InventoryMovement[]>(apiUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      setMovements(response.data);
    } catch (err) {
      console.error('Error fetching inventory movements:', err);
      setError('Error al cargar los movimientos de inventario.');
      setSnackbarMessage('Error al cargar los movimientos de inventario.');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  }, [accessToken, searchParams]);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const getMovementIcon = (type: 'entrada' | 'salida' | 'ajuste') => {
    switch (type) {
      case 'entrada':
        return <TrendingUp color="success" />;
      case 'salida':
        return <TrendingDown color="error" />;
      case 'ajuste':
        return <InventoryIcon color="primary" />;
      default:
        return null;
    }
  };

  const getMovementChipColor = (type: 'entrada' | 'salida' | 'ajuste') => {
    switch (type) {
      case 'entrada':
        return 'success';
      case 'salida':
        return 'error';
      case 'ajuste':
        return 'primary';
      default:
        return 'default';
    }
  };

  return (
    <AdminLayout>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Movimientos de Inventario
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Historial de entradas, salidas y ajustes de productos
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Table>
            <TableHead sx={{ backgroundColor: (theme) => theme.palette.grey[100] }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Producto</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Tipo</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Cantidad</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Motivo</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Stock Antes</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Stock Después</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Realizado Por</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Fecha</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {movements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    No hay movimientos de inventario disponibles.
                  </TableCell>
                </TableRow>
              ) : (
                movements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell>{movement.id}</TableCell>
                    <TableCell>{movement.product_name}</TableCell>
                    <TableCell>
                      <Chip
                        icon={getMovementIcon(movement.movement_type)}
                        label={MOVEMENT_TYPE_LABELS[movement.movement_type]}
                        color={getMovementChipColor(movement.movement_type)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{movement.quantity}</TableCell>
                    <TableCell>{REASON_LABELS[movement.reason] || movement.reason}</TableCell>
                    <TableCell>{movement.stock_before}</TableCell>
                    <TableCell>{movement.stock_after}</TableCell>
                    <TableCell>{movement.created_by_name}</TableCell>
                    <TableCell>{new Date(movement.created_at).toLocaleString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

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
