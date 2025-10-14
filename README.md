# CobrixPro - Sistema de Gestión de Cobros

Sistema web full responsive e intuitivo para administrar y controlar cobros de cartera con dashboard para administradores y cobradores.

## 🚀 Tecnologías

- **Frontend**: React 18 + TypeScript
- **Routing**: React Router DOM v6
- **Styling**: Tailwind CSS
- **Backend**: Supabase (Auth + Database + Realtime)
- **Iconos**: Lucide React
- **Build Tool**: Vite

## 📋 Características

### Panel de Administrador
- ✅ **Dashboard con estadísticas en tiempo real**
  - Total recaudado vs meta
  - Rendimiento promedio de cobradores
  - Cobradores activos
  - Clientes nuevos
  - Tabla detallada de estadísticas por cobrador

- ✅ **Gestión de Cobradores**
  - Crear, editar y eliminar cobradores
  - Cambiar roles (admin/cobrador)
  - Activar/desactivar cobradores
  - Vista completa de información

- ✅ **Configuración de Interés**
  - Configurar tasa de interés global
  - Selección de moneda (COP, USD, EUR, MXN, ARS, CLP, PEN, BRL)
  - **Configuración centralizada**: Los cambios afectan inmediatamente a todos los cobradores
  - Prevenir cobros excesivos
  - Calculadora de ejemplo en tiempo real
  - Historial de cambios

### Panel de Cobrador
- ✅ **Dashboard Completo** (completamente funcional)
  - 📊 Vista general con estadísticas personales
  - ➕ **Gestión de clientes por cuotas**:
    - Crear nuevos clientes con planes de pago (diario/semanal/quincenal)
    - Cobros diarios: 24 cuotas
    - Cobros semanales: 10 cuotas
    - Cobros quincenales: 5 cuotas
  - � **Acciones de cobro**:
    - Registrar pago (actualiza cuotas y programa próximo cobro)
    - Marcar "No pagó" (cambia estado a mora)
    - Renovar préstamo (consolida deuda + nuevo monto cuando quedan ≤3 cuotas)
  - 💰 **Cálculo automático**:
    - Usa tasa de interés del administrador
    - Muestra moneda configurada por el admin
    - Vista previa de cuotas antes de crear cliente
  - 📜 Historial completo de transacciones
  - 🧮 Calculadora de intereses en tiempo real
  - 🔍 Búsqueda y filtros avanzados
  - 📱 Diseño completamente responsive

### Sistema de Autenticación
- ✅ Login con email/contraseña
- ✅ Rutas protegidas por rol
- ✅ Sesión persistente
- ✅ Redirección automática según rol

## 🛠️ Configuración

### 1. Instalar Dependencias

\`\`\`bash
npm install
\`\`\`

### 2. Elegir Modo de Desarrollo

#### 🧪 Opción A: Modo Mock (Recomendado para empezar)

**¡Ya está configurado!** La aplicación viene lista para usar con datos de prueba.

**Credenciales de prueba:**
- Admin: `admin@test.com` / `admin123`
- Cobrador: `cobrador@test.com` / `cobrador123`

Solo ejecuta:
\`\`\`bash
npm run dev
\`\`\`

✅ No necesitas configurar Supabase
✅ No necesitas base de datos
✅ Funciona offline
✅ Perfecto para desarrollo de UI

[Ver documentación completa del Modo Mock](./MOCK_MODE.md)

#### ☁️ Opción B: Modo Supabase (Para producción)

Cuando estés listo para usar base de datos real:

1. Crea un proyecto en [Supabase](https://supabase.com)
2. Edita tu archivo `.env`:
   \`\`\`env
   VITE_DEV_MODE=supabase
   VITE_SUPABASE_URL=tu_url_de_supabase
   VITE_SUPABASE_ANON_KEY=tu_anon_key_de_supabase
   \`\`\`

### 3. Configurar Base de Datos

Ejecuta el siguiente SQL en tu proyecto de Supabase:

\`\`\`sql
-- Tabla de usuarios
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'cobrador')),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de configuración de interés
CREATE TABLE configuracion_interes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tasa_interes DECIMAL(5,2) NOT NULL,
  descripcion TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

-- Vista de estadísticas por cobrador (ejemplo)
CREATE OR REPLACE VIEW estadisticas_cobradores AS
SELECT 
  u.id as cobrador_id,
  u.nombre as cobrador_nombre,
  COALESCE(SUM(c.meta_recaudacion), 0) as meta_recaudacion,
  COALESCE(SUM(c.total_recaudado), 0) as total_recaudado,
  COALESCE(COUNT(DISTINCT CASE WHEN c.created_at >= NOW() - INTERVAL '30 days' THEN c.id END), 0) as clientes_nuevos,
  COALESCE(COUNT(DISTINCT c.id), 0) as clientes_totales,
  CASE 
    WHEN COALESCE(SUM(c.meta_recaudacion), 0) > 0 
    THEN (COALESCE(SUM(c.total_recaudado), 0) / SUM(c.meta_recaudacion) * 100)
    ELSE 0 
  END as porcentaje_cumplimiento
FROM users u
LEFT JOIN clientes c ON c.cobrador_id = u.id
WHERE u.role = 'cobrador' AND u.activo = true
GROUP BY u.id, u.nombre;

-- Habilitar Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion_interes ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (ajusta según tus necesidades)
CREATE POLICY "Usuarios pueden ver su propio perfil" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins pueden ver todos los usuarios" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins pueden gestionar usuarios" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Función para crear usuario en tabla users después del registro
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, nombre, role, activo)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre', 'Usuario'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'cobrador'),
    true
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear usuario automáticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
\`\`\`

### 4. Crear Usuario Administrador

Desde el SQL Editor de Supabase o desde tu aplicación después del primer login:

\`\`\`sql
-- Primero registra el usuario en Supabase Auth
-- Luego actualiza su rol:
UPDATE users SET role = 'admin' WHERE email = 'tu@email.com';
\`\`\`

## 🚀 Ejecutar el Proyecto

### Modo Desarrollo
\`\`\`bash
npm run dev
\`\`\`

La aplicación estará disponible en `http://localhost:5173`

