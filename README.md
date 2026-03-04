# Node Mongo Extractor Engine

Motor backend de extracción de información basado en Node.js, MongoDB y arquitectura modular.

El objetivo actual es construir un sistema de extracción desacoplado, extensible y controlado, evitando scraping agresivo y priorizando diseño sólido.

---

## Stack

* Node.js 20
* Express
* MongoDB 7
* Mongoose
* Axios
* Cheerio
* Playwright
* p-limit
* Docker + Docker Compose

---

## Filosofía del Proyecto

Este proyecto no busca volumen de scraping, sino:

* Arquitectura clara
* Separación de responsabilidades
* Control de concurrencia
* Persistencia coherente
* Base extensible para motor de extracción configurable

Está diseñado para poder pivotar de "extractor de contactos" a "motor genérico de extracción".

---

## Arquitectura Modular

```text
src/
  modules/
    auth/

    search/
      search.model.js
      contact.model.js
      search.service.js
      searchResolver.service.js
      providers/
        duckduckgo.provider.js
        bing.provider.js

    scraper/
      scraper.service.js
      httpScraper.service.js
      browserScraper.service.js
      domainStrategy.model.js
      extractors/
        email.extractor.js
        phone.extractor.js
```

---

## Responsabilidades de Módulos

### auth/

Encargado exclusivamente de autenticación y JWT.

Responsabilidades:

* Registro de usuario
* Login
* Generación de tokens
* Middleware de autenticación

---

### search/

Responsable de la **gestión de búsquedas y cache lógica**.

Funciones:

* Gestión de queries
* Cache común
* TTL de resultados
* Control de estado (`processing / idle`)
* Persistencia en MongoDB
* Resolución de URLs a partir de una query

No conoce detalles internos del scraping.

---

### searchResolver

El resolver transforma una query en una lista de URLs candidatas.

Funciona mediante **providers de motores de búsqueda**.

Ejemplo:

```text
query
   ↓
providers (duckduckgo / bing)
   ↓
overfetch de resultados
   ↓
normalización
   ↓
deduplicado
   ↓
limit
   ↓
lista de URLs
```

Esto permite cambiar o añadir motores sin modificar la lógica del scraper.

---

### scraper/

Responsable de **descargar páginas y ejecutar extractores**.

No conoce modelos ni lógica de negocio.

Flujo:

```text
urls
 ↓
http scrape
 ↓
si falla → browser scrape
 ↓
parse HTML
 ↓
extractores
 ↓
datos estructurados
```

---

## Estrategia Adaptativa de Scraping

El sistema aprende automáticamente qué estrategia funciona mejor para cada dominio.

Se guarda en Mongo:

```text
domain
preferredStrategy
lastUpdatedAt
```

Flujo:

1. Se intenta scraping HTTP.
2. Si falla o requiere JS → se usa navegador (Playwright).
3. Se guarda la estrategia preferida para ese dominio.
4. Futuras requests usan directamente la estrategia correcta.

Esto reduce overhead y mejora rendimiento.

---

## Flujo de una Búsqueda

1. Usuario autenticado llama `/search?q=...`
2. Se normaliza la query.
3. Se busca en Mongo.

Si no existe:

* Se crea con status `"processing"`.

Si existe:

* Se evalúa expiración (TTL).

Si está expirado:

* Se lanza scraping en background.

La respuesta al cliente es **inmediata y no bloqueante**.

El scraping se ejecuta asincrónicamente mediante:

```js
setImmediate()
```

---

## Control de Concurrencia

Se evita scraping duplicado mediante:

```js
if (isExpired && search.status !== "processing")
```

Esto garantiza:

* No se lanzan múltiples scrapers para la misma query
* Consistencia bajo concurrencia

Además, el scraper usa `p-limit` para limitar concurrencia de requests externas.

---

## Persistencia y Consistencia

Índice anti-duplicados en `contact.model.js`:

```js
contactSchema.index(
  { email: 1, searchId: 1 },
  { unique: true }
);
```

Esto evita insertar el mismo contacto varias veces para la misma búsqueda.

---

## Estrategia de Refresh

Actualmente el refresco funciona como **snapshot**:

1. Se eliminan contactos previos
2. Se insertan resultados nuevos

La arquitectura está preparada para evolucionar a **estrategia incremental**.

---

## TTL y Refresh

Ventana configurable mediante variable de entorno:

```text
SCRAPE_REFRESH_HOURS
```

Si una búsqueda supera esa ventana:

* Se devuelve contenido actual
* Se marca como `"processing"`
* Se ejecuta refresh en background

La API expone:

```json
{
  "status": "processing | idle",
  "refreshing": true,
  "total": number,
  "data": []
}
```

---

## Scraper Engine

El scraper está desacoplado y funciona así:

1. Recibe lista de URLs
2. Descarga HTML con Axios
3. Parsea con Cheerio
4. Ejecuta extractores especializados
5. Devuelve resultados estructurados

Extractores actuales:

* Email extractor
* Phone extractor (preparado)

Se pueden añadir nuevos extractores sin modificar el servicio de búsqueda.

---

## Autenticación

* Registro y login con JWT
* Endpoints protegidos mediante middleware
* La aplicación no es pública

---

## Características Técnicas Relevantes

* Respuesta no bloqueante
* Background processing
* Control de concurrencia
* Índices únicos en MongoDB
* Arquitectura modular
* Estrategia adaptativa HTTP / Browser
* Preparado para:

  * robots.txt
  * monitorización futura
  * extractores configurables
  * múltiples tipos de datos

---

### Estado Actual

El sistema actualmente:

* Resuelve URLs a partir de queries mediante motores de búsqueda
* Extrae emails reales de páginas públicas
* Usa scraping HTTP o navegador según necesidad
* Aprende la mejor estrategia por dominio
* Almacena resultados en MongoDB
* Evita concurrencia duplicada
* Mantiene cache común por query
* Permite refresh controlado por TTL

---

### Próximos Pasos

* Resolver multi-provider en modo automático
* Filtrado semántico de resultados
* Respeto automático de robots.txt
* Estrategia incremental en vez de snapshot
* Extractores configurables por usuario
* Monitorización programada
* Nuevos tipos de recursos extraíbles
