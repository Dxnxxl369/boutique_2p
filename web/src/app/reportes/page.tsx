'use client';

import { useEffect, useMemo, useState, useCallback, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  Typography,
  Box,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Button,
  TextField, // Added TextField import
  Chip, // Added Chip import
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper // Added table imports
} from '@mui/material';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { MicNone, Search } from '@mui/icons-material'; // Added MicNone and Search icons
import AdminLayout from '@/components/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/axios';
import { isAxiosError } from 'axios';

interface MonthlySalesRecord {
  month: string;
  sales: number;
  costs: number;
  profits: number;
}

interface CategorySalesRecord {
  category: string;
  amount: number;
  units: number;
}

interface PaymentMethodRecord {
  method: string;
  count: number;
  amount: number;
}

interface TopCustomerRecord {
  name: string | null;
  phone: string | null;
  orders: number;
  amount: number;
}

interface InventoryStatusRecord {
  product: string;
  stock: number;
  status: 'ok' | 'low';
}

const PAYMENT_METHOD_COLORS = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#26C6DA'];
const CATEGORY_COLORS = ['#FF6B9D', '#C44569', '#A55EEA', '#26C6DA', '#FFA726'];
const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
  nequi: 'Nequi',
  daviplata: 'Daviplata',
  unknown: 'Otro',
};

type NumericLike = number | string | null | undefined;

interface MonthlySalesApiRecord {
  month: string | null;
  sales: NumericLike;
  costs: NumericLike;
  profits: NumericLike;
}

interface CategorySalesApiRecord {
  category: string | null;
  amount: NumericLike;
  units: NumericLike;
}

interface PaymentMethodApiRecord {
  method: string | null;
  count: NumericLike;
  amount: NumericLike;
}

interface TopCustomerApiRecord {
  name: string | null;
  phone: string | null;
  orders: NumericLike;
  amount: NumericLike;
}

interface InventoryStatusApiRecord {
  product: string | null;
  stock: NumericLike;
  status: string | null;
}

interface ReportsSummaryResponse {
  monthly_sales?: MonthlySalesApiRecord[];
  category_sales?: CategorySalesApiRecord[];
  payment_methods?: PaymentMethodApiRecord[];
  top_customers?: TopCustomerApiRecord[];
  inventory_status?: InventoryStatusApiRecord[];
}

interface ReportsErrorResponse {
  detail?: string;
  message?: string;
}