### Build para Producción
\`\`\`bash
npm run build
\`\`\`

### Preview de Producción
\`\`\`bash
npm run preview
\`\`\`

## 📱 Responsive Design

La aplicación está completamente optimizada para:
- 📱 Móviles (320px+)
- 📱 Tablets (768px+)
- 💻 Desktop (1024px+)
- 🖥️ Large Desktop (1280px+)

## 🎨 Paleta de Colores

- **Primary**: Azul (#0ea5e9 y variantes)
- **Success**: Verde
- **Warning**: Amarillo
- **Error**: Rojo
- **Neutral**: Grises

## 📦 Estructura del Proyecto

\`\`\`
CobrixPro/
├── src/
│   ├── components/
│   │   ├── admin/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── Overview.tsx
│   │   │   ├── Collectors.tsx
│   │   │   └── InterestConfig.tsx
│   │   └── ProtectedRoute.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── lib/
│   │   └── supabase.ts
│   ├── pages/
│   │   ├── admin/
│   │   │   └── Dashboard.tsx
│   │   ├── collector/
│   │   │   └── Dashboard.tsx
│   │   └── Login.tsx
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── public/
├── index.html
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── vite.config.ts
└── README.md
\`\`\`

## 🔐 Seguridad

- Autenticación con Supabase Auth
- Row Level Security (RLS) en tablas
- Rutas protegidas por rol
- Validación de datos en frontend y backend
- Variables de entorno para credenciales

## 🔧 Configuración Centralizada

El sistema cuenta con un hook personalizado `useConfigInteres` que garantiza que:

- ✅ **Todos los cobradores usan la misma tasa de interés** configurada por el administrador
- ✅ **La moneda es consistente** en todo el sistema
- ✅ **Los cambios son inmediatos**: cuando el admin modifica la configuración, se refleja automáticamente en todos los cálculos
- ✅ **Previene manipulación**: los cobradores no pueden modificar tasas manualmente
- ✅ **Persistencia**: en modo mock usa localStorage, en producción usa Supabase

### Uso del Hook

```typescript
import { useConfigInteres } from '@/hooks/useConfigInteres'

function MiComponente() {
  const { tasaInteres, monedaSymbol, monedaCode } = useConfigInteres()
  
  // Calcular interés
  const interes = monto * (tasaInteres / 100)
  const total = monto + interes
  
  return <div>{monedaSymbol}{total}</div>
}
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Próximas Funcionalidades

- [ ] Dashboard completo del cobrador
- [ ] Gestión de clientes
- [ ] Registro de pagos
- [ ] Reportes y exportación de datos
- [ ] Notificaciones en tiempo real
- [ ] Aplicación móvil nativa

## 📄 Licencia

Este proyecto es privado y confidencial.

## 👤 Autor

Desarrollado con ❤️ para CobrixPro

---

**Nota**: Este proyecto está en desarrollo activo. El dashboard del cobrador estará disponible una vez que el panel de administración esté completamente pulido y funcional.
# CobrixPro
