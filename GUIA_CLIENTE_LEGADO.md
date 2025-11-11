# Guía: Crear Cliente Legado (Migración desde Papel)

## 📋 ¿Qué es un Cliente Legado?

Un cliente legado es un préstamo que ya existe en papel y quieres migrar al sistema digital manteniendo el historial de pagos.

## 🔧 Cómo Crear un Cliente Legado

### Paso 1: Acceder al formulario
1. Ve a **Admin → Clientes**
2. Click en **"+ Crear Cliente (Legado)"**

### Paso 2: Llenar el formulario

#### Datos del Cliente
- **Nombre Completo*** (obligatorio)
- **Cédula*** (obligatorio)
- **Teléfono** (opcional)
- **Dirección** (opcional)

#### Datos del Préstamo
- **Monto del Préstamo*** (obligatorio): El monto original del préstamo
- **Tipo de Cobro**: 
  - Diario (24 cuotas)
  - Semanal (4 cuotas)
  - Quincenal (2 cuotas)

#### Datos de Seguimiento
- **Cuotas pagadas**: Número de cuotas que YA ha pagado el cliente
  - Ejemplo: Si ya pagó 5 cuotas de 24, pones "5"
- **Fecha inicio (YYYY-MM-DD)**: La fecha original del préstamo
  - Ejemplo: 2025-10-01 (si el préstamo empezó el 1 de octubre)
- **Próximo cobro (Opcional)**: 
  - Si lo dejas vacío, el sistema lo calcula automáticamente
  - Se calcula: Fecha inicio + (cuotas pagadas × periodicidad)

#### Asignación
- **Asignar Cobrador**: Selecciona el cobrador responsable

## 🧮 Cómo Funciona el Cálculo Automático

### Ejemplo 1: Préstamo Diario
```
Fecha inicio: 2025-11-01
Tipo de cobro: Diario
Cuotas pagadas: 10
Cuotas totales: 24

Cálculo automático:
- Próximo cobro = 2025-11-01 + 10 días = 2025-11-11
- Cuotas pendientes = 24 - 10 = 14
- Saldo pendiente = Valor cuota × 14
- Estado = "Al Día" (si el próximo cobro no ha pasado)
```

### Ejemplo 2: Préstamo Semanal
```
Fecha inicio: 2025-10-15
Tipo de cobro: Semanal
Cuotas pagadas: 2
Cuotas totales: 4

Cálculo automático:
- Próximo cobro = 2025-10-15 + (2 × 7 días) = 2025-10-29
- Cuotas pendientes = 4 - 2 = 2
- Estado = "Mora" (si hoy es después del 2025-10-29)
```

### Ejemplo 3: Préstamo Quincenal
```
Fecha inicio: 2025-09-01
Tipo de cobro: Quincenal
Cuotas pagadas: 1
Cuotas totales: 2

Cálculo automático:
- Próximo cobro = 2025-09-01 + (1 × 15 días) = 2025-09-16
- Cuotas pendientes = 2 - 1 = 1
- Estado = Depende de la fecha actual
```

## 📊 Estados del Cliente

El sistema determina automáticamente el estado:

- **Al Día**: El próximo cobro es hoy o está en el futuro
- **Mora**: El próximo cobro ya pasó y no se ha registrado pago
- **Completado**: Todas las cuotas están pagadas

## ⚠️ Notas Importantes

1. **Cuotas Pagadas**: Es crucial ingresar el número correcto de cuotas ya pagadas
2. **Fecha de Inicio**: Usa la fecha original del préstamo en papel
3. **Próximo Cobro Manual**: Solo úsalo si necesitas una fecha específica diferente al cálculo automático
4. **Validación**: El sistema NO permite crear un cliente con la misma cédula si ya tiene un préstamo activo

## 💡 Consejos

- Revisa tus registros en papel antes de migrar
- Migra cliente por cliente para evitar errores
- Verifica que el "Próximo cobro" calculado sea correcto
- Si un cliente está atrasado en papel, el sistema lo detectará automáticamente

## 🎯 Flujo Recomendado de Migración

1. **Preparación**:
   - Organiza tus papeles por cobrador
   - Identifica: Nombre, cédula, monto, tipo, cuotas pagadas, fecha inicio

2. **Migración**:
   - Crea el cliente legado con los datos
   - Verifica que el próximo cobro sea correcto
   - Asigna el cobrador correspondiente

3. **Verificación**:
   - Revisa en el dashboard del cobrador
   - Confirma que aparezca en "Cobros Programados para Hoy" si corresponde
   - Verifica que el estado sea correcto

4. **Continuación**:
   - A partir de ahí, el cobrador usa el sistema normalmente
   - Los pagos se registran digitalmente
   - El historial se mantiene actualizado

## 📱 Ejemplo Práctico Completo

**Situación**: Cliente "Juan Pérez" tiene un préstamo de $200.000 diario desde el 1 de noviembre. Ya pagó 8 cuotas.

**Formulario**:
```
Nombre: Juan Pérez
Cédula: 1234567890
Teléfono: 3001234567
Dirección: Calle 10 #20-30
Monto del Préstamo: 200000
Tipo de Cobro: Diario (24 cuotas)
Cuotas pagadas: 8
Fecha inicio: 2025-11-01
Próximo cobro: (vacío - se calcula auto)
Cobrador: María García
```

**Resultado**:
```
Cuota diaria: $10.000
Cuotas totales: 24
Cuotas pagadas: 8
Cuotas pendientes: 16
Saldo pendiente: $160.000
Próximo cobro: 2025-11-09 (1 nov + 8 días)
Estado: Mora (si hoy es 11 de noviembre)
```

Ahora Juan Pérez está en el sistema y María puede continuar cobrándole digitalmente.
