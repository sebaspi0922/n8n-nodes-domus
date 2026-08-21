# n8n-nodes-domus

Community Node de n8n para integrar workflows con **Domus CRM** mediante
Domus API 3.0.

> Estado: desarrollo inicial. El paquete todavía no está publicado en npm ni
> debe considerarse estable.

## Estado actual

Esta primera versión implementa:

- credencial `Domus API` con token protegido;
- entornos de Pruebas y Producción;
- prueba de credenciales contra `GET /general/countries`;
- recurso `Inmueble`;
- operación `Buscar`, que consume `GET /properties`;
- límite de resultados y paginación automática con `Devolver Todos`;
- página inicial y filtros iniciales;
- selectores dinámicos para ciudad, tipo, gestión, zona y barrio, con entrada
  manual de códigos como alternativa.

Cada inmueble de la propiedad `data` de Domus se entrega como un item separado
de n8n. Esto permite conectar la salida directamente con otros nodos.

La búsqueda y el encadenamiento de su salida se validaron manualmente contra
Domus API con inmuebles reales: el nodo entregó 10 items y un nodo
`Edit Fields` posterior pudo consumir `codpro`, `reference` y `city`. Esta
comprobación no almacena el token ni datos de la respuesta en el repositorio.
También se validó la paginación real: `Límite = 3` entregó exactamente 3 items
y `Devolver Todos` reunió 115 items a través de varias páginas. El selector
dinámico de ciudad se validó eligiendo Bogotá y devolvió tres inmuebles reales
al aplicar ese límite.

## Requisitos

- Node.js 24 LTS recomendado (rango soportado actualmente: `>=22.22.0 <26`)
- npm
- Git

No hace falta instalar n8n globalmente: `@n8n/node-cli` proporciona la
instancia local de desarrollo.

El proyecto fija Node `24.19.0` en `.node-version`, que es la versión LTS con
la que se verificó esta etapa. Node 26 todavía no es compatible con
`isolated-vm` 6.x, dependencia nativa usada por n8n 2.35.x para evaluar
expresiones. Usa Node 24 con tu gestor de versiones antes de ejecutar el modo
de desarrollo; no se recomienda desactivar el aislamiento de expresiones como
solución permanente.

## Desarrollo local

```bash
npm install
npm run dev
```

El comando compila el paquete, enlaza el Community Node, levanta n8n con
recarga durante el desarrollo y lo expone en:

```text
http://localhost:5678
```

La primera vez, n8n puede pedir crear el usuario propietario de la instancia
local.

Comprobaciones disponibles:

```bash
npm run lint
npm run build
npm test
```

Esta etapa se verificó con `@n8n/node-cli` 0.44.3, n8n 2.35.5 y Node 24.19.0.

## Credenciales

En n8n, crea unas credenciales de tipo `Domus API` y completa:

- **Token**: token entregado por Domus. Se guarda cifrado por n8n y se envía
  directamente como `Authorization: <token>`, sin el prefijo `Bearer`.
- **Entorno**:
  - **Pruebas**: `https://newapi.domus.la`
  - **Producción**: `https://api.domus.la/3.0`

El mismo token puede utilizarse en ambos entornos. Domus reinicia los datos del
entorno de pruebas el primer día de cada mes; para consultar inmuebles reales,
selecciona Producción.

No guardes tokens en el repositorio, archivos `.env`, fixtures, logs o capturas.

## Uso

1. Ejecuta `npm run dev` y abre `http://localhost:5678`.
2. Crea o abre un workflow.
3. Añade el nodo **Domus**.
4. Selecciona las credenciales `Domus API`.
5. Elige `Inmueble` como recurso y `Buscar` como operación.
6. Elige entre un límite de resultados o `Devolver Todos`, y configura la
   página inicial y los filtros que necesites.
7. Ejecuta el nodo.

## Operaciones

### Inmueble → Buscar

Consulta `GET /properties` con los headers propios de Domus (`Perpage`,
`Inmobiliaria` y `Ficha`) y filtros opcionales por query string:

- código del inmueble;
- referencia;
- palabra clave;
- ciudad;
- tipo de inmueble;
- gestión;
- estrato;
- zona;
- barrio por nombre o código.

Con `Devolver Todos` desactivado, `Límite` controla tanto el máximo de items
como el tamaño solicitado a Domus. Al activarlo, el nodo sigue automáticamente
`current_page` y `last_page`; `Resultados Por Página` permite controlar el
tamaño de cada petición. En ambos modos, `Página` indica desde dónde comenzar.
Los filtros se conservan en todas las páginas.

Ciudad, tipo de inmueble, gestión, zona y barrio consultan los endpoints
`/search` de Domus para mostrar únicamente opciones que tienen inmuebles en la
sucursal o inmobiliaria seleccionada. Cada campo permite cambiar a `Por Código`
para introducir uno o varios códigos separados por comas. Zona y barrio se
acotan a la ciudad seleccionada cuando corresponde.

## Docker

Docker no es requisito para el desarrollo. El build genera `dist/`, que es la
base para empaquetar el Community Node y probar posteriormente esta secuencia:

```text
paquete compilado → n8n Docker limpio → instalación → workflow → Domus API
```

## Publicación futura

La interfaz y este README están en español para este primer vertical slice.
Antes de solicitar la verificación oficial como Community Node habrá que
traducir el contenido visible al inglés, tal como exigen actualmente las
reglas de verificación de n8n, y completar la prueba de instalación en una
instancia Docker limpia.

## Recursos

- [Reporte de la primera etapa](docs/reporte-primera-etapa.md)
- [Domus API 3.0](https://apiv3get.domus.la/docs/3.0/)
- [Lista de inmuebles](https://apiv3get.domus.la/docs/3.0/inmuebles/lista)
- [Desarrollo de Community Nodes de n8n](https://docs.n8n.io/integrations/community-nodes/build-community-nodes/)
- [CLI oficial para nodos n8n](https://docs.n8n.io/connect/create-nodes/build-your-node/using-the-n8n-node-tool/)
