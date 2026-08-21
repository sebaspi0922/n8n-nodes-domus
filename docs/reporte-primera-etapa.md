# Reporte de la primera etapa de `n8n-nodes-domus`

- Fecha de cierre: 20 de agosto de 2026
- Estado: vertical slice funcional y probado con Domus API 3.0
- Repositorio local: `/home/sebaspi/dev/n8n-nodes-domus`
- Rama: `feat/domus-dynamic-filters`
- Último commit funcional: `5129f59 feat: add dynamic property filters`

## Resumen ejecutivo

La primera etapa quedó funcional para el alcance definido: crear credenciales
de Domus, seleccionar el entorno, ejecutar `Inmueble → Buscar`, consultar
inmuebles reales y entregar cada inmueble como un item independiente que otros
nodos de n8n pueden consumir.

El nodo se probó de extremo a extremo en la instancia local de n8n con una
credencial real. Esta conclusión aplica a la operación implementada; no
significa que toda la API de Domus esté integrada ni que el paquete esté listo
para publicarse en npm.

## 1. Qué se implementó

- Proyecto TypeScript creado con el scaffolding oficial de `@n8n/node-cli`.
- Paquete preparado con el nombre `n8n-nodes-domus`.
- Nodo declarativo **Domus**, visible en el selector de nodos de n8n.
- Credencial **Domus API** con:
  - token secreto;
  - selección de **Pruebas** o **Producción**;
  - autenticación `Authorization: <token>`, sin `Bearer`;
  - prueba de credenciales contra `GET /general/countries`.
- Recurso **Inmueble**.
- Operación **Buscar** mediante `GET /properties`.
- Headers de Domus `Perpage`, `Inmobiliaria` y `Ficha`.
- Filtros iniciales por código, referencia, palabra clave, ciudad, tipo de
  inmueble, gestión, estrato, zona y barrio.
- Selectores dinámicos para ciudad, tipo de inmueble, gestión, zona y barrio.
- Entrada manual **Por Código** como alternativa a cada selector dinámico.
- Límite de resultados.
- Paginación automática mediante **Devolver Todos**.
- Extracción de la propiedad `data`: cada inmueble se convierte en un item de
  salida de n8n.
- Icono oficial de Domus adaptado a SVG para temas claro y oscuro.
- Tests automatizados, README, changelog, configuración de lint y build.

## 2. Archivos importantes

| Archivo                                    | Función                                                            |
| ------------------------------------------ | ------------------------------------------------------------------ |
| `package.json`                             | Metadata del paquete y comandos de desarrollo, build, lint y tests |
| `credentials/DomusApi.credentials.ts`      | Token, entornos, autenticación y prueba de credenciales            |
| `nodes/Domus/Domus.node.ts`                | Descripción principal y métodos del nodo Domus                     |
| `nodes/Domus/constants.ts`                 | URLs base y constantes compartidas                                 |
| `nodes/Domus/resources/property/search.ts` | Parámetros, routing, filtros, salida y paginación de inmuebles     |
| `nodes/Domus/methods/listSearch.ts`        | Carga dinámica de ciudades, tipos, gestiones, zonas y barrios      |
| `nodes/Domus/domus.svg`                    | Icono para tema claro                                              |
| `nodes/Domus/domus.dark.svg`               | Icono para tema oscuro                                             |
| `test/domus-node.test.js`                  | Pruebas automatizadas del nodo y las credenciales                  |
| `README.md`                                | Uso, desarrollo local, credenciales y estado del proyecto          |
| `.gitignore`                               | Exclusión de dependencias, build, variables locales y logs         |

## 3. Verificaciones realizadas

### Verificación automatizada

Pasaron correctamente:

```bash
npm install
npm run lint
npm run build
npm test
npm pack --dry-run --json
```

También se verificó:

- compilación TypeScript sin errores durante el modo watch;
- hot reload del Community Node;
- carga del nodo en n8n;
- salud de la instancia mediante `http://localhost:5678/healthz`;
- construcción de las URLs, headers y query params;
- uso del helper autenticado de n8n sin registrar manualmente el token;
- ausencia del prefijo `Bearer`;
- transformación de `data` en items independientes;
- conservación de filtros durante la paginación;
- endpoints auxiliares usados por los selectores dinámicos;
- empaquetado local del contenido necesario para npm.

Versiones verificadas en esta etapa:

- Node.js 24.19.0 para desarrollo;
- `@n8n/node-cli` 0.44.3;
- n8n 2.35.5.

