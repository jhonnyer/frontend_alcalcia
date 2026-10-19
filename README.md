# Donaciones

Aplicacion frontend desarrollada con Angular 18.

## Requisitos

- Node.js compatible con Angular 18: `^18.19.1`, `^20.11.1` o `^22.0.0`.
- npm.
- Backend disponible para utilizar las funciones que consultan la API.

No es necesario instalar Angular CLI globalmente: los comandos de npm utilizan la version del proyecto.

## Instalacion

Desde la carpeta del proyecto:

```powershell
npm ci
```

Para agregar o actualizar dependencias y actualizar el archivo de bloqueo, utilizar `npm install`.

## Configuracion

Configurar la URL de la API en los archivos de entorno:

- Desarrollo: [environment.development.ts](src/environments/environment.development.ts).
- Produccion: [environment.ts](src/environments/environment.ts).

El servidor de desarrollo utiliza la configuracion de proxy de [proxy.conf.js](proxy.conf.js). Revisar su destino si cambia la direccion del backend.

## Ejecucion local

```powershell
npm start
```

Abrir http://localhost:4200/. Los cambios en el codigo se recargan automaticamente.

Para consultar la version local de Angular CLI:

```powershell
npm run ng -- version
```

## Compilacion para produccion

```powershell
npm run build
```

Los archivos generados se guardan en `dist/donaciones`.

Publicar el contenido de esa carpeta en un servidor web. Configurar el servidor para devolver `index.html` en las rutas de la aplicacion, de modo que la navegacion directa y la recarga de paginas funcionen.

## Compilacion de desarrollo

```powershell
npm run build -- --configuration development
```

Para recompilar automaticamente al modificar archivos:

```powershell
npm run watch
```
