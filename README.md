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

## Gestion de usuarios

En `/users`, la tabla incluye las vinculaciones activas e inactivas de la
secretaria seleccionada. Un administrador puede editar un usuario inactivo,
cambiar su estado a Activo y guardar para reactivarlo.

Esta vista y el formulario usan `/responsables/gestion` y
`/responsables/gestion/{id}`; requieren actualizar tambien el backend.
Los selectores operativos siguen usando `/responsables/list`, que excluye
las vinculaciones inactivas. No se requiere migracion de base de datos.

## Cargas masivas y plantillas por proceso

1. Descargar la plantilla compartida desde la carga de nucleos. CARGA_ACTORES
   conserva exactamente sus 20 columnas y una fila por beneficiario.
   DETALLE_ACTAS contiene Grupo Acta, Numero Documento, Proyecto, Categoria,
   Producto, Cantidad y los datos de solicitud: una fila por producto.
   Repetir el documento del beneficiario y los datos del acta, no sus datos
   familiares. No todos los integrantes del nucleo necesitan productos.
   Cantidad tiene formato numerico y validacion de entero positivo.
2. Cargar primero los nucleos y sus beneficiarios.
3. En **Beneficiarios en proyectos > Carga masiva**, reutilizar el mismo archivo.
   Se lee DETALLE_ACTAS y se agrupa cada documento/proyecto; se ignoran productos,
   cantidades y observaciones de actas. No se asignan productos en este paso.
   Tambien se puede descargar una plantilla especifica con CARGA_ACTORES:
   Numero Documento, Proyecto y Observaciones (opcional).
   La fecha de inicio se asigna con la fecha del servidor al confirmar.
   El registro individual propone la fecha actual del navegador (ISO/UTC).
   Para compatibilidad, archivos anteriores pueden indicar Fecha Inicio
   Asociacion; si esta vacia o ausente se usa la fecha de confirmacion.
   Las filas repetidas del mismo beneficiario/proyecto se agrupan; las
   asociaciones existentes se rechazan, igual que en el registro individual.
4. En **Actas > Carga masiva**, reutilizar el archivo y su hoja DETALLE_ACTAS.
   Tambien se mantiene la plantilla especifica CARGA_ACTORES con Grupo Acta al inicio,
   Numero Documento, Proyecto, Categoria, Producto, Cantidad numerica,
   Fecha Solicitud, Ubicacion Entrega, Prioridad, Tipo Solicitud,
   Responsable Visita y Observaciones. Usar una fila por producto/cantidad y una
   Grupo Acta comun para los productos de una solicitud (por ejemplo SOL-001).
   No es el consecutivo oficial. Repetir sus
   datos generales en todas las filas y elegir el responsable en pantalla.

Los desplegables del Excel encadenan Proyecto, Categoria y Producto de la
secretaria activa. Solo muestran productos con stock positivo. La hoja
CATALOGO_OPERATIVO muestra el stock al descargar; se revalida al confirmar.
No escribir varios productos separados por comas. El archivo compartido conserva
CARGA_ACTORES para nucleos y DETALLE_ACTAS para asociaciones/actas, con listas
dependientes y nombres sin IDs; los productos muestran stock. Si DETALLE_ACTAS
existe, las cargas operativas siempre la leen: una hoja vacia o incompleta se reporta
como error, sin cambiar silenciosamente a CARGA_ACTORES. Las plantillas especificas
siguen funcionando con CARGA_ACTORES, incluidos archivos previos con IDs.
Los numeros de fila y la hoja de origen se muestran en la previsualizacion.
La carga de nucleos ignora DETALLE_ACTAS y las columnas adicionales de archivos previos.
Los nombres deben
ser unicos dentro de su proyecto/categoria para evitar selecciones ambiguas.
Fecha Solicitud es opcional: vacia usa la fecha del servidor al confirmar;
si se indica, usar AAAA-MM-DD (ejemplo 2026-11-05). Excel muestra esta ayuda
al seleccionar la celda y la vista permite elegir la fecha con calendario.
EJEMPLO_ACTAS ilustra dos productos de SOL-001 y otra acta SOL-002; no se importa.
El responsable se elige en pantalla.
Al confirmar actas, el resumen muestra solo la cantidad. La tabla paginada incluye
Acta creada junto a cada fila, con un enlace para abrirla en otra pestana sin perder
los filtros ni la pagina de la carga; las filas del mismo grupo
apuntan a la misma acta. La relacion proviene del registro persistido de la carga,
no del orden de los IDs. Tambien se consulta desde Gestionar cargas > Historial >
Ver detalle. Las asociaciones conservan solo la cantidad creada.
El selector se ubica justo antes de la tabla, despues de cargar el archivo;
seleccionarlo guarda y revalida la carga.
Prioridad se muestra como Alta, Media o Baja en Excel y en el selector de la vista;
el servidor normaliza a A/M/B y sigue aceptando esos codigos en archivos.
Al guardar correcciones, la vista tambien convierte las etiquetas a A/M/B.

