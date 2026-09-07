// auth.js — sesión de cuenta vía Supabase Auth (email/contraseña). Las cuentas se
// crean/invitan desde el panel de Supabase (Authentication → Users → Invite user),
// no hay registro público dentro de la app. El primer usuario creado queda como
// 'admin' automáticamente (ver supabase/schema.sql); solo el admin puede invitar
// gente nueva, y eso lo hace desde ese mismo panel — la app se lo recuerda.

const Auth = {
  async getSession() {
    if (!supabaseClient) return null;
    const { data, error } = await supabaseClient.auth.getSession();
    if (error) { console.error(error); return null; }
    return data.session;
  },

  async login(email, password) {
    if (!supabaseClient) throw new Error('Supabase no está configurado (revisa js/supabase-config.js)');
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.session;
  },

  async logout() {
    if (!supabaseClient) return;
    await supabaseClient.auth.signOut();
  },

  async pedirRecuperacion(email) {
    if (!supabaseClient) throw new Error('Supabase no está configurado');
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + window.location.pathname,
    });
    if (error) throw error;
  },

  // Se usa tanto para el enlace de "olvidé mi contraseña" como para el primer
  // ingreso tras aceptar una invitación (ambos abren la app con una sesión de
  // tipo recovery/invite y hay que fijar contraseña antes de seguir).
  async fijarContrasena(password) {
    if (!supabaseClient) throw new Error('Supabase no está configurado');
    const { error } = await supabaseClient.auth.updateUser({ password });
    if (error) throw error;
  },

  async getPerfil(userId) {
    if (!supabaseClient) return null;
    const { data, error } = await supabaseClient
      .from('profiles')
      .select('id, email, nombre, role, created_at')
      .eq('id', userId)
      .maybeSingle();
    if (error) { console.error(error); return null; }
    return data;
  },

  async listarPerfiles() {
    if (!supabaseClient) return [];
    const { data, error } = await supabaseClient
      .from('profiles')
      .select('id, email, nombre, role, created_at')
      .order('created_at', { ascending: true });
    if (error) { console.error(error); return []; }
    return data;
  },

  async actualizarNombre(userId, nombre) {
    if (!supabaseClient) return;
    const { error } = await supabaseClient.from('profiles').update({ nombre }).eq('id', userId);
    if (error) throw error;
  },
};
