# 🧪 Sistema de Datos Mock para Desarrollo

## ¿Qué es esto?

He configurado tu aplicación para que pueda funcionar con **datos de prueba (mock data)** sin necesidad de conectarte a Supabase. Esto te permite:

- ✅ Desarrollar y probar la UI sin configurar base de datos
- ✅ Trabajar sin internet o conexión a servicios externos
- ✅ Cambiar fácilmente entre modo mock y modo producción
- ✅ Probar funcionalidades sin riesgo de alterar datos reales

## 🚀 Cómo Usar

### Modo Mock (Datos de Prueba) - **PREDETERMINADO**

Tu archivo `.env` ya está configurado así:

```env
VITE_DEV_MODE=mock
```

Con esto, la aplicación funciona **completamente sin Supabase**.

#### 📋 Credenciales de Prueba

**Administrador:**
- Email: `admin@test.com`
- Password: `admin123`

**Cobrador:**
- Email: `cobrador@test.com`
- Password: `cobrador123`

### Modo Supabase (Producción)

Cuando estés listo para conectarte a Supabase real:

1. **Configura tu archivo `.env`:**

```env
VITE_DEV_MODE=supabase
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_key_de_supabase
```

2. **Reinicia el servidor:**

```bash
npm run dev
```

## 📊 Datos de Prueba Incluidos

### Usuarios Mock
- **1 Admin**: Juan Administrador
- **4 Cobradores**: Pedro Gómez, Ana Martínez, Carlos López, Lucía Rodríguez

### Estadísticas Mock
- Metas de recaudación
- Totales recaudados
- Clientes nuevos
- Porcentajes de cumplimiento

### Configuración de Interés
- Tasa: 5.5%
- Descripción predefinida

## 🔄 Persistencia de Datos Mock

Los datos mock se guardan en **localStorage** del navegador, esto significa:

- ✅ Los cambios que hagas persisten entre recargas de página
- ✅ Puedes agregar, editar y eliminar cobradores
- ✅ Puedes cambiar la configuración de interés
- ❌ Los datos se pierden si limpias el localStorage del navegador

### Resetear Datos Mock

Para volver a los datos de prueba originales:

1. Abre las DevTools del navegador (F12)
2. Ve a la pestaña "Application" o "Almacenamiento"
3. Encuentra "Local Storage"
4. Elimina las siguientes claves:
   - `mockUser`
   - `mockCobradores`
   - `mockConfigInteres`
5. Recarga la página

## 🎨 Banner de Modo Desarrollo

Cuando estés en modo mock, verás un banner amarillo en la parte superior:

```
🧪 MODO DESARROLLO - Usando datos de prueba (Mock Data)
```

Este banner desaparece automáticamente cuando cambias a modo Supabase.

## 🔧 Arquitectura Técnica

### Archivos Modificados

1. **`src/lib/mockData.ts`**
   - Contiene todos los datos de prueba
   - Usuarios, cobradores, estadísticas, configuración

2. **`src/lib/supabase.ts`**
   - Detecta el modo actual (`mock` o `supabase`)
   - Crea cliente dummy en modo mock
   - Exporta `isMockMode` para componentes

3. **`src/contexts/AuthContext.tsx`**
   - Login mock con credenciales de prueba
   - Persistencia en localStorage

4. **Componentes Admin** (Overview, Collectors, InterestConfig)
   - Verifican `isMockMode`
   - Usan datos mock o Supabase según el modo
   - Simulan delays de API para realismo

5. **`src/components/DevModeBanner.tsx`**
   - Banner visual del modo actual

### Funcionamiento

```typescript
// En cada componente que consulta datos:

if (isMockMode) {
  // Cargar datos desde mockData.ts
  // Guardar cambios en localStorage
  await simulateDelay() // Simular latencia
} else {
  // Consultar Supabase normalmente
}
```

## 📝 Ejemplos de Uso

### Agregar un Cobrador (Modo Mock)

1. Login como admin
2. Ve a "Cobradores"
3. Haz clic en "Agregar Cobrador"
4. Completa el formulario
5. El cobrador se guarda en localStorage
6. Aparece inmediatamente en la lista

### Cambiar Configuración de Interés

1. Ve a "Configuración"
2. Cambia la tasa de interés
3. Guarda
4. Los cambios se reflejan en el calculador de ejemplo

## 🚦 Migración a Producción

### Paso 1: Desarrollo (Mock)
```env
VITE_DEV_MODE=mock
```
- Desarrolla toda la UI
- Prueba flujos de usuario
- No necesitas BD

### Paso 2: Testing (Supabase Dev)
```env
VITE_DEV_MODE=supabase
VITE_SUPABASE_URL=tu_proyecto_dev
VITE_SUPABASE_ANON_KEY=tu_key_dev
```
- Configura Supabase
- Ejecuta scripts SQL del README
- Prueba con datos reales

### Paso 3: Producción
```env
VITE_DEV_MODE=supabase
VITE_SUPABASE_URL=tu_proyecto_prod
VITE_SUPABASE_ANON_KEY=tu_key_prod
```
- Despliega a producción
- Usa variables de entorno del hosting

## 🎯 Ventajas de este Sistema

### Para Desarrollo
- ⚡ **Rápido**: No esperas APIs
- 🔒 **Offline**: Trabaja sin internet
- 🧪 **Seguro**: No alteras datos reales
- 🎨 **Enfoque en UI**: Desarrolla la interfaz primero

### Para Testing
- 📊 **Datos Consistentes**: Siempre los mismos datos de prueba
- 🔄 **Reproducible**: Fácil de resetear
- 🐛 **Debug Simple**: No hay errores de red

### Para Producción
- 🔀 **Fácil Switch**: Cambia en segundos entre modos
- 📦 **Sin Código Extra**: El código de producción no incluye mock
- 🚀 **Deploy Simple**: Solo cambiar variables de entorno

## ❓ Preguntas Frecuentes

### ¿Los datos mock se suben a producción?
No. El código mock solo se ejecuta si `VITE_DEV_MODE=mock`. En producción, configuras `VITE_DEV_MODE=supabase`.

### ¿Puedo agregar más datos de prueba?
Sí! Edita `src/lib/mockData.ts` y agrega lo que necesites.

### ¿Qué pasa si olvido cambiar a modo supabase?
La app mostrará el banner amarillo y verás datos de prueba. Es seguro, no rompe nada.

### ¿Funciona el realtime en modo mock?
No, el realtime es exclusivo de Supabase. En mock, los datos se actualizan solo cuando recargas.

## 🎉 Resumen

Tienes **DOS opciones** para trabajar:

1. **Modo Mock** (actual): Datos de prueba, sin necesidad de BD
2. **Modo Supabase**: Conexión real a la base de datos

**Recomendación**: Usa mock para desarrollo de UI y supabase cuando quieras probar con datos reales o desplegar.

---

¿Necesitas más datos de prueba o quieres modificar algo del sistema mock? ¡Avísame!
