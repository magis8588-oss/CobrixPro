# 🔧 Corrección: Clientes no se Guardaban

## 🐛 Problema Identificado

Los clientes no se estaban guardando porque había **inconsistencia entre la estructura de TypeScript y la base de datos real**.

### Diferencias Encontradas:

| Campo | Código TypeScript | Base de Datos Real | Problema |
|-------|------------------|-------------------|----------|
| `id` | Generado manual: `cli-${Date.now()}` | UUID auto generado | ❌ Conflict |
| `cuotas_pendientes` | Campo en tipo Cliente | NO existe en DB | ❌ Columna extra |
| `fecha_inicio` | NO enviado | DATE requerido | ❌ Falta campo |
| `proximo_cobro` | TIMESTAMP (ISO string) | DATE (YYYY-MM-DD) | ❌ Tipo incorrecto |
| `estado` | 'mora' | 'atrasado' | ❌ Valor diferente |
| `ultimo_pago` | En tipo Cliente | NO existe en DB | ❌ Columna extra |

---

## ✅ Soluciones Aplicadas

### 1. **Función `handleAgregarCliente`**

**ANTES** (Incorrecto):
```typescript
const nuevoCliente: Cliente = {
  id: `cli-${Date.now()}`,  // ❌ Conflicto con UUID auto
  cuotas_pendientes: cuotasTotales, // ❌ No existe en DB
  proximo_cobro: proximoCobro, // ❌ Timestamp en lugar de Date
  // ❌ Faltaba fecha_inicio
}

await supabase.from('clientes').insert([nuevoCliente])
// ❌ Sin manejo de errores
```

**AHORA** (Correcto):
```typescript
const clienteData = {
  // ✅ No enviamos 'id', Supabase lo genera automáticamente
  nombre,
  cedula,
  telefono,
  direccion,
  monto_prestamo: monto,
  tipo_cobro: tipoCobro,
  valor_cuota: valorCuota,
  cuotas_totales: cuotasTotales,
  cuotas_pagadas: 0,
  saldo_pendiente: valorCuota * cuotasTotales,
  fecha_inicio: hoy.toISOString().split('T')[0], // ✅ DATE: YYYY-MM-DD
  proximo_cobro: fechaProximoCobro.toISOString().split('T')[0], // ✅ DATE
  estado: 'al_dia',
  cobrador_id: user?.id || '',
}

const { data, error } = await supabase
  .from('clientes')
  .insert([clienteData])
  .select('*')
  .single()

if (error) {
  console.error('❌ Error al guardar cliente:', error)
  alert(`Error al guardar: ${error.message}`)
  return
}
```

**Cambios clave**:
- ✅ No se envía `id` (UUID auto generado por DB)
- ✅ No se envía `cuotas_pendientes` (se calcula en el frontend)
- ✅ Se envía `fecha_inicio` (requerido por DB)
- ✅ `proximo_cobro` como DATE (`YYYY-MM-DD`)
- ✅ Manejo de errores con try-catch
- ✅ Alertas informativas al usuario
- ✅ Console.log para debugging

---

### 2. **Función `loadData`**

**ANTES**:
```typescript
const { data } = await supabase
  .from('clientes')
  .select('*')
  .eq('cobrador_id', user?.id)

if (data) setClientes(data) // ❌ Datos de DB no coinciden con tipo Cliente
```

**AHORA**:
```typescript
const { data, error } = await supabase
  .from('clientes')
  .select('*')
  .eq('cobrador_id', user?.id)

if (data) {
  // ✅ Mapear datos de DB al tipo Cliente
  const clientesMapeados = data.map(cliente => ({
    ...cliente,
    cuotas_pendientes: cliente.cuotas_totales - cliente.cuotas_pagadas, // ✅ Calcular
    proximo_cobro: cliente.proximo_cobro 
      ? new Date(cliente.proximo_cobro).toISOString() 
      : new Date().toISOString(), // ✅ Convertir DATE a ISO
    estado: cliente.estado === 'atrasado' ? 'mora' : cliente.estado, // ✅ Mapear estados
  }))
  setClientes(clientesMapeados)
}
```

**Cambios clave**:
- ✅ Calcula `cuotas_pendientes` en el frontend
- ✅ Convierte `proximo_cobro` de DATE a ISO string
- ✅ Mapea 'atrasado' (DB) → 'mora' (frontend)

---

### 3. **Función `handleRegistrarPago`**

**ANTES**:
```typescript
const clienteActualizado: Cliente = {
  ...cliente, // ❌ Incluye campos que no existen en DB
  cuotas_pagadas: cliente.cuotas_pagadas + 1,
  // ...
}

await supabase.from('clientes').update(clienteActualizado).eq('id', clienteId)
```

**AHORA**:
```typescript
const datosActualizacion = {
  cuotas_pagadas: nuevoCuotasPagadas,
  saldo_pendiente: nuevoSaldoPendiente,
  proximo_cobro: fechaProximoCobro.toISOString().split('T')[0], // ✅ DATE
  estado: nuevoCuotasPagadas >= cliente.cuotas_totales ? 'completado' : 'al_dia',
  updated_at: new Date().toISOString(),
}

const { error } = await supabase
  .from('clientes')
  .update(datosActualizacion)
  .eq('id', clienteId)

if (error) {
  console.error('Error al registrar pago:', error)
  alert(`Error: ${error.message}`)
}
```

