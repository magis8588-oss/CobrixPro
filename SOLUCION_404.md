# Solución Error 404 en Render

## Problema
Cuando recargas cualquier ruta (como /admin, /collector, etc.), Render devuelve 404 porque busca archivos físicos que no existen en una SPA.

## Solución: Configurar Rewrites en Render Dashboard

### Pasos en Render.com:

1. **Ve a tu servicio en Render Dashboard**
   - https://dashboard.render.com
   - Selecciona tu servicio "cobrixpro"

2. **Ve a Settings → Redirects/Rewrites**
   - O busca la sección "Rewrite Rules"

3. **Agrega la siguiente regla:**
   ```
   Source: /*
   Destination: /index.html
   Action: Rewrite
   ```

4. **Guarda y redeploy**

### ¿Por qué es necesario?
- React Router maneja las rutas en el cliente
- El servidor necesita servir `index.html` para TODAS las rutas
- `_redirects` funciona en Netlify, pero Render requiere configuración manual

### Alternativa si no hay opción de Rewrites:

Si no encuentras la opción de Rewrites en Render, usa **Netlify** en su lugar:

1. Crea cuenta en https://netlify.com
2. Conecta tu repositorio de GitHub
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Netlify detectará automáticamente el archivo `_redirects`

**Los archivos ya están configurados para Netlify también.**

### Archivos creados:
- ✅ `public/_redirects` - Para Netlify
- ✅ `public/_headers` - Headers de seguridad
- ✅ `render.yaml` - Configuración de Render (pero requiere setup manual)
