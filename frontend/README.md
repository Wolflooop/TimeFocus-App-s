# TimeFocus Frontend

## Visión general

La carpeta `frontend` contiene las interfaces de usuario de TimeFocus para dos plataformas:

- `web-frontend`: frontend web basado en Node.js, Express, Pug y Tailwind CSS.
- `mobile-frontend`: frontend móvil construido con React Native.

Cada proyecto es independiente y tiene su propia configuración, dependencias y scripts.

## Estructura del directorio

```
frontend/
├── README.md
├── mobile-frontend/
│   ├── App.js
│   ├── index.js
│   ├── package.json
│   ├── src/
│   ├── android/
│   └── ...
└── web-frontend/
    ├── app.js
    ├── package.json
    ├── src/
    ├── views/
    ├── tailwind.config.js
    └── ...
```

## web-frontend

### Descripción

`web-frontend` es la aplicación web de TimeFocus. Utiliza Express para servir vistas `Pug`, Tailwind CSS para estilos y Axios para comunicarse con la API del backend.

### Características principales

- Interfaces de usuario para iniciar sesión y registrarse
- Gestión de tareas, sesiones y horario
- Vistas responsivas para escritorio y móvil
- Uso de sesiones de Express para mantener el estado del usuario

### Instalación y ejecución

```bash
cd frontend/web-frontend
npm install
npm run dev
```

Para construir CSS sin modo `watch`:

```bash
npm run build:css
```

Para iniciar en modo producción:

```bash
npm start
```

### Variables de entorno

Copia el archivo de ejemplo y configura las variables necesarias:

```bash
cd frontend/web-frontend
cp .env.example .env
```

## mobile-frontend

### Descripción

`mobile-frontend` es la aplicación móvil de TimeFocus construida con React Native. Proporciona la interfaz de usuario para dispositivos Android (y iOS si la configuras), consume la API móvil del backend y soporta sincronización offline.

### Características principales

- Autenticación con correo y Google
- Gestión de tareas y sesiones de estudio
- Visualización y sincronización de horarios
- Manejo de estados offline con sincronización posterior
- Uso de bibliotecas nativas como `react-native-community/netinfo` y `async-storage`

### Instalación y ejecución

```bash
cd frontend/mobile-frontend
npm install
npm run android
```

Para iniciar el servidor Metro:

```bash
npm start
```

## Requisitos comunes

- Node.js 18+ / npm 9+
- Para `web-frontend`: navegador moderno y backend corriendo
- Para `mobile-frontend`: entorno React Native configurado con Android Studio o Xcode

## Notas importantes

- Ambos frontends deben conectarse a su backend correspondiente mediante la URL y los endpoints correctos.
- Asegúrate de que las variables de entorno y la configuración de API estén sincronizadas con el backend.
- `mobile-frontend` usa React Native CLI, así que verifica la instalación de herramientas nativas antes de ejecutar en dispositivo/emulador.

## Enlaces rápidos

- `frontend/web-frontend`: proyecto web
- `frontend/mobile-frontend`: proyecto móvil