**Cambios clave**:
- ✅ Solo envía campos que existen en DB
- ✅ Formato DATE correcto
- ✅ Manejo de errores

---

### 4. **Función `handleNoPago`**

**ANTES**:
```typescript
estado: 'mora' // ❌ DB espera 'atrasado'
```

**AHORA**:
```typescript
const datosActualizacion = {
  estado: 'atrasado', // ✅ Valor correcto para DB
  proximo_cobro: fechaProximoCobro.toISOString().split('T')[0],
  updated_at: new Date().toISOString(),
}
```

---

### 5. **Función `handleRenovar`**

**ANTES**:
```typescript
const clienteRenovado: Cliente = {
  ...clienteRenovar, // ❌ Incluye campos incompatibles
  // ...
}

await supabase.from('clientes').update(clienteRenovado).eq('id', clienteRenovar.id)
```

**AHORA**:
```typescript
const datosRenovacion = {
  monto_prestamo: prestamoTotal,
  valor_cuota: valorCuota,
  cuotas_totales: cuotasTotales,
  cuotas_pagadas: 0,
  saldo_pendiente: valorCuota * cuotasTotales,
  fecha_inicio: hoy.toISOString().split('T')[0], // ✅ DATE
  proximo_cobro: fechaProximoCobro.toISOString().split('T')[0], // ✅ DATE
  estado: 'renovado',
  updated_at: new Date().toISOString(),
}

const { error } = await supabase
  .from('clientes')
  .update(datosRenovacion)
  .eq('id', clienteRenovar.id)
```

---

## 🧪 Cómo Probar

### 1. Abrir la consola del navegador (F12)
Busca mensajes como:
```
📝 Intentando guardar cliente: { ... }
✅ Cliente guardado exitosamente: [...]
✅ Clientes cargados: 1
```

### 2. Intentar crear un cliente
1. Ingresa como cobrador
2. Clic en "Nuevo Cliente"
3. Completa todos los campos
4. Clic en "Guardar Cliente"

**Si hay error**, verás:
- ❌ Mensaje de error específico en alerta
- ❌ Console.log con detalles del error
- ❌ No se cierra el modal

**Si funciona**, verás:
- ✅ Alerta "¡Cliente agregado exitosamente!"
- ✅ Modal se cierra
- ✅ Cliente aparece en la lista
- ✅ Console muestra: "✅ Cliente guardado exitosamente"

### 3. Verificar en Supabase
1. Ve a tu proyecto Supabase
2. Table Editor → `clientes`
3. Deberías ver el nuevo cliente con:
   - UUID generado automáticamente
   - `fecha_inicio` con fecha actual
   - `proximo_cobro` con fecha calculada
   - Todos los campos correctos

---

## 📊 Estructura Real de la Tabla `clientes`

```sql
CREATE TABLE clientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),  -- ✅ Auto generado
  cobrador_id UUID NOT NULL REFERENCES usuarios(id),
  nombre VARCHAR(255) NOT NULL,
  cedula VARCHAR(50) NOT NULL,
  telefono VARCHAR(50),
  direccion TEXT,
  monto_prestamo DECIMAL(15,2) NOT NULL,
  tipo_cobro VARCHAR(20) NOT NULL,
  cuotas_totales INTEGER NOT NULL,
  cuotas_pagadas INTEGER DEFAULT 0,
  valor_cuota DECIMAL(15,2) NOT NULL,
  saldo_pendiente DECIMAL(15,2) NOT NULL,
  fecha_inicio DATE NOT NULL,                      -- ✅ Requerido
  proximo_cobro DATE,                              -- ✅ DATE, no TIMESTAMP
  estado VARCHAR(20) DEFAULT 'activo',             -- ✅ Valores: activo, al_dia, atrasado, completado, renovado
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🎯 Campos Calculados en Frontend

Estos campos NO existen en la base de datos pero se calculan dinámicamente:

- `cuotas_pendientes` = `cuotas_totales - cuotas_pagadas`
- Estados mapeados: `'atrasado'` (DB) → `'mora'` (UI)

---

## 🚀 Estado Actual

✅ **RESUELTO**: Los clientes ahora se guardan correctamente  
✅ **RESUELTO**: Manejo de errores implementado  
✅ **RESUELTO**: Alertas informativas al usuario  
✅ **RESUELTO**: Logs para debugging  
✅ **RESUELTO**: Formato de fechas correcto (DATE)  
✅ **RESUELTO**: Estados mapeados correctamente  

---

## 🔍 Debugging

Si aún no funciona, revisa:

1. **Console del navegador** - Busca logs rojos
2. **Supabase Dashboard** → Table Editor → `clientes` - ¿Aparece el registro?
3. **Permisos RLS** - ¿Está deshabilitado o tiene políticas correctas?
4. **Usuario logueado** - ¿Tiene `user?.id` válido?

---

## 📝 Notas Importantes

⚠️ **Tipo Cliente vs DB**: El tipo TypeScript `Cliente` incluye campos calculados que no existen en DB (`cuotas_pendientes`)

⚠️ **Fechas**: DB usa tipo `DATE`, frontend usa ISO strings. Se convierten con `.split('T')[0]`

⚠️ **Estados**: DB usa `'atrasado'`, frontend muestra `'mora'`. Se mapean en `loadData()`

✅ **UUID**: Supabase genera el ID automáticamente, no lo enviamos en INSERT
