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
- paginación manual por página y filtros iniciales.

Cada inmueble de la propiedad `data` de Domus se entrega como un item separado
de n8n. Esto permite conectar la salida directamente con otros nodos. La
paginación automática con `Return All` y `Limit` queda prevista para una fase
posterior.

## Requisitos

- Node.js 24 LTS recomendado (rango soportado actualmente: `>=22.22.0 <26`)
- npm
- Git

No hace falta instalar n8n globalmente: `@n8n/node-cli` proporciona la
instancia local de desarrollo.

El proyecto fija Node `24.19.0` en `.node-version`, que es la versión LTS con
la que se verificó esta etapa. Node 26 todavía no es compatible con
`isolated-vm` 6.x, dependencia nativa usada por n8n 2.35.4 para evaluar
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

Esta etapa se verificó con `@n8n/node-cli` 0.44.3, n8n 2.35.4 y Node 24.19.0.

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
6. Configura página, resultados por página y los filtros que necesites.
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
- barrio y código de barrio.

Los campos de ciudad, tipo de inmueble y gestión aceptan por ahora códigos
manuales. En una fase posterior podrán migrar a búsquedas dinámicas usando los
endpoints auxiliares de Domus.

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

- [Domus API 3.0](https://apiv3get.domus.la/docs/3.0/)
- [Lista de inmuebles](https://apiv3get.domus.la/docs/3.0/inmuebles/lista)
- [Desarrollo de Community Nodes de n8n](https://docs.n8n.io/integrations/community-nodes/build-community-nodes/)
- [CLI oficial para nodos n8n](https://docs.n8n.io/connect/create-nodes/build-your-node/using-the-n8n-node-tool/)
