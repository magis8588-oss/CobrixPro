export type UserRole = 'admin' | 'cobrador'

export interface User {
  id: string
  email: string
  nombre: string
  role: UserRole
  activo?: boolean
  created_at: string
}

export interface Cobrador extends User {
  role: 'cobrador'
  activo: boolean
}

export interface ConfiguracionInteres {
  id: string
  tasa_interes: number
  moneda: string // COP, USD, EUR, etc.
  updated_at: string
  updated_by: string
}

export interface Cliente {
  id: string
  nombre: string
  cedula: string
  telefono: string
  direccion: string
  monto_prestamo: number
  tipo_cobro: 'diario' | 'semanal' | 'quincenal'
  valor_cuota: number
  cuotas_totales: number
  cuotas_pagadas: number
  cuotas_pendientes: number
  saldo_pendiente: number
  proximo_cobro: string // Fecha del próximo cobro
  ultimo_pago?: string
  fecha_inicio?: string // Fecha de inicio o renovación del préstamo
  estado: 'al_dia' | 'mora' | 'renovado' | 'completado'
  cobrador_id: string
  created_at: string
}

export interface Pago {
  id: string
  cliente_id: string
  cliente_nombre: string
  monto: number
  monto_interes: number
  monto_total: number
  metodo_pago: 'efectivo' | 'transferencia' | 'tarjeta'
  fecha_pago: string
  notas?: string
  cobrador_id: string
  cobrador_nombre: string
  created_at: string
}

export interface Transaccion {
  id: string
  tipo: 'cobro' | 'pago' | 'ajuste'
  cliente_id: string
  cliente_nombre: string
  monto: number
  saldo_anterior: number
  saldo_nuevo: number
  fecha: string
  descripcion: string
  cobrador_id: string
  created_at: string
}

export interface EstadisticaCobrador {
  cobrador_id: string
  cobrador_nombre: string
  meta_recaudacion: number
  total_recaudado: number
  clientes_nuevos: number
  clientes_totales: number
  porcentaje_cumplimiento: number
}
