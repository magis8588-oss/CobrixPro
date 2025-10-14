# Correcciones de Cálculos y Fechas de Cobro

## Problemas Corregidos

### 1. ✅ Tasa de Interés del Admin
**Problema**: No se estaba aplicando la tasa de interés configurada por el administrador.

**Solución**: 
- El hook `useConfigInteres` ya estaba obteniendo la tasa correctamente desde Supabase
- Se corrigió la función `calcularCuotas` para usar correctamente `tasaInteres` del contexto
- Ahora el cálculo es: `montoTotal = montoPrestamo + (montoPrestamo * tasaInteres / 100)`

**Ejemplo**:
- Préstamo: $200,000
- Interés configurado: 20%
- Interés calculado: $40,000
- **Total a pagar: $240,000**

---

### 2. ✅ Cálculo del Total a Pagar
**Problema**: El cálculo del total no sumaba correctamente préstamo + interés.

**Solución**:
```typescript
// ANTES (incorrecto):
const montoConInteres = monto * (1 + tasa)  // Esto funciona pero no era claro

// AHORA (correcto y claro):
const montoInteres = monto * tasa
const montoTotal = monto + montoInteres
```

**Ahora se muestra claramente**:
- Monto del préstamo
- + Interés (%)
- = Total a pagar

---

### 3. ✅ Cobro Semanal con Calendario
**Problema**: Los cobros no respetaban:
- El mismo día de la semana
- Días festivos de Colombia
- Domingos

**Solución**: Se creó `fechasUtils.ts` con:

#### Funciones de Validación:
- `esFestivo(fecha)` - Verifica días festivos colombianos 2025
- `esDomingo(fecha)` - Verifica si es domingo
- `esDiaHabil(fecha)` - Combina ambas validaciones

#### Funciones de Cálculo:
- `obtenerSiguienteDiaHabil(fecha)` - Ajusta al siguiente día hábil
- `calcularPrimerCobro(tipoCobro)` - Calcula el primer cobro respetando calendario
- `calcularProximoCobro(fecha, tipoCobro)` - Calcula siguientes cobros

#### Ejemplo Cobro Semanal:
```
Préstamo otorgado: Miércoles 10 de octubre
Primer cobro: Miércoles 17 de octubre (misma día, próxima semana)

Si el 17 cae en festivo → Se ajusta al siguiente día hábil
Si el 17 cae en domingo → Se ajusta al lunes 18
```

#### Días Festivos 2025 Incluidos:
- 01 Enero - Año Nuevo
- 06 Enero - Reyes Magos
- 24 Marzo - San José
- 17-18 Abril - Semana Santa
- 01 Mayo - Día del Trabajo
- 02 Junio - Ascensión
- 23 Junio - Corpus Christi
- 01 Julio - Sagrado Corazón
- 20 Julio - Independencia
- 07 Agosto - Boyacá
- 18 Agosto - Asunción
- 13 Octubre - Día de la Raza
- 03 Noviembre - Todos los Santos
- 17 Noviembre - Independencia Cartagena
- 08 Diciembre - Inmaculada
- 25 Diciembre - Navidad

---

## Comportamiento por Tipo de Cobro

### Diario (24 cuotas)
- Primer cobro: Mañana (si es hábil)
- Siguientes: Cada día hábil
- Salta: Domingos y festivos automáticamente

### Semanal (10 cuotas)
- Primer cobro: Mismo día de la semana, próxima semana
- Siguientes: Cada 7 días (mismo día)
- Salta: Si cae en domingo o festivo → día hábil siguiente

**Ejemplo**:
```
Préstamo: Miércoles
Cobros: Miércoles, Miércoles, Miércoles... (cada semana)
```

### Quincenal (5 cuotas)
- Primer cobro: 15 días después
- Siguientes: Cada 15 días
- Salta: Si cae en domingo o festivo → día hábil siguiente

---

## Cambios en la UI

### Modal de Nuevo Cliente
Ahora muestra:
```
✅ Monto del préstamo: $200,000
✅ Interés (20%): +$40,000
✅ Total a pagar: $240,000
✅ Número de cuotas: 10
✅ Valor de cada cuota: $24,000
📅 Primer cobro: miércoles, 17 de octubre
🔄 Los cobros se programan cada semana el mismo día
⚠️ No se cobra domingos ni días festivos
```

### Modal de Renovar
Ahora muestra desglose claro:
```
⚠️ Deuda pendiente: $50,000
➕ Nuevo préstamo: $200,000
➖ Monto base: $250,000
➕ Interés (20%): $50,000
✅ Total a pagar: $300,000
```

---

## Pasos para Aplicar los Cambios

### 1. Ejecutar Script SQL
```sql
-- En Supabase SQL Editor, ejecutar:
d:\CobrixPro\insertar-config-interes.sql
```
Esto inserta una configuración inicial de 20% si no existe.

### 2. Configurar Tasa desde Admin
- Ir a "Configuración de Interés"
- Establecer la tasa deseada (ej: 20)
- Guardar

### 3. Crear Nuevo Cliente
- Los cálculos ahora usarán la tasa configurada
- Las fechas respetarán el calendario colombiano
- El preview mostrará toda la información clara

---

## Archivos Modificados

1. **`src/lib/fechasUtils.ts`** (NUEVO)
   - Utilidades para manejo de fechas
   - Validación de días hábiles
   - Cálculo de fechas de cobro

2. **`src/components/collector/Overview.tsx`**
   - Función `calcularCuotas` corregida
   - Integración con `fechasUtils`
   - UI mejorada con más información
   - Preview detallado en modales

3. **`src/components/admin/InterestConfig.tsx`**
   - Removido `updated_by` que causaba error
   - Simplificado manejo de configuración

4. **`insertar-config-interes.sql`** (NUEVO)
   - Script para insertar configuración inicial

---

## Testing

### Probar Tasa de Interés:
1. Admin: Cambiar tasa a 15%
2. Cobrador: Crear cliente con $100,000
3. Verificar: Total debe ser $115,000 (15% de interés)

### Probar Fechas:
1. Crear cliente un Miércoles con cobro semanal
2. Verificar: Primer cobro debe ser el siguiente Miércoles
3. Si ese Miércoles es festivo, debe ajustarse al siguiente día hábil

### Probar Renovación:
1. Cliente con deuda $50,000
2. Renovar con $100,000 nuevo
3. Verificar: Base $150,000 + interés configurado

---

## Notas Importantes

⚠️ **Días festivos**: Están hardcodeados para 2025. Para 2026 necesitarás actualizar el array en `fechasUtils.ts`

⚠️ **Zona horaria**: Todas las fechas usan hora local de Colombia

⚠️ **RLS**: Recuerda que RLS está deshabilitado en `usuarios`. Para producción considera habilitarlo con políticas apropiadas.

✅ **Real-time**: La configuración de interés se actualiza en tiempo real gracias a Supabase Realtime

✅ **Validación**: Todos los cálculos incluyen validación de montos positivos
