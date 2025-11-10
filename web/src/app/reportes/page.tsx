'use client';

import { useEffect, useMemo, useState } from 'react';
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
  Button, // Added Button import
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
    if (!authLoading && user && isAdmin) {
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
  }, [authLoading, user, isAdmin]);

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

  if (authLoading) {
    return null;
  }

  if (!user || !isAdmin) {
    return null;
  }

  const handleExport = async (format: 'excel' | 'pdf') => {
    if (!user || !isAdmin) {
      setError('No autorizado para exportar reportes.');
      return;
    }
    try {
      const endpoint = format === 'excel' ? '/orders/reports-excel/' : '/orders/reports-pdf/';
      const response = await api.get(endpoint, {
        headers: {
          Authorization: `Bearer ${user.accessToken}`,
        },
        responseType: 'blob', // Important for file downloads
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reporte_ventas.${format === 'excel' ? 'xlsx' : 'pdf'}`);
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
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Ventas" />
          <Tab label="Productos" />
          <Tab label="Clientes" />
          <Tab label="Inventario" />
        </Tabs>
      </Box>

      {error && (
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
    </AdminLayout>
  );
}
