import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validar que las credenciales estén configuradas
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '❌ Faltan credenciales de Supabase.\n' +
    '💡 Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu archivo .env'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Log de conexión
// console.log(`☁️ Conectado a Supabase: ${supabaseUrl}`)