El Node.js 26 instalado en el sistema no se utilizó para ejecutar n8n porque
`isolated-vm` 6.x no dispone del binding requerido para esa versión. El
proyecto fija Node 24 mediante `.node-version`.

### Verificación manual con Domus API

| Prueba                                     | Resultado                                             |
| ------------------------------------------ | ----------------------------------------------------- |
| Buscar inmuebles sin filtros adicionales   | 10 items reales                                       |
| Conectar un nodo `Edit Fields`             | Consumió `codpro`, `reference` y `city` correctamente |
| Usar `Límite = 3`                          | Exactamente 3 items                                   |
| Activar `Devolver Todos`                   | 115 items obtenidos recorriendo varias páginas        |
| Seleccionar Bogotá desde la lista dinámica | 3 inmuebles de Bogotá con el límite configurado       |

El token y las respuestas reales no se guardaron en el repositorio, fixtures,
documentación ni logs.

## 4. Qué no se probó todavía

- No se ejecutó una matriz completa con credenciales válidas separadas para
  **Pruebas** y **Producción**. Sí se comprobó la selección de entorno y una
  credencial que devolvió datos reales.
- Ciudad se comprobó manualmente. Tipo de inmueble, gestión, zona y barrio
  tienen cobertura automatizada, pero no todos se comprobaron manualmente con
  resultados reales porque algunas combinaciones no tenían inmuebles.
- La alternativa **Por Código** tiene cobertura estructural, pero falta una
  prueba manual dedicada.
- Falta verificar errores reales como token inválido, límites de tasa o caída
  temporal de Domus.
- Falta instalar el paquete en una instancia Docker limpia de n8n.
- Falta verificar el paquete con el proceso oficial para Community Nodes.
- El paquete no se ha publicado en npm ni enviado a revisión de n8n.
- No están implementados los demás recursos y operaciones de Domus API 3.0.

## 5. Comando que debe ejecutarse

Desde el directorio del proyecto y usando Node.js 24:

```bash
cd /home/sebaspi/dev/n8n-nodes-domus
npm run dev
```

No hace falta instalar n8n globalmente. El CLI compila el nodo, lo enlaza,
levanta la instancia local y activa la recarga durante el desarrollo.

## 6. URL que debe abrirse

```text
http://localhost:5678
```

## 7. Pasos exactos dentro de n8n

1. Crear o abrir un workflow.
2. Añadir un nodo y buscar **Domus**.
3. En **Credential**, crear o seleccionar unas credenciales **Domus API**.
4. Introducir el token en **Token**.
5. Elegir **Pruebas** o **Producción** en **Entorno**.
6. Guardar las credenciales. Se puede usar **Test credential** para comprobar
   que la API acepta el token.
7. En el nodo Domus, seleccionar:
   - **Resource:** `Inmueble`;
   - **Operación:** `Buscar`.
8. Elegir un **Límite** o activar **Devolver Todos**.
9. Configurar opcionalmente página, inmobiliaria completa, ficha y filtros.
10. Pulsar **Execute step**.
11. Comprobar que el panel de salida contiene un item por inmueble.
12. Conectar otro nodo, por ejemplo `Edit Fields`, y utilizar expresiones como:

```text
{{ $json.codpro }}
{{ $json.reference }}
{{ $json.city }}
```

## 8. Manejo del token

No es necesario entregar el token al código ni compartirlo por chat. Debe
introducirse únicamente en la interfaz de credenciales de n8n.

n8n lo guarda cifrado y el nodo lo añade automáticamente a cada petición como:

```text
Authorization: <token>
```

No debe escribirse `Bearer`, guardarse en `.env`, incluirse en tests ni
versionarse en Git.

## Estado de Git

Los avances funcionales quedaron organizados en commits locales. El commit que
cierra los filtros dinámicos y sus pruebas es:

```text
5129f59 feat: add dynamic property filters
```

No se realizó push a ningún remoto y no se publicó el paquete en npm.

## Próximos pasos recomendados

1. Probar manualmente tipo, gestión, zona, barrio y la entrada por código con
   combinaciones que tengan resultados.
2. Añadir la operación para obtener el detalle de un inmueble.
3. Preparar y ejecutar la instalación en una instancia Docker limpia.
4. Traducir la interfaz pública y la documentación al inglés antes de solicitar
   la verificación oficial de n8n.
5. Completar metadata, validación de publicación y revisión de seguridad.
6. Publicar `n8n-nodes-domus` en npm únicamente cuando esas verificaciones
   estén completas.
