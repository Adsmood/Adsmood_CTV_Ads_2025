# Adsmood CTV Ads 2025

Sistema profesional de edición y gestión de anuncios interactivos para CTV (Connected TV).

## Estructura del Proyecto

Este es un monorepo que contiene tres módulos principales:

1. **Frontend (Editor Interactivo)**
   - Editor visual tipo After Effects para CTV Ads
   - Sistema de layers profesional
   - Timeline con keyframes
   - Soporte para elementos interactivos
   - Drag & drop, redimensionamiento y rotación
   - Panel de propiedades en tiempo real

2. **Assets Service**
   - Servicio para gestión de archivos multimedia
   - Integración con Backblaze B2
   - Soporte para imágenes y videos

3. **Backend VAST API**
   - Generación de VAST 4.1 compatible con DV360
   - Almacenamiento de proyectos en PostgreSQL
   - Sistema de tracking para analytics

## Requisitos

- Node.js 18+
- PostgreSQL 14+
- Cuenta en Backblaze B2

## Configuración

### Frontend
```bash
cd frontend-cts-ad-editor
npm install
npm start
```

### Assets Service
```bash
cd assets-service
npm install
# Configura las variables en .env
npm start
```

### Backend VAST API
```bash
cd backend-vast-api
npm install
# Configura las variables en .env
npm run start:dev
```

## Integración con Plataformas CTV

### Roku
- Implementar RAF (Roku Advertising Framework)
- Usar BrightScript para interactividad
- Seguir guías de Roku para anuncios interactivos

### Amazon Fire TV
- Implementar IMA SDK
- Usar Android TV guidelines
- Soporte para Fire TV remote

### Apple TV
- Implementar TVML
- Usar TVMLKit JS
- Seguir HIG para tvOS

## Variables de Entorno

### Frontend
```
REACT_APP_BACKEND_URL=https://tu-backend.render.com
REACT_APP_ASSETS_URL=https://tu-assets.render.com
```

### Assets Service
```
B2_APPLICATION_KEY_ID=tu-key-id
B2_APPLICATION_KEY=tu-app-key
B2_BUCKET_ID=tu-bucket-id
B2_PUBLIC_URL=tu-public-url
```

### Backend VAST API
```
DATABASE_HOST=tu-db-host
DATABASE_PORT=5432
DATABASE_USERNAME=tu-username
DATABASE_PASSWORD=tu-password
DATABASE_NAME=tu-database
```

## Despliegue

El proyecto está configurado para ser desplegado en Render.com:

1. Frontend: Static Site
2. Assets Service: Web Service
3. Backend VAST API: Web Service + PostgreSQL

## Licencia

Propiedad de Adsmood - Todos los derechos reservados 