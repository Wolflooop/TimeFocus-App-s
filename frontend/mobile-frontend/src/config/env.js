
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
