/**
 * permissionsService.js
 * Maneja los permisos del dispositivo:
 *   - Notificaciones del sistema
 *   - Internet (se declara en AndroidManifest, no requiere solicitud)
 *   - PACKAGE_USAGE_STATS (uso de apps, solo Android, requiere activacion manual)
 */
import { Platform, Alert, Linking } from 'react-native';

// Importar notificaciones de forma segura
let Notifee = null;
let AuthorizationStatus = null;
try {
  const pkg = require('@notifee/react-native');
  Notifee = pkg.default;
  AuthorizationStatus = pkg.AuthorizationStatus;
} catch (_) {}

// ── Notificaciones ────────────────────────────────────────────────
export const requestNotificationPermission = async () => {
  if (!Notifee) {
    console.warn('[Permisos] @notifee/react-native no instalado');
    return false;
  }
  try {
    const settings = await Notifee.requestPermission();
    const granted =
      settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
      settings.authorizationStatus === AuthorizationStatus.PROVISIONAL;
    return granted;
  } catch (e) {
    console.warn('[Permisos] Error al solicitar notificaciones:', e.message);
    return false;
  }
};

export const checkNotificationPermission = async () => {
  if (!Notifee) return false;
  try {
    const settings = await Notifee.getNotificationSettings();
    return settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
           settings.authorizationStatus === AuthorizationStatus.PROVISIONAL;
  } catch { return false; }
};

// ── Crear canal de notificaciones (Android) ───────────────────────
export const createNotificationChannel = async () => {
  if (!Notifee || Platform.OS !== 'android') return;
  try {
    await Notifee.createChannel({
      id:          'timefocus_default',
      name:        'TimeFocus',
      description: 'Notificaciones de sesiones Pomodoro y tareas',
      sound:       'default',
      vibration:   true,
    });
  } catch (e) {
    console.warn('[Permisos] Error al crear canal:', e.message);
  }
};

// ── Mostrar notificacion local ────────────────────────────────────
export const showLocalNotification = async (title, body) => {
  if (!Notifee) return;
  try {
    await Notifee.displayNotification({
      title,
      body,
      android: {
        channelId: 'timefocus_default',
        smallIcon: 'ic_launcher',
        pressAction: { id: 'default' },
      },
    });
  } catch (e) {
    console.warn('[Notif] Error:', e.message);
  }
};

// ── PACKAGE_USAGE_STATS (solo Android) ───────────────────────────
// Este permiso NO se puede solicitar con un dialogo normal.
// El usuario debe activarlo manualmente en Ajustes del sistema.
// Esta funcion abre la pantalla correcta de ajustes.
export const openUsageStatsSettings = () => {
  if (Platform.OS !== 'android') return;
  Alert.alert(
    'Permiso de uso de aplicaciones',
    'Para mostrar cuanto tiempo usas cada app, necesitas activar el permiso manualmente:\n\n1. Abre Ajustes\n2. Ve a Aplicaciones o Privacidad\n3. Busca "Acceso al uso de datos"\n4. Activa el permiso para TimeFocus',
    [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Ir a Ajustes',
        onPress: () => {
          Linking.openSettings().catch(() => {
            Alert.alert('No se pudo abrir Ajustes', 'Abrelo manualmente y busca "Acceso al uso de datos".');
          });
        },
      },
    ]
  );
};

// ── Inicializar todos los permisos al arrancar la app ─────────────
export const initPermissions = async () => {
  await createNotificationChannel();
  const notifGranted = await requestNotificationPermission();
  if (notifGranted) {
    console.log('[Permisos] Notificaciones: autorizado');
  } else {
    console.log('[Permisos] Notificaciones: denegado o no disponible');
  }
};
