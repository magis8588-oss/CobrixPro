import { EstadisticaCobrador, Cobrador, ConfiguracionInteres, User, Cliente, Pago, Transaccion } from '@/types'

// Usuario de prueba - Admin
export const mockAdminUser: User = {
  id: 'admin-123',
  email: 'admin@cobrixpro.com',
  nombre: 'Juan Administrador',
  role: 'admin',
  created_at: '2025-01-01T00:00:00Z',
}

// Usuario de prueba - Cobrador
export const mockCobradorUser: User = {
  id: 'cobrador-123',
  email: 'cobrador@test.com',
  nombre: 'María Cobradora',
  role: 'cobrador',
  created_at: '2025-01-01T00:00:00Z',
}

// Cobradores de prueba
export const mockCobradores: Cobrador[] = [
  {
    id: 'cob-1',
    email: 'pedro.gomez@cobrixpro.com',
    nombre: 'Pedro Gómez',
    role: 'cobrador',
    activo: true,
    created_at: '2025-01-15T10:00:00Z',
  },
  {
    id: 'cob-2',
    email: 'ana.martinez@cobrixpro.com',
    nombre: 'Ana Martínez',
    role: 'cobrador',
    activo: true,
    created_at: '2025-01-20T14:30:00Z',
  },
  {
    id: 'cob-3',
    email: 'carlos.lopez@cobrixpro.com',
    nombre: 'Carlos López',
    role: 'cobrador',
    activo: false,
    created_at: '2025-02-01T09:15:00Z',
  },
  {
    id: 'cob-4',
    email: 'lucia.rodriguez@cobrixpro.com',
    nombre: 'Lucía Rodríguez',
    role: 'cobrador',
    activo: true,
    created_at: '2025-02-10T11:45:00Z',
  },
]

// Estadísticas de prueba
export const mockEstadisticas: EstadisticaCobrador[] = [
  {
    cobrador_id: 'cob-1',
    cobrador_nombre: 'Pedro Gómez',
    meta_recaudacion: 5000000,
    total_recaudado: 5250000,
    clientes_nuevos: 8,
    clientes_totales: 45,
    porcentaje_cumplimiento: 105,
  },
  {
    cobrador_id: 'cob-2',
    cobrador_nombre: 'Ana Martínez',
    meta_recaudacion: 4500000,
    total_recaudado: 4100000,
    clientes_nuevos: 12,
    clientes_totales: 38,
    porcentaje_cumplimiento: 91.1,
  },
  {
    cobrador_id: 'cob-4',
    cobrador_nombre: 'Lucía Rodríguez',
    meta_recaudacion: 3800000,
    total_recaudado: 2650000,
    clientes_nuevos: 5,
    clientes_totales: 28,
    porcentaje_cumplimiento: 69.7,
  },
]

// Configuración de interés de prueba
export const mockConfigInteres: ConfiguracionInteres = {
  id: 'config-1',
  tasa_interes: 5.5,
  moneda: 'COP',
  updated_at: '2025-01-01T00:00:00Z',
  updated_by: 'admin-123',
}

// Monedas disponibles
export const monedas = [
  { code: 'COP', name: 'Peso Colombiano', symbol: '$' },
  { code: 'USD', name: 'Dólar Estadounidense', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'MXN', name: 'Peso Mexicano', symbol: '$' },
  { code: 'ARS', name: 'Peso Argentino', symbol: '$' },
  { code: 'CLP', name: 'Peso Chileno', symbol: '$' },
  { code: 'PEN', name: 'Sol Peruano', symbol: 'S/' },
  { code: 'BRL', name: 'Real Brasileño', symbol: 'R$' },
]

