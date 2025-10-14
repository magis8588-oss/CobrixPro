# 🚀 Guía Rápida de Inicio

## ✅ Aplicación Lista

Tu aplicación **CobrixPro** está completamente configurada y lista para usar.

## 📝 Pasos para Empezar

### 1️⃣ Configurar Supabase (IMPORTANTE)

Antes de usar la aplicación, necesitas configurar Supabase:

1. Ve a [https://supabase.com](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto
3. Copia la URL del proyecto y la clave anónima (Anon Key)
4. Crea un archivo `.env` en la raíz del proyecto:
   ```bash
   VITE_SUPABASE_URL=tu_url_aqui
   VITE_SUPABASE_ANON_KEY=tu_clave_aqui
   ```

### 2️⃣ Configurar la Base de Datos

En el SQL Editor de Supabase, ejecuta el script SQL que se encuentra en el archivo `README.md` (sección "Configurar Base de Datos").

Este script crea:
- ✅ Tabla de usuarios
- ✅ Tabla de configuración de interés
- ✅ Vistas de estadísticas
- ✅ Políticas de seguridad (RLS)
- ✅ Triggers automáticos

### 3️⃣ Crear tu Primer Usuario Admin

1. Registra un usuario en Supabase Auth o desde la aplicación
2. En el SQL Editor de Supabase, ejecuta:
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'tu@email.com';
   ```

### 4️⃣ Iniciar la Aplicación

```bash
npm run dev
```

La aplicación estará disponible en: **http://localhost:5173**

## 🎯 Funcionalidades Disponibles

### 👨‍💼 Dashboard de Administrador

**📊 Vista General (Dashboard)**
- Estadísticas en tiempo real de todos los cobradores
- Total recaudado vs meta
- Rendimiento promedio
- Cobradores activos
- Clientes nuevos

**👥 Gestión de Cobradores**
- Agregar nuevos cobradores
- Editar información
- Cambiar roles (Admin ↔ Cobrador)
- Activar/Desactivar usuarios
- Eliminar cobradores

**⚙️ Configuración de Interés**
- Establecer tasa de interés global
- Descripción de la configuración
- Calculadora de ejemplo en tiempo real
- Historial de cambios

### 👨‍💼 Dashboard de Cobrador
- 🔄 Próximamente (placeholder implementado)

## 📱 Diseño Responsive

La aplicación funciona perfectamente en:
- 📱 Móviles (desde 320px)
- 📱 Tablets (desde 768px)
- 💻 Desktop (desde 1024px)

## 🎨 Características del Diseño

- ✅ **Moderna e Intuitiva**: Interfaz limpia con Tailwind CSS
- ✅ **Menú Lateral Responsive**: Se convierte en menú hamburguesa en móvil
- ✅ **Actualizaciones en Tiempo Real**: Gracias a Supabase Realtime
- ✅ **Feedback Visual**: Loaders, mensajes de éxito/error
- ✅ **Protección de Rutas**: Solo usuarios autorizados pueden acceder

## 🔐 Credenciales de Prueba

Después de configurar Supabase y crear tu primer admin, puedes:

1. **Login como Admin:**
   - Email: el que configuraste
   - Password: el que estableciste

2. **Crear Cobradores:**
   - Desde el panel de admin → Cobradores → Agregar Cobrador

## 📚 Comandos Útiles

```bash
# Desarrollo
npm run dev

# Build para producción
npm run build

# Preview de producción
npm run preview

# Lint
npm run lint
```

## 🆘 Solución de Problemas

### Error: "Cannot find module '@supabase/supabase-js'"
```bash
npm install
```

### Error de variables de entorno
Asegúrate de tener el archivo `.env` con las credenciales correctas.

### No puedo hacer login
1. Verifica que Supabase esté configurado
2. Verifica que el usuario exista en la tabla `users`
3. Revisa la consola del navegador para más detalles

## 📖 Más Información

Lee el archivo `README.md` completo para:
- Estructura detallada del proyecto
- Scripts SQL completos
- Configuración de seguridad
- Próximas funcionalidades

## 🎉 ¡Listo!

Tu sistema de gestión de cobros está listo. Disfruta usando **CobrixPro**! 🚀
