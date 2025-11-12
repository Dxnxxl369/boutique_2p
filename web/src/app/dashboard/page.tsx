'use client';

import { useEffect, useMemo, useState, type ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem, ListItemText
} from '@mui/material';
import {
  ShoppingBag,
  People,
  Inventory,
  Assessment,
  MicNone
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/AdminLayout';
import api from '@/lib/axios';

// Explicitly declare Web Speech API interfaces to resolve TypeScript errors
declare global {
  interface Window {
    webkitSpeechRecognition: any;
  }
  interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
  }
  interface SpeechRecognitionErrorEvent extends Event {
    readonly error: SpeechRecognitionErrorCode;
    readonly message: string;
  }
  interface SpeechRecognitionResultList {
    [index: number]: SpeechRecognitionResult;
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
  }
  interface SpeechRecognitionResult {
    [index: number]: SpeechRecognitionAlternative;
    readonly length: number;
    item(index: number): SpeechRecognitionAlternative;
    readonly isFinal: boolean;
  }
  interface SpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
  }
  type SpeechRecognitionErrorCode =
    | 'no-speech'
    | 'aborted'
    | 'audio-capture'
    | 'network'
    | 'not-allowed'
    | 'service-not-allowed'
    | 'bad-grammar'
    | 'language-not-supported';
}

interface DashboardStats {
  total_products: number;
  total_customers: number;
  today_sales: number;
  month_sales: number;
}

interface WeeklySalesRecord {
  day: string;
  total: number;
}

interface CategorySalesRecord {
  name: string;
  amount: number;
  color?: string; // Optional, as it's added dynamically
}

interface TopProductRecord {
  name: string;
  units: number;
  amount?: number; // Optional, as it's used in voice report but not always present in topProductsData
}

interface StatCard {
  title: string;
  value: string;
  icon: ReactNode;
  color: string;
}

