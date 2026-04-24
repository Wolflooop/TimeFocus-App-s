# 📱 TimeFocus

**TimeFocus** es una aplicación móvil nativa para Android desarrollada en Kotlin, diseñada para mejorar la productividad académica de estudiantes universitarios mediante la integración de gestión de tareas, técnica Pomodoro y autenticación segura.

---

## 🚀 Características principales

### 🔐 Autenticación
- Registro de usuarios con validación de datos
- Inicio de sesión con email y contraseña
- Integración con Google Sign-In
- Persistencia de sesión
- Cierre de sesión seguro

### 📋 Gestión de Tareas
- Creación de tareas con:
  - Título
  - Materia
  - Fecha de entrega
  - Prioridad
- Cambio de estado:
  - `PENDING → IN_PROGRESS → DONE`
- Eliminación con confirmación
- Filtrado por categorías
- Soporte offline (uso de caché local)

### ⏱️ Temporizador Pomodoro
- Configuración de sesiones (5–60 minutos)
- Descansos cortos y largos
- Opciones:
  - AutoBreak
  - Sonido
  - Vibración
- Persistencia de configuración

### 📊 Dashboard
- Visualización de estadísticas
- Integración con configuración del Pomodoro

---

## 🏗️ Arquitectura

El sistema sigue el patrón:

- **MVVM (Model - View - ViewModel)**

### Capas:
- Presentación
- Dominio
- Datos

### Tecnologías utilizadas:
- Kotlin 1.9
- Jetpack (ViewModel, LiveData, Navigation)
- Retrofit (API REST)
- SharedPreferences (persistencia local)

---

## 🧪 Estrategia de Pruebas

Se implementan los siguientes tipos de pruebas:

- ✅ Pruebas positivas (Happy Path)
- ❌ Pruebas negativas
- 🔍 Validación de campos
- 🔗 Pruebas de integración

---

## 📌 Requerimientos

### ✔️ Funcionales (FRs)
- Registro e inicio de sesión
- Gestión completa de tareas
- Configuración de Pomodoro
- Visualización en Dashboard

### ⚙️ No Funcionales (NFRs)
- Compatibilidad con Android 11 y 13
- Soporte offline
- Arquitectura escalable
- Validación de datos

---

## 📏 Reglas de Negocio

- No se permiten campos vacíos en formularios
- Duración Pomodoro entre 5 y 60 minutos
- Flujo de estados de tareas obligatorio
- Confirmación para eliminar tareas
- Usuario autenticado para acceder al sistema

---

## 👤 Historias de Usuario

- Como usuario, quiero registrarme para usar la app
- Como usuario, quiero gestionar mis tareas
- Como usuario, quiero usar Pomodoro para estudiar
- Como usuario, quiero ver mi progreso
- Como usuario, quiero usar la app sin internet

---

## ⚠️ Riesgos Identificados

- Validación incorrecta de campos vacíos
- Falta de indicador visual en modo offline
- Ausencia de feedback en procesos de login

---

## 🛠️ Entorno de Desarrollo

- Android Studio Hedgehog
- Dispositivos:
  - Smartphone físico
  - Emulador (AVD)
- Android:
  - API 30 (Android 11)
  - API 33 (Android 13)

---



## 👥 Equipo de Desarrollo

- Diego Garrido Castillo
- Josué Olearte Hernández
- Samuel Ramírez Martínez

---

## 📚 Propósito

Este proyecto fue desarrollado como parte de la materia:

**Estándares y Métricas para el Desarrollo de Software**

---

## 📌 Notas Finales

TimeFocus presenta una arquitectura sólida, con separación de responsabilidades y enfoque en experiencia de usuario, permitiendo mejorar la productividad académica mediante herramientas integradas.

---