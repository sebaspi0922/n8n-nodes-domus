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

- Node.js 22.22.0 o superior
- npm
- Git

No hace falta instalar n8n globalmente: `@n8n/node-cli` proporciona la
instancia local de desarrollo.

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

## Recursos

- [Domus API 3.0](https://apiv3get.domus.la/docs/3.0/)
- [Lista de inmuebles](https://apiv3get.domus.la/docs/3.0/inmuebles/lista)
- [Desarrollo de Community Nodes de n8n](https://docs.n8n.io/integrations/community-nodes/build-community-nodes/)
- [CLI oficial para nodos n8n](https://docs.n8n.io/integrations/creating-nodes/build/n8n-node/)
