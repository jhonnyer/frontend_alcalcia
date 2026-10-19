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

## Identidad institucional en los PDF

Los reportes de dashboard, proyectos, actores sociales y beneficiarios por proyecto
consultan `GET /parametros-negocio/contexto-institucional` con la sesion autenticada.
El backend devuelve la secretaria activa, sus parametros de negocio y el departamento
asignado. Los nombres se imprimen tal como estan configurados, normalizando espacios;
las etiquetas Alcaldia/Alcalde o Gobernacion/Gobernador dependen del tipo de secretaria,
no del tipo de proyecto.

Se utiliza el logo institucional guardado o, si no existe, el mismo logo predeterminado
del acta obtenido de `GET /parametros-negocio/logo-predeterminado`. Solo este ultimo se
conserva en memoria; los parametros se consultan en cada exportacion. Si falta la
configuracion institucional o falla su consulta, se informa el error sin generar un
reporte con datos de otra entidad. Si no hay departamento asignado, se omite ese dato.

Desplegar tambien el backend que incorpora el endpoint de contexto institucional.
Este ajuste no requiere una migracion adicional de base de datos.

El encabezado del menu tambien muestra `nombreAlcaldia` de los parametros de la
secretaria activa y se actualiza al guardar los parametros o cambiar de secretaria.
El nombre admite varias lineas; al pulsarlo se abre el inicio (el panel administrativo
para SUPERADMIN). Si falla la consulta, se muestra una opcion para reintentar.