// Clientes de prueba para cobradores
export const mockClientes: Cliente[] = [
  {
    id: 'cli-1',
    nombre: 'Roberto Pérez',
    cedula: '1234567890',
    telefono: '3001234567',
    direccion: 'Calle 45 #12-34, Bogotá',
    monto_prestamo: 200000,
    tipo_cobro: 'diario',
    valor_cuota: 10000,
    cuotas_totales: 24,
    cuotas_pagadas: 18,
    cuotas_pendientes: 6,
    saldo_pendiente: 60000,
    proximo_cobro: '2025-10-14T00:00:00Z', // Mañana
    ultimo_pago: '2025-10-13T00:00:00Z',
    estado: 'al_dia',
    cobrador_id: 'cobrador-123',
    created_at: '2025-09-20T00:00:00Z',
  },
  {
    id: 'cli-2',
    nombre: 'María Fernández',
    cedula: '9876543210',
    telefono: '3109876543',
    direccion: 'Carrera 15 #78-90, Medellín',
    monto_prestamo: 150000,
    tipo_cobro: 'diario',
    valor_cuota: 7500,
    cuotas_totales: 24,
    cuotas_pagadas: 20,
    cuotas_pendientes: 4,
    saldo_pendiente: 30000,
    proximo_cobro: '2025-10-14T00:00:00Z', // Mañana - para cobrar
    ultimo_pago: '2025-10-12T00:00:00Z',
    estado: 'al_dia',
    cobrador_id: 'cobrador-123',
    created_at: '2025-09-15T00:00:00Z',
  },
  {
    id: 'cli-3',
    nombre: 'Carlos Sánchez',
    cedula: '5556667778',
    telefono: '3157894561',
    direccion: 'Avenida 68 #45-12, Bogotá',
    monto_prestamo: 300000,
    tipo_cobro: 'semanal',
    valor_cuota: 37500,
    cuotas_totales: 10,
    cuotas_pagadas: 6,
    cuotas_pendientes: 4,
    saldo_pendiente: 150000,
    proximo_cobro: '2025-10-14T00:00:00Z', // Mañana - para cobrar
    ultimo_pago: '2025-10-07T00:00:00Z',
    estado: 'al_dia',
    cobrador_id: 'cobrador-123',
    created_at: '2025-08-05T00:00:00Z',
  },
  {
    id: 'cli-4',
    nombre: 'Ana López',
    cedula: '4445556667',
    telefono: '3201237890',
    direccion: 'Calle 100 #20-15, Cali',
    monto_prestamo: 100000,
    tipo_cobro: 'quincenal',
    valor_cuota: 25000,
    cuotas_totales: 5,
    cuotas_pagadas: 3,
    cuotas_pendientes: 2,
    saldo_pendiente: 50000,
    proximo_cobro: '2025-10-20T00:00:00Z', // Próxima quincena
    ultimo_pago: '2025-10-05T00:00:00Z',
    estado: 'al_dia',
    cobrador_id: 'cobrador-123',
    created_at: '2025-08-20T00:00:00Z',
  },
  {
    id: 'cli-5',
    nombre: 'Jorge Martínez',
    cedula: '7778889990',
    telefono: '3138889990',
    direccion: 'Carrera 7 #32-41, Bogotá',
    monto_prestamo: 250000,
    tipo_cobro: 'diario',
    valor_cuota: 12500,
    cuotas_totales: 24,
    cuotas_pagadas: 16,
    cuotas_pendientes: 8,
    saldo_pendiente: 100000,
    proximo_cobro: '2025-10-13T00:00:00Z', // Hoy - en mora
    ultimo_pago: '2025-10-11T00:00:00Z',
    estado: 'mora',
    cobrador_id: 'cobrador-123',
    created_at: '2025-09-01T00:00:00Z',
  },
]

// Pagos de prueba
export const mockPagos: Pago[] = [
  {
    id: 'pago-1',
    cliente_id: 'cli-1',
    cliente_nombre: 'Roberto Pérez',
    monto: 500000,
    monto_interes: 27500,
    monto_total: 527500,
    metodo_pago: 'transferencia',
    fecha_pago: '2025-10-01T10:30:00Z',
    notas: 'Pago mensual octubre',
    cobrador_id: 'cobrador-123',
    cobrador_nombre: 'María Cobradora',
    created_at: '2025-10-01T10:30:00Z',
  },
  {
    id: 'pago-2',
    cliente_id: 'cli-4',
    cliente_nombre: 'Ana López',
    monto: 600000,
    monto_interes: 33000,
    monto_total: 633000,
    metodo_pago: 'efectivo',
    fecha_pago: '2025-10-05T14:15:00Z',
    notas: 'Pago en oficina',
    cobrador_id: 'cobrador-123',
    cobrador_nombre: 'María Cobradora',
    created_at: '2025-10-05T14:15:00Z',
  },
  {
    id: 'pago-3',
    cliente_id: 'cli-5',
    cliente_nombre: 'Jorge Martínez',
    monto: 300000,
    monto_interes: 16500,
    monto_total: 316500,
    metodo_pago: 'transferencia',
    fecha_pago: '2025-09-20T09:00:00Z',
    notas: 'Pago parcial',
    cobrador_id: 'cobrador-123',
    cobrador_nombre: 'María Cobradora',
    created_at: '2025-09-20T09:00:00Z',
  },
]

// Transacciones de prueba
export const mockTransacciones: Transaccion[] = [
  {
    id: 'trans-1',
    tipo: 'pago',
    cliente_id: 'cli-1',
    cliente_nombre: 'Roberto Pérez',
    monto: 527500,
    saldo_anterior: 1377500,
    saldo_nuevo: 850000,
    fecha: '2025-10-01T10:30:00Z',
    descripcion: 'Pago mensual octubre',
    cobrador_id: 'cobrador-123',
    created_at: '2025-10-01T10:30:00Z',
  },
  {
    id: 'trans-2',
    tipo: 'pago',
    cliente_id: 'cli-4',
    cliente_nombre: 'Ana López',
    monto: 633000,
    saldo_anterior: 1083000,
    saldo_nuevo: 450000,
    fecha: '2025-10-05T14:15:00Z',
    descripcion: 'Pago en oficina',
    cobrador_id: 'cobrador-123',
    created_at: '2025-10-05T14:15:00Z',
  },
  {
    id: 'trans-3',
    tipo: 'pago',
    cliente_id: 'cli-5',
    cliente_nombre: 'Jorge Martínez',
    monto: 316500,
    saldo_anterior: 1296500,
    saldo_nuevo: 980000,
    fecha: '2025-09-20T09:00:00Z',
    descripcion: 'Pago parcial',
    cobrador_id: 'cobrador-123',
    created_at: '2025-09-20T09:00:00Z',
  },
  {
    id: 'trans-4',
    tipo: 'cobro',
    cliente_id: 'cli-3',
    cliente_nombre: 'Carlos Sánchez',
    monto: 3500000,
    saldo_anterior: 0,
    saldo_nuevo: 3500000,
    fecha: '2025-03-10T00:00:00Z',
    descripcion: 'Préstamo inicial',
    cobrador_id: 'cobrador-123',
    created_at: '2025-03-10T00:00:00Z',
  },
]

// Función helper para simular delay de API
export const simulateDelay = (ms: number = 500) => 
  new Promise(resolve => setTimeout(resolve, ms))
