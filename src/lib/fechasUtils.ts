/**
 * Utilidades para el manejo de fechas en el sistema de cobros
 * Respeta días festivos de Colombia y domingos como días no hábiles
 */

/**
 * Días festivos de Colombia 2025
 * Formato: MM-DD
 */
const diasFestivos2025 = [
  '01-01', // Año Nuevo
  '01-06', // Reyes Magos
  '03-24', // San José
  '04-17', // Jueves Santo
  '04-18', // Viernes Santo
  '05-01', // Día del Trabajo
  '06-02', // Ascensión del Señor
  '06-23', // Corpus Christi
  '07-01', // Sagrado Corazón
  '07-20', // Día de la Independencia
  '08-07', // Batalla de Boyacá
  '08-18', // Asunción de la Virgen
  '10-13', // Día de la Raza
  '11-03', // Todos los Santos
  '11-17', // Independencia de Cartagena
  '12-08', // Inmaculada Concepción
  '12-25', // Navidad
]

/**
 * Verifica si una fecha es día festivo
 */
export function esFestivo(fecha: Date): boolean {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  const fechaStr = `${mes}-${dia}`
  return diasFestivos2025.includes(fechaStr)
}

/**
 * Verifica si una fecha es domingo
 */
export function esDomingo(fecha: Date): boolean {
  return fecha.getDay() === 0
}

/**
 * Verifica si una fecha es día hábil (no domingo ni festivo)
 */
export function esDiaHabil(fecha: Date): boolean {
  return !esDomingo(fecha) && !esFestivo(fecha)
}

/**
 * Obtiene el siguiente día hábil a partir de una fecha
 * Si la fecha es hábil, la retorna. Si no, busca el siguiente día hábil.
 */
export function obtenerSiguienteDiaHabil(fecha: Date): Date {
  const nuevaFecha = new Date(fecha)
  
  // Si la fecha actual ya es hábil, retornarla
  if (esDiaHabil(nuevaFecha)) {
    return nuevaFecha
  }
  
  // Buscar el siguiente día hábil
  let intentos = 0
  while (!esDiaHabil(nuevaFecha) && intentos < 14) { // máximo 2 semanas adelante
    nuevaFecha.setDate(nuevaFecha.getDate() + 1)
    intentos++
  }
  
  return nuevaFecha
}

/**
 * Calcula la fecha del próximo cobro según el tipo de frecuencia
 * @param fechaInicial - Fecha desde la cual calcular (por defecto hoy)
 * @param tipoCobro - Tipo de frecuencia: diario, semanal, quincenal
 * @returns Fecha del próximo cobro en formato ISO string
 */
export function calcularProximoCobro(
  fechaInicial: Date = new Date(),
  tipoCobro: 'diario' | 'semanal' | 'quincenal'
): string {
  // Usar componentes de fecha local para evitar conversión de zona horaria
  const year = fechaInicial.getFullYear()
  const month = fechaInicial.getMonth()
  const day = fechaInicial.getDate()
  
  const fecha = new Date(year, month, day)
  
  // Calcular días a sumar según tipo de cobro
  let diasASumar = 1 // Por defecto diario
  
  if (tipoCobro === 'semanal') {
    diasASumar = 7
  } else if (tipoCobro === 'quincenal') {
    diasASumar = 15
  }
  
  // Sumar los días
  fecha.setDate(fecha.getDate() + diasASumar)
  
  // Ajustar al siguiente día hábil si cae en domingo o festivo
  const fechaHabil = obtenerSiguienteDiaHabil(fecha)
  
  // Retornar YYYY-MM-DD sin sufijo de zona horaria para evitar conversión
  const yearFinal = fechaHabil.getFullYear()
  const monthFinal = String(fechaHabil.getMonth() + 1).padStart(2, '0')
  const dayFinal = String(fechaHabil.getDate()).padStart(2, '0')
  
  return `${yearFinal}-${monthFinal}-${dayFinal}`
}

/**
 * Calcula la fecha del PRIMER cobro para un préstamo nuevo
 * Para cobro semanal: mismo día de la semana la próxima semana
 * Para cobro diario: mañana (si es hábil)
 * Para cobro quincenal: 15 días después
 */
export function calcularPrimerCobro(
  tipoCobro: 'diario' | 'semanal' | 'quincenal'
): string {
  // Crear fecha usando componentes locales para evitar conversión de zona horaria
  const hoy = new Date()
  const year = hoy.getFullYear()
  const month = hoy.getMonth()
  const day = hoy.getDate()
  
  // Crear fecha en zona horaria local (sin conversión UTC)
  let fechaPrimerCobro = new Date(year, month, day)
  
  if (tipoCobro === 'diario') {
    // Para diario: MAÑANA (hoy + 1 día)
    fechaPrimerCobro.setDate(fechaPrimerCobro.getDate() + 1)
  } else if (tipoCobro === 'semanal') {
    // Para semanal: mismo día de la semana, próxima semana (hoy + 7 días)
    fechaPrimerCobro.setDate(fechaPrimerCobro.getDate() + 7)
  } else {
    // Para quincenal: 15 días después
    fechaPrimerCobro.setDate(fechaPrimerCobro.getDate() + 15)
  }
  
  // Ajustar al siguiente día hábil si cae en domingo o festivo
  const fechaHabil = obtenerSiguienteDiaHabil(fechaPrimerCobro)
  
  // Retornar YYYY-MM-DD sin sufijo de zona horaria para evitar conversión
  const yearFinal = fechaHabil.getFullYear()
  const monthFinal = String(fechaHabil.getMonth() + 1).padStart(2, '0')
  const dayFinal = String(fechaHabil.getDate()).padStart(2, '0')
  
  return `${yearFinal}-${monthFinal}-${dayFinal}`
}

/**
 * Formatea una fecha para mostrar en español
 * Parsea YYYY-MM-DD sin conversión de zona horaria
 */
export function formatearFecha(fecha: Date | string): string {
  let date: Date
  
  if (typeof fecha === 'string') {
    // Parsear YYYY-MM-DD sin conversión de zona horaria
    const [year, month, day] = fecha.split('T')[0].split('-').map(Number)
    date = new Date(year, month - 1, day)
  } else {
    date = fecha
  }
  
  return date.toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * Formatea una fecha de forma corta
 * Parsea YYYY-MM-DD sin conversión de zona horaria
 */
export function formatearFechaCorta(fecha: Date | string): string {
  let date: Date
  
  if (typeof fecha === 'string') {
    // Parsear YYYY-MM-DD sin conversión de zona horaria
    const [year, month, day] = fecha.split('T')[0].split('-').map(Number)
    date = new Date(year, month - 1, day)
  } else {
    date = fecha
  }
  
  return date.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

/**
 * Obtiene el día de la semana en español
 */
export function obtenerDiaSemana(fecha: Date | string): string {
  const date = typeof fecha === 'string' ? new Date(fecha) : fecha
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  return dias[date.getDay()]
}
