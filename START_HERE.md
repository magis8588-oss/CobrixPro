# 🚀 INICIO RÁPIDO - CobrixPro

## ✅ ¡Tu aplicación ya está lista!

El servidor está corriendo en: **http://localhost:5173**

---

## 🔐 Login

### Credenciales de Prueba (Modo Mock):

```
👨‍💼 ADMINISTRADOR
Email: admin@test.com
Password: admin123

👨‍💼 COBRADOR
Email: cobrador@test.com
Password: cobrador123
```

---

## 🎯 ¿Qué puedes hacer AHORA?

### Como Administrador:

1. **📊 Ver Dashboard**
   - Estadísticas de cobradores en tiempo real
   - Total recaudado vs metas
   - Rendimiento por cobrador

2. **👥 Gestionar Cobradores**
   - Agregar nuevos cobradores
   - Editar información
   - Cambiar roles
   - Activar/Desactivar

3. **⚙️ Configurar Interés**
   - Establecer tasa de interés global
   - Ver calculadora de ejemplo
   - Guardar configuración

---

## 🧪 Modo de Desarrollo Actual

**MODO MOCK ACTIVADO** 🟢

- ✅ Funciona SIN Supabase
- ✅ Funciona sin internet
- ✅ Datos de prueba incluidos
- ✅ Cambios persisten en navegador

### Ver el banner amarillo
En la parte superior de la app verás:
```
🧪 MODO DESARROLLO - Usando datos de prueba (Mock Data)
```

---

## 🔄 Cambiar entre Modos

### 📦 Modo Mock (Actual)
**Archivo `.env`:**
```env
VITE_DEV_MODE=mock
```

### ☁️ Modo Supabase
**Archivo `.env`:**
```env
VITE_DEV_MODE=supabase
VITE_SUPABASE_URL=tu_url_aqui
VITE_SUPABASE_ANON_KEY=tu_key_aqui
```

Después de cambiar el `.env`, reinicia:
```bash
npm run dev
```

---

## 📚 Documentación

- **`README.md`** - Documentación completa del proyecto
- **`MOCK_MODE.md`** - Sistema de datos de prueba explicado
- **`QUICK_START.md`** - Guía de inicio

---

## 🎨 Prueba la UI

### 1. Login
- Usa las credenciales de arriba
- Verás la pantalla de bienvenida

### 2. Explora el Dashboard
- Ve estadísticas de 3 cobradores
- Observa las métricas en tiempo real

### 3. Gestiona Cobradores
- Ve a la sección "Cobradores"
- Prueba agregar uno nuevo
- Cambia el estado de activo/inactivo
- Cambia roles

### 4. Configura Intereses
- Ve a "Configuración"
- Cambia la tasa de interés
- Observa el calculador de ejemplo actualizar en tiempo real

---

## 💾 Datos de Prueba Incluidos

### Cobradores Mock:
1. **Pedro Gómez** - Activo, 105% cumplimiento
2. **Ana Martínez** - Activo, 91% cumplimiento
3. **Carlos López** - Inactivo
4. **Lucía Rodríguez** - Activo, 69% cumplimiento

### Estadísticas:
- Total a recaudar: $13,300,000
- Total recaudado: $12,000,000
- Clientes nuevos: 25
- Rendimiento promedio: 88.6%

---

## 🐛 Solución Rápida de Problemas

### No veo el banner amarillo
- Verifica que el archivo `.env` tenga `VITE_DEV_MODE=mock`
- Reinicia el servidor: `Ctrl+C` y luego `npm run dev`

### No puedo hacer login
- Verifica las credenciales: `admin@test.com` / `admin123`
- Revisa la consola del navegador (F12)

### Los cambios no se guardan
- En modo mock, los cambios se guardan en localStorage
- Para resetear, borra el localStorage del navegador

---

## 🎉 ¡Listo para empezar!

**Siguiente paso:** Abre http://localhost:5173 y explora la aplicación

**¿Listo para Supabase?** Lee `README.md` sección "Configurar Base de Datos"

---

💡 **Tip:** Mantén las DevTools abiertas (F12) para ver los logs del modo mock