Ambas cargas permiten previsualizar, corregir, quitar filas, guardar pendientes
durante 24 horas y consultar historial. Cada modulo tiene dos vistas separadas,
accesibles desde el menu lateral y su listado:

Las instrucciones ampliadas se muestran bajo "Ver instrucciones". La
previsualizacion incluye un resumen superior de errores agrupados por campo
y mensaje, con su cantidad, numeros de fila ordenados y documentos afectados.
Al pulsar un documento se aplica al filtro de busqueda; se conserva el detalle por fila.
En asociaciones y actas solo se solicita Numero Documento: el servidor identifica al
beneficiario vinculado a la secretaria y obtiene su tipo de documento registrado.
Los numeros ambiguos se reportan como error, sin elegir una persona arbitrariamente.
El selector de responsable de actas muestra solo su nombre, sin ID. Los cambios se guardan y
revalidan automaticamente tras 1,5 segundos sin editar (cada cambio reinicia
la espera); la confirmacion queda
bloqueada hasta recibir la validacion. Se mantiene el boton para reintentar.
La revalidacion muestra un indicador discreto sin indicar tiempos de espera al usuario ni bloquear los campos ni
reiniciar la pagina de la tabla. Las ediciones realizadas durante una consulta
se conservan y vuelven a validarse sin sobrescribirse con respuestas anteriores.
La vista de asociaciones no muestra fecha de inicio: se asigna al confirmar.
Proyecto, categoria y producto se eligen con selectores desplegables dependientes.
Las acciones se agrupan en cabeceras adaptables: en movil se apilan y la gestion
muestra cada carga como ficha. La previsualizacion mantiene su tabla con desplazamiento
horizontal dentro del panel, sin ensanchar la pagina.

- **Carga masiva**: descargar plantilla, subir Excel, corregir y confirmar.
- **Gestionar cargas**: pestanas Pendientes e Historial, busqueda, paginacion,
  eliminacion de pendientes y acceso a Continuar o Ver detalle.

En Proyectos > Beneficiarios, las rutas son
`/projects/add-beneficiary/importacion-masiva` y
`/projects/add-beneficiary/importacion-masiva/gestionar`.
En Actas son `/proceedings/importacion-masiva` y
`/proceedings/importacion-masiva/gestionar`. Continuar o Ver detalle abre
la carga seleccionada mediante `?importacionId=...`, sin subir otra vez el Excel.
Esta separacion de vistas no requiere cambios adicionales en la base de datos.

La confirmacion es completa o se
revierte: no se crean asociaciones o actas parciales. Las actas quedan en
Recibido (R), sin descontar ni reservar stock. El Grupo Acta no se puede
reutilizar en otra carga de la misma secretaria.

**Backend requerido:** aplicar manualmente `V018__importaciones_operativas.sql`
en la base correcta, con copia de seguridad y backend detenido, antes de
reiniciarlo. La aplicacion no ejecuta la migracion.
