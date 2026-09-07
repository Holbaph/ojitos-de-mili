// supabase-config.js — reemplaza estos dos valores con los de TU proyecto de Supabase:
// Project Settings → API → "Project URL" y "anon public" key.
//
// Estos dos valores son públicos por diseño (se usan desde el navegador de cualquiera
// que abra la app); la seguridad real la dan las políticas RLS del esquema
// (supabase/schema.sql) — sin haber iniciado sesión, esas claves no permiten leer ni
// escribir nada.
let SUPABASE_URL = 'https://gbkrwzihzmbskpivagpn.supabase.co';
let SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdia3J3emloem1ic2twaXZhZ3BuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3ODEyNTEsImV4cCI6MjEwNDM1NzI1MX0.Lv0wCe9LiPGnjqH5SP4TUzSH_eKWbf8Bh9aAJazWmnQ';

let SUPABASE_CONFIGURADO = !SUPABASE_URL.includes('TU-PROYECTO') && !SUPABASE_ANON_KEY.includes('TU-ANON-KEY');

let supabaseClient = SUPABASE_CONFIGURADO
  ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// Llave pública del temporizador (avisos push cuando se cumple el tiempo del
// parche). También es pública por diseño — la privada vive solo como secreto
// de la Edge Function send-patch-reminders, nunca aquí. Si no la cambias, el
// botón "Activar avisos" simplemente queda oculto (ver js/core.js).
let VAPID_PUBLIC_KEY = 'BLtaYdh73__SEg262LZe_4rmEKRQJISAWU0VzEhh8GMJTqoWPX5QNFgRjldF0BWE0b3XJ3Og2tvIHrlvEhlxqts';
let PUSH_CONFIGURADO = !VAPID_PUBLIC_KEY.includes('TU-VAPID');