export default function ReportesPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAdmin } = useAuth();

  const [period, setPeriod] = useState('month');
  const [tabValue, setTabValue] = useState(0);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New state variables for "Por Búsqueda" tab
  const [searchText, setSearchText] = useState('');
  const [isListeningVoiceCommand, setIsListeningVoiceCommand] = useState(false);
  const [voiceCommandText, setVoiceCommandText] = useState('');
  const [searchReportData, setSearchReportData] = useState<any>(null);
  const [pills, setPills] = useState<string[]>([]);
  const [addPillText, setAddPillText] = useState('');
  const [loadingSearch, setLoadingSearch] = useState(false);


  const [monthlySales, setMonthlySales] = useState<MonthlySalesRecord[]>([]);
  const [categorySales, setCategorySales] = useState<CategorySalesRecord[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodRecord[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomerRecord[]>([]);
  const [inventoryStatus, setInventoryStatus] = useState<InventoryStatusRecord[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (!authLoading && user && !isAdmin) {
      router.push('/login');
    }
  }, [authLoading, user, isAdmin, router]);

  useEffect(() => {
    if (!authLoading && user && isAdmin && tabValue !== 4) { // Only fetch summary if not in "Por Búsqueda" tab
      const fetchSummary = async () => {
        try {
          setLoadingSummary(true);
          const response = await api.get<ReportsSummaryResponse>('/orders/reports-summary/');
          const data = response.data ?? {};
          const toNumber = (value: NumericLike): number => {
            if (typeof value === 'number') return value;
            if (typeof value === 'string') {
              const parsed = Number(value);
              return Number.isNaN(parsed) ? 0 : parsed;
            }
            return 0;
          };

          setMonthlySales(
            Array.isArray(data.monthly_sales)
              ? data.monthly_sales.map((record) => ({
                  month: record.month ?? '',
                  sales: toNumber(record.sales),
                  costs: toNumber(record.costs),
                  profits: toNumber(record.profits),
                }))
              : []
          );

          setCategorySales(
            Array.isArray(data.category_sales)
              ? data.category_sales.map((record) => ({
                  category: record.category ?? 'Sin categoría',
                  amount: toNumber(record.amount),
                  units: toNumber(record.units),
                }))
              : []
          );

          setPaymentMethods(
            Array.isArray(data.payment_methods)
              ? data.payment_methods.map((record) => ({
                  method: record.method ?? 'unknown',
                  count: toNumber(record.count),
                  amount: toNumber(record.amount),
                }))
              : []
          );

          setTopCustomers(
            Array.isArray(data.top_customers)
              ? data.top_customers.map((record) => ({
                  name: record.name ?? 'Sin nombre',
                  phone: record.phone ?? null,
                  orders: toNumber(record.orders),
                  amount: toNumber(record.amount),
                }))
              : []
          );

          setInventoryStatus(
            Array.isArray(data.inventory_status)
              ? data.inventory_status.map((record) => ({
                  product: record.product ?? 'Sin nombre',
                  stock: toNumber(record.stock),
                  status: record.status === 'low' ? 'low' : 'ok',
                }))
              : []
          );

          setError(null);
        } catch (err: unknown) {
          console.error('Error cargando reportes', err);
          const message = isAxiosError<ReportsErrorResponse>(err)
            ? err.response?.data?.detail ?? err.response?.data?.message
            : undefined;
          setError(message ?? 'No fue posible cargar los reportes.');
        } finally {
          setLoadingSummary(false);
        }
      };

      fetchSummary();
    }
  }, [authLoading, user, isAdmin, tabValue]); // Added tabValue to dependencies

  const formatCurrency = (value: number) =>
    value.toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    });

  const categoryBarData = useMemo(
    () =>
      categorySales.map((record) => ({
        name: record.category,
        amount: record.amount,
      })),
    [categorySales]
  );

  const categoryUnitsPieData = useMemo(
    () =>
      categorySales.map((record, index) => ({
        name: record.category,
        value: record.units,
        color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
      })),
    [categorySales]
  );

  const paymentMethodsData = useMemo(
    () =>
      paymentMethods.map((method, index) => ({
        label: PAYMENT_METHOD_LABELS[method.method] ?? method.method,
        value: method.amount,
        count: method.count,
        color: PAYMENT_METHOD_COLORS[index % PAYMENT_METHOD_COLORS.length],
      })),
    [paymentMethods]
  );

  const topCustomersData = useMemo(
    () =>
      topCustomers.map((customer) => ({
        name: customer.name || 'Sin nombre',
        amount: customer.amount,
        orders: customer.orders,
      })),
    [topCustomers]
  );

  const inventoryChartData = useMemo(
    () => inventoryStatus.slice(0, 10),
    [inventoryStatus]
  );

  const handleVoiceCommand = useCallback(() => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Tu navegador no soporta el reconocimiento de voz. Por favor, usa Chrome.');
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'es-ES';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListeningVoiceCommand(true);
      setVoiceCommandText('');
      setSearchReportData(null);
      setPills([]); // Clear pills when using voice command
      console.log('Reconocimiento de voz iniciado...');
    };

    recognition.onresult = async (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setVoiceCommandText(transcript);
      console.log('Comando de voz detectado (transcripción):', transcript); // Added logging

      try {
        setLoadingSearch(true);
        const response = await api.post('/orders/voice-command/', { command_text: transcript });
        setSearchReportData(response.data);
      } catch (error) {
        console.error('Error al enviar comando de voz al backend:', error);
        setSearchReportData({ message: 'Error al procesar el comando de voz.' });
      } finally {
        setLoadingSearch(false);
      }
    };

    recognition.onend = () => {
      setIsListeningVoiceCommand(false);
      console.log('Reconocimiento de voz finalizado.');
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setIsListeningVoiceCommand(false);
      console.error('Error en el reconocimiento de voz:', event.error);
      setSearchReportData({ message: `Error en el reconocimiento de voz: ${event.error}` });
    };

    recognition.start();
  }, []);

  const handleSearchSubmit = async (command: string) => {
    if (!command.trim()) return;
    setPills([]); // Clear pills when using text command
    try {
      setLoadingSearch(true);
      const response = await api.post('/orders/voice-command/', { command_text: command });
      setSearchReportData(response.data);
    } catch (error) {
      console.error('Error al enviar comando de texto al backend:', error);
      setSearchReportData({ message: 'Error al procesar el comando de texto.' });
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleAddPill = () => {
    if (addPillText.trim()) {
      const parts = addPillText.trim().split(':');
      if (parts.length === 3) {
        const [field, operator, value] = parts;
        const newPill = { field, operator, value };
        const updatedPills = [...pills, newPill];
        setPills(updatedPills);
        setAddPillText('');
        handleSearchSubmitWithPills(updatedPills);
      } else {
        setError('Formato de píldora inválido. Use "campo:operador:valor" (ej. "name:contains:camisa", "price:gt:50").');
      }
    }
  };

  const handleRemovePill = (pillToRemove: any) => { // pillToRemove will be an object now
    const updatedPills = pills.filter(pill => pill !== pillToRemove);
    setPills(updatedPills);
    handleSearchSubmitWithPills(updatedPills);
  };

  const handleSearchSubmitWithPills = async (currentPills: any[]) => { // currentPills is now an array of objects
    if (currentPills.length === 0) {
      setSearchReportData(null);
      return;
    }
    try {
      setLoadingSearch(true);
      const response = await api.post('/orders/voice-command/', { pills: currentPills }); // Send structured pills
      setSearchReportData(response.data);
    } catch (error) {
      console.error('Error al enviar pills al backend:', error);
      setSearchReportData({ message: 'Error al procesar pills.' });
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleClearSearch = () => {
    setSearchText('');
    setVoiceCommandText('');
    setPills([]);
    setSearchReportData(null);
    setError(null); // Clear any search-related errors
  };

  const handleExport = async (format: 'excel' | 'pdf') => {
    if (!user || !isAdmin) {
      setError('No autorizado para exportar reportes.');
      return;
    }
    try {
      let endpoint = '';
      let params: any = {};

      if (tabValue !== 4) { // General reports
        endpoint = format === 'excel' ? '/orders/reports-excel/' : '/orders/reports-pdf/';
        params = { period: period };
      } else { // "Por Búsqueda" tab reports
        endpoint = format === 'excel' ? '/orders/search-reports-excel/' : '/orders/search-reports-pdf/'; // New backend endpoints
        // Pass current search criteria
        if (searchText) {
          params.command_text = searchText;
        } else if (voiceCommandText) {
          params.command_text = voiceCommandText;
        } else if (pills.length > 0) {
          params.pills = JSON.stringify(pills); // Send pills as a JSON string
        }
      }

      const response = await api.get(endpoint, {
        params: params,
        headers: {
          Authorization: `Bearer ${user.accessToken}`,
        },
        responseType: 'blob', // Important for file downloads
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      let filename = `reporte_ventas.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      if (tabValue === 4 && searchReportData?.report_type) {
        filename = `reporte_${searchReportData.report_type}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      } else if (tabValue === 4 && (searchText || voiceCommandText || pills.length > 0)) {
        filename = `reporte_busqueda.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      }
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(`Error exporting to ${format}:`, err);
      const message = isAxiosError<ReportsErrorResponse>(err)
        ? err.response?.data?.detail ?? err.response?.data?.message
        : undefined;
      setError(message ?? `No fue posible exportar el reporte a ${format}.`);
    }
  };


  if (authLoading) {
    return null;
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <AdminLayout>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Reportes
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Análisis detallado de ventas y rendimiento
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" onClick={() => handleExport('excel')}>
            Exportar a Excel
          </Button>
          <Button variant="outlined" onClick={() => handleExport('pdf')}>
            Exportar a PDF
          </Button>
          {tabValue !== 4 && ( // Only show period selector for main tabs
            <FormControl sx={{ minWidth: 180 }}>
              <InputLabel>Período</InputLabel>
              <Select
                value={period}
                label="Período"
                onChange={(e) => setPeriod(e.target.value)}
              >
                <MenuItem value="week">Esta Semana</MenuItem>
                <MenuItem value="month">Este Mes</MenuItem>
                <MenuItem value="year">Este Año</MenuItem>
                <MenuItem value="custom">Personalizado</MenuItem>
              </Select>
            </FormControl>
          )}
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Ventas" />
          <Tab label="Productos" />
          <Tab label="Clientes" />
          <Tab label="Inventario" />
          <Tab label="Por Búsqueda" /> {/* New Tab */}
        </Tabs>
      </Box>

      {error && tabValue !== 4 && ( // Only show error for main tabs
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Tab: Ventas */}
      {tabValue === 0 && (
        <Box sx={{ display: 'grid', gap: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Evolución de Ventas y Ganancias
              </Typography>
              {loadingSummary ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress size={32} />
                </Box>
              ) : monthlySales.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={monthlySales}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke="#D81B60"
                      fill="#D81B60"
                      name="Ventas Totales"
                    />
                    <Area
                      type="monotone"
                      dataKey="profits"
                      stroke="#4CAF50"
                      fill="#4CAF50"
                      name="Ganancias Netas"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Aún no hay movimientos para mostrar.
                </Typography>
              )}
            </CardContent>
          </Card>

          <Box
            sx={{
              display: 'grid',
              gap: 3,
              gridTemplateColumns: {
                xs: '1fr',
                md: 'repeat(2, 1fr)',
              },
            }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Ventas por Categoría
                </Typography>
                {loadingSummary ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress size={32} />
                  </Box>
                ) : categoryBarData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={categoryBarData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                      <Bar dataKey="amount" fill="#673AB7" name="Ventas" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No se registran ventas por categoría.
                  </Typography>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Distribución de Métodos de Pago
                </Typography>
                {loadingSummary ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress size={32} />
                  </Box>
                ) : paymentMethodsData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={paymentMethodsData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(data) => {
                          const percentValue =
                            typeof data.percent === 'number' ? data.percent : 0;
                          return `${data.label} ${(percentValue * 100).toFixed(0)}%`;
                        }}
                        outerRadius={100}
                        dataKey="value"
                      >
                        {paymentMethodsData.map((entry, index) => (
                          <Cell key={`payment-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number, _name: string, props) =>
                          props && 'label' in props.payload
                            ? [formatCurrency(value), props.payload.label]
                            : formatCurrency(value)
                        }
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No hay información de métodos de pago.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Box>
        </Box>
      )}

      {/* Tab: Productos */}
      {tabValue === 1 && (
        <Box sx={{ display: 'grid', gap: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Participación por Categoría (Unidades)
              </Typography>
              {loadingSummary ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress size={32} />
                </Box>
              ) : categoryUnitsPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={categoryUnitsPieData}
                      cx="50%"
                      cy="50%"
                      labelLine
                      label={(data) => `${data.name}: ${data.value} uds`}
                      outerRadius={140}
                      dataKey="value"
                    >
                      {categoryUnitsPieData.map((entry, index) => (
                        <Cell key={`category-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `${value} uds`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No hay ventas registradas por categoría.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Tab: Clientes */}
      {tabValue === 2 && (
        <Box sx={{ display: 'grid', gap: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Top Clientes por Facturación
              </Typography>
              {loadingSummary ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress size={32} />
                </Box>
              ) : topCustomersData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={topCustomersData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={160} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="amount" fill="#FF5722" name="Total Comprado" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Aún no hay clientes frecuentes.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Tab: Inventario */}
      {tabValue === 3 && (
        <Box sx={{ display: 'grid', gap: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Productos con Menor Inventario
              </Typography>
              {loadingSummary ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress size={32} />
                </Box>
              ) : inventoryChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={inventoryChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="product" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `${value} uds`} />
                    <Legend />
                    <Bar dataKey="stock" name="Stock Disponible">
                      {inventoryChartData.map((entry, index) => (
                        <Cell
                          key={`inventory-${index}`}
                          fill={entry.status === 'low' ? '#E53935' : '#26C6DA'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Inventario sin alertas por el momento.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Box>
      )}

      {/* New Tab: Por Búsqueda */}
      {tabValue === 4 && (
        <Box sx={{ display: 'grid', gap: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Búsqueda de Reportes por Voz, Texto o Filtros.
              </Typography>

              {/* Text Input */}
              <Box sx={{ display: 'flex', gap: 1, mt: 2, mb: 2 }}>
                <TextField
                  label="Comando de Texto"
                  variant="outlined"
                  fullWidth
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearchSubmit(searchText);
                    }
                  }}
                />
                <Button
                  variant="contained"
                  onClick={() => handleSearchSubmit(searchText)}
                  startIcon={<Search/>}
                  disabled={loadingSearch}
                >
                  Buscar
                </Button>
              </Box>

              {/* Voice Input Button */}
              <Button
                variant="outlined"
                fullWidth
                startIcon={<MicNone />}
                sx={{ mb: 2 }}
                onClick={handleVoiceCommand}
                disabled={isListeningVoiceCommand || loadingSearch}
              >
                {isListeningVoiceCommand ? 'Escuchando...' : 'Comando de Voz'}
              </Button>

              {/* Pills Input */}
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  label="Añadir Filtro"
                  variant="outlined"
                  fullWidth
                  value={addPillText}
                  onChange={(e) => setAddPillText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddPill();
                    }
                  }}
                  helperText="Formato: campo:operador:valor (ej. name:contains:camisa, price:gt:50)" // Added helper text
                  error={!!error && error.includes('Píldora inválido')} // Highlight if pill error
                />
                <Button variant="contained" onClick={handleAddPill} disabled={loadingSearch}>
                  Añadir
                </Button>
              </Box>

              {/* Display Pills */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {pills.map((pill: any, index: number) => ( // Changed pill type to any
                  <Chip
                    key={index}
                    label={`${pill.field}:${pill.operator}:${pill.value}`} // Display structured pill
                    onDelete={() => handleRemovePill(pill)}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>

              {/* Clear Button */}
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleClearSearch}
                sx={{ mb: 2 }}
              >
                Limpiar Búsqueda
              </Button>
              
              {error && !error.includes('Píldora inválido') && ( // Display general errors
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}
              {error && error.includes('Píldora inválido') && ( // Display pill-specific error
                <Alert severity="warning" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              {loadingSearch ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress size={32} />
                </Box>
              ) : (
                searchReportData && (
                  <Box>
                    <Typography variant="subtitle1" gutterBottom>
                      Resultados para: {voiceCommandText || searchText || pills.join(' AND ')}
                    </Typography>
                    {searchReportData.message && (
                      <Typography color="error">{searchReportData.message}</Typography>
                    )}
                    {searchReportData.report_type === 'top_products' && (
                      <Box>
                        <Typography variant="h6">Productos Más Vendidos</Typography>
                        {/* Render table for top products */}
                        <TableContainer component={Paper}>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Producto</TableCell>
                                <TableCell align="right">Unidades Vendidas</TableCell>
                                <TableCell align="right">Monto</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {searchReportData.data.map((item: any, index: number) => (
                                <TableRow key={index}>
                                  <TableCell>{item.name}</TableCell>
                                  <TableCell align="right">{item.units}</TableCell>
                                  <TableCell align="right">{formatCurrency(item.amount)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Box>
                    )}
                    {searchReportData.report_type === 'top_customers' && (
                      <Box>
                        <Typography variant="h6">Clientes Frecuentes</Typography>
                        {/* Render table for top customers */}
                        <TableContainer component={Paper}>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Cliente</TableCell>
                                <TableCell align="right">Teléfono</TableCell>
                                <TableCell align="right">Órdenes</TableCell>
                                <TableCell align="right">Monto</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {searchReportData.data.map((item: any, index: number) => (
                                <TableRow key={index}>
                                  <TableCell>{item.name}</TableCell>
                                  <TableCell align="right">{item.phone}</TableCell>
                                  <TableCell align="right">{item.orders}</TableCell>
                                  <TableCell align="right">{formatCurrency(item.amount)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Box>
                    )}
                    {searchReportData.report_type === 'products_above_value' && (
                      <Box>
                        <Typography variant="h6">Productos con Valor Mayor a</Typography>
                        {/* Render table for products above value */}
                        <TableContainer component={Paper}>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Producto</TableCell>
                                <TableCell align="right">Precio</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {searchReportData.data.map((item: any, index: number) => (
                                <TableRow key={index}>
                                  <TableCell>{item.name}</TableCell>
                                  <TableCell align="right">{formatCurrency(item.price)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Box>
                    )}
                    {searchReportData.report_type === 'products_equal_value' && (
                      <Box>
                        <Typography variant="h6">Productos con Valor Igual a</Typography>
                        {/* Render table for products equal value */}
                        <TableContainer component={Paper}>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Producto</TableCell>
                                <TableCell align="right">Precio</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {searchReportData.data.map((item: any, index: number) => (
                                <TableRow key={index}>
                                  <TableCell>{item.name}</TableCell>
                                  <TableCell align="right">{formatCurrency(item.price)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Box>
                    )}
                    {searchReportData.report_type === 'low_stock_products' && (
                      <Box>
                        <Typography variant="h6">Productos con Bajo Stock</Typography>
                        {/* Render table for low stock products */}
                        <TableContainer component={Paper}>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Producto</TableCell>
                                <TableCell align="right">Stock</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {searchReportData.data.map((item: any, index: number) => (
                                <TableRow key={index}>
                                  <TableCell>{item.name}</TableCell>
                                  <TableCell align="right">{item.stock}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Box>
                    )}
                  </Box>
                )
              )}
            </CardContent>
          </Card>
        </Box>
      )}
    </AdminLayout>
  );
}