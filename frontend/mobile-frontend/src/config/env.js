// ─── Configuración de entorno ────────────────────────────────────
// Cambia API_URL según tu entorno:
//   Desarrollo local:  'http://TU_IP_LOCAL:3000/api'
//   Producción:        'https://tu-dominio.com/api'
//
// Para encontrar tu IP local en Windows: ipconfig → IPv4 Address
// Para encontrar tu IP local en Mac/Linux: ifconfig | grep inet

const ENV = {
  development: {
    API_URL: 'http://192.168.0.106:3000/api', // ← cambia esta IP por la tuya
  },
  production: {
    API_URL: 'https://api.timefocus.com/api', // ← URL de producción
  },
};

const getEnv = () => {
  if (__DEV__) return ENV.development;
  return ENV.production;
};

export default getEnv();