const DASHBOARD_CATEGORY_COLORS = ['#FF6B9D', '#C44569', '#A55EEA', '#26C6DA', '#FFA726'];

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, isAdmin, logout } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [weeklySales, setWeeklySales] = useState<WeeklySalesRecord[]>([]);
  const [categorySales, setCategorySales] = useState<CategorySalesRecord[]>([]);
  const [topProducts, setTopProducts] = useState<TopProductRecord[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isListening, setIsListening] = useState(false);
  const [voiceCommandText, setVoiceCommandText] = useState('');
  const [voiceReportData, setVoiceReportData] = useState<any>(null);
  const [showVoiceReportDialog, setShowVoiceReportDialog] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!loading && user && isAdmin) {
      const fetchSummary = async () => {
        try {
          setLoadingSummary(true);
          const response = await api.get('/orders/dashboard-summary/');
          const data = response.data;
          setStats(data.stats);
          setWeeklySales(data.weekly_sales || []);
          setCategorySales(data.category_sales || []);
          setTopProducts(data.top_products || []);
          setError(null);
        } catch (error: unknown) {
          console.error('Error cargando resumen del dashboard', error);
          setError('No fue posible cargar el resumen del dashboard.');
        } finally {
          setLoadingSummary(false);
        }
      };

      fetchSummary();
    }
  }, [loading, user, isAdmin]);

  const formatCurrency = (value: number) =>
    value.toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    });

  const handleVoiceCommand = useCallback(() => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Tu navegador no soporta el reconocimiento de voz. Por favor, usa Chrome.');
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'es-ES'; // Set language to Spanish
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setVoiceCommandText('');
      setVoiceReportData(null);
      setShowVoiceReportDialog(false);
      console.log('Reconocimiento de voz iniciado...');
    };

    recognition.onresult = async (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setVoiceCommandText(transcript);
      console.log('Comando de voz detectado:', transcript);

      try {
        const response = await api.post('/orders/voice-command/', { command_text: transcript });
        setVoiceReportData(response.data);
        setShowVoiceReportDialog(true);
      } catch (error) {
        console.error('Error al enviar comando de voz al backend:', error);
        setVoiceReportData({ message: 'Error al procesar el comando de voz.' });
        setShowVoiceReportDialog(true);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      console.log('Reconocimiento de voz finalizado.');
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setIsListening(false);
      console.error('Error en el reconocimiento de voz:', event.error);
      setVoiceReportData({ message: `Error en el reconocimiento de voz: ${event.error}` });
      setShowVoiceReportDialog(true);
    };

    recognition.start();
  }, []);

  const statCards: StatCard[] = [
    {
      title: 'Productos',
      value: stats ? stats.total_products.toLocaleString('es-CO') : '0',
      icon: <Inventory sx={{ fontSize: 40 }} />,
      color: '#D81B60',
    },
    {
      title: 'Clientes',
      value: stats ? stats.total_customers.toLocaleString('es-CO') : '0',
      icon: <People sx={{ fontSize: 40 }} />,
      color: '#673AB7',
    },
    {
      title: 'Ventas del Día',
      value: stats ? formatCurrency(stats.today_sales) : formatCurrency(0),
      icon: <ShoppingBag sx={{ fontSize: 40 }} />,
      color: '#FF5722',
    },
    {
      title: 'Ventas del Mes',
      value: stats ? formatCurrency(stats.month_sales) : formatCurrency(0),
      icon: <Assessment sx={{ fontSize: 40 }} />,
      color: '#4CAF50',
    },
  ];

  const weeklyChartData = useMemo(
    () =>
      weeklySales.length > 0
        ? weeklySales.map((record) => ({ name: record.day, total: record.total }))
        : [{ name: 'Sin datos', total: 0 }],
    [weeklySales]
  );

  const pieCategoryData = useMemo(
    () =>
      categorySales.length > 0
        ? categorySales.map((record, index) => ({
            ...record,
            color: DASHBOARD_CATEGORY_COLORS[index % DASHBOARD_CATEGORY_COLORS.length],
          }))
        : [],
    [categorySales]
  );

  const topProductsData = useMemo(
    () =>
      topProducts.length > 0
        ? topProducts.map((record) => ({
            name: record.name,
            units: record.units,
          }))
        : [{ name: 'Sin datos', units: 0 }],
    [topProducts]
  );

  if (loading) {
    return null;
  }

  if (!user) {
    return null;
  }

  if (!isAdmin) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4">Acceso Denegado</Typography>
        <Typography>No tienes permiso para ver esta página.</Typography>
        <Button variant="contained" onClick={logout} sx={{ mt: 2 }}>
          Cerrar Sesión
        </Button>
      </Box>
    );
  }

  return (
    <AdminLayout>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Bienvenida {user.first_name || user.username}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Panel de control de tu boutique
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Tarjetas de Estadísticas */}
      <Box
        sx={{
          display: 'grid',
          gap: 3,
          mb: 3,
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(4, 1fr)',
          },
        }}
      >
        {statCards.map((stat, index) => (
          <Card
            key={index}
            sx={{
              height: '100%',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 6,
              },
            }}
          >
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    {stat.title}
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {stat.value}
                  </Typography>
                </Box>
                <Box sx={{ color: stat.color }}>{stat.icon}</Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Gráficos */}
      <Box
        sx={{
          display: 'grid',
          gap: 3,
          mb: 3,
          gridTemplateColumns: {
            xs: '1fr',
            lg: 'minmax(0, 2fr) minmax(0, 1fr)',
          },
        }}
      >
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Ventas de la Semana
            </Typography>
            {loadingSummary ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={32} />
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weeklyChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#D81B60"
                    strokeWidth={3}
                    name="Ventas"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Ventas por Categoría
            </Typography>
            {loadingSummary ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={32} />
              </Box>
            ) : pieCategoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieCategoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(data) => {
                      const percentValue =
                        typeof data.percent === 'number' ? data.percent : 0;
                      const nameValue = data.name ?? '';
                      return `${nameValue} ${(percentValue * 100).toFixed(0)}%`;
                    }}
                    outerRadius={90}
                    dataKey="amount"
                  >
                    {pieCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No hay datos disponibles.
              </Typography>
            )}
          </CardContent>
        </Card>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Productos Más Vendidos
          </Typography>
          {loadingSummary ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={32} />
            </Box>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProductsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="units" fill="#673AB7" name="Unidades Vendidas" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Acciones Rápidas */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            Acciones Rápidas
          </Typography>
          <Box
            sx={{
              mt: 1,
              display: 'grid',
              gap: 2,
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(4, 1fr)',
              },
            }}
          >
            <Button
              variant="outlined"
              fullWidth
              startIcon={<Inventory />}
              sx={{ py: 1.5, borderRadius: 2 }}
              onClick={() => router.push('/productos')}
            >
              Nuevo Producto
            </Button>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<ShoppingBag />}
              sx={{ py: 1.5, borderRadius: 2 }}
              onClick={() => router.push('/ordenes')}
            >
              Nueva Venta
            </Button>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<People />}
              sx={{ py: 1.5, borderRadius: 2 }}
              onClick={() => router.push('/usuarios')}
            >
              Ver Clientes
            </Button>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<Assessment />}
              sx={{ py: 1.5, borderRadius: 2 }}
              onClick={() => router.push('/reportes')}
            >
              Reportes
            </Button>
            <Button
              variant="contained" // Changed to contained for prominence
              fullWidth
              startIcon={<MicNone />}
              sx={{ py: 1.5, borderRadius: 2 }}
              onClick={handleVoiceCommand}
              disabled={isListening}
            >
              {isListening ? 'Escuchando...' : 'Comando de Voz'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Voice Report Dialog */}
      <Dialog open={showVoiceReportDialog} onClose={() => setShowVoiceReportDialog(false)}>
        <DialogTitle>Resultado del Comando de Voz</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle1" gutterBottom>
            Comando: {voiceCommandText}
          </Typography>
          {voiceReportData && voiceReportData.message && (
            <Typography color="error">{voiceReportData.message}</Typography>
          )}
          {voiceReportData && voiceReportData.report_type === 'top_products' && (
            <Box>
              <Typography variant="h6">Productos Más Vendidos</Typography>
              <List>
                {voiceReportData.data.map((item: any, index: number) => (
                  <ListItem key={index}>
                    <ListItemText primary={`${item.name} (${item.units} unidades)`} secondary={`Monto: ${formatCurrency(item.amount)}`} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
          {voiceReportData && voiceReportData.report_type === 'top_customers' && (
            <Box>
              <Typography variant="h6">Clientes Frecuentes</Typography>
              <List>
                {voiceReportData.data.map((item: any, index: number) => (
                  <ListItem key={index}>
                    <ListItemText primary={`${item.name} (${item.orders} órdenes)`} secondary={`Teléfono: ${item.phone}, Monto: ${formatCurrency(item.amount)}`} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
          {voiceReportData && voiceReportData.report_type === 'products_above_value' && (
            <Box>
              <Typography variant="h6">Productos con Valor Mayor a</Typography>
              <List>
                {voiceReportData.data.map((item: any, index: number) => (
                  <ListItem key={index}>
                    <ListItemText primary={`${item.name}`} secondary={`Precio: ${formatCurrency(item.price)}`} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
          {voiceReportData && voiceReportData.report_type === 'products_equal_value' && (
            <Box>
              <Typography variant="h6">Productos con Valor Igual a</Typography>
              <List>
                {voiceReportData.data.map((item: any, index: number) => (
                  <ListItem key={index}>
                    <ListItemText primary={`${item.name}`} secondary={`Precio: ${formatCurrency(item.price)}`} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
          {voiceReportData && voiceReportData.report_type === 'low_stock_products' && ( // Added this block
            <Box>
              <Typography variant="h6">Productos con Bajo Stock</Typography>
              <List>
                {voiceReportData.data.map((item: any, index: number) => (
                  <ListItem key={index}>
                    <ListItemText primary={`${item.name}`} secondary={`Stock: ${item.stock}`} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowVoiceReportDialog(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
}
