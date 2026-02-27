# Node Mongo Extractor Engine

Motor backend de extracción de información basado en Node.js, MongoDB y arquitectura modular.

El objetivo actual es construir un sistema de extracción desacoplado, extensible y controlado, evitando scraping agresivo y priorizando diseño sólido.

---

## 🚀 Stack

- Node.js 20
- Express
- MongoDB 7
- Mongoose
- Axios
- Cheerio
- p-limit
- Docker + Docker Compose

---

## 🧠 Filosofía del Proyecto

Este proyecto no busca volumen de scraping, sino:

- Arquitectura clara
- Separación de responsabilidades
- Control de concurrencia
- Persistencia coherente
- Base extensible para motor de extracción configurable

Está diseñado para poder pivotar de "extractor de contactos" a "motor genérico de extracción".

---

## 🏗️ Arquitectura Modular

```js
src/
  modules/
    auth/
    search/
      search.model.js
      contact.model.js
      search.service.js
    scraper/
      scraper.service.js
      extractors/
        email.extractor.js
        phone.extractor.js
```

### Responsabilidades

#### auth/

Encargado exclusivamente de autenticación y JWT.

#### search/

Responsable de:

- Gestión de búsquedas
- Cache común
- TTL
- Control de estado (processing / idle)
- Persistencia en MongoDB

No conoce detalles internos del scraping.

#### scraper/

Responsable de:

- Descargar HTML
- Ejecutar extractores
- Devolver datos estructurados

No conoce modelos ni lógica de negocio.

---

## 🔄 Flujo de una búsqueda

1. Usuario autenticado llama `/search?q=...`
2. Se normaliza la query.
3. Se busca en Mongo:
   - Si no existe → se crea con status "processing".
   - Si existe → se evalúa expiración (TTL).
4. Si está expirado → se lanza scraping en background.
5. Se devuelve respuesta inmediata (no bloqueante).

El scraping se ejecuta *asincrónicamente* mediante `setImmediate`.

---

## Control de Concurrencia

Se evita scraping duplicado mediante:

```js
if (isExpired && search.status !== "processing")
```

Esto garantiza que:

No se lanzan múltiples scrapers para la misma query.
Se mantiene coherencia bajo concurrencia.
Además, el scraper usa `p-limit` para limitar concurrencia de requests HTTP externas.

## PERSISTENCIA Y CONSISTENCIA

Índice anti-duplicados en `contact.model.js`:

```js
contactSchema.index(
  { email: 1, searchId: 1 },
  { unique: true }
);
```

Esto evita insertar el mismo contacto varias veces para la misma búsqueda.

### Estrategia actual:

El refresco funciona como snapshot:

1. Se eliminan contactos previos.
2. Se insertan resultados nuevos.

La arquitectura está preparada para evolucionar a estrategia incremental.

## TTL Y REFRESH

El sistema utiliza una ventana configurable mediante la variable de entorno:

`SCRAPE_REFRESH_HOURS`

Si una búsqueda supera esa ventana:

- Se devuelve contenido actual.
- Se marca como "processing".
- Se ejecuta refresh en background.

La API expone:

```js
{
  status: "processing | idle",
  refreshing: true | false,
  total: number,
  data: [...]
}
```

## SCRAPER ENGINE

El scraper está desacoplado y funciona así:

1. Recibe lista de URLs.
2. Descarga HTML con Axios.
3. Parsea con Cheerio.
4. Ejecuta extractores especializados.
5. Devuelve resultados estructurados.

Extractores actuales:

- Email extractor
- Phone extractor (preparado)

Se pueden añadir nuevos extractores sin modificar el servicio de búsqueda.

## AUTENTICACIÓN

- Registro y login con JWT.
- Endpoints protegidos mediante middleware.
- La aplicación no es pública.

## CARACTERÍSTICAS TÉCNICAS RELEVANTES

- Respuesta no bloqueante.
- Background processing.
- Control de estado coherente.
- Índices únicos.
- Modularidad clara.
- Preparado para:
  - robots.txt
  - monitorización futura
  - extractores configurables
  - múltiples tipos de datos

## ESTADO ACTUAL

El sistema actualmente:

- Extrae emails reales de páginas públicas.
- Almacena resultados en MongoDB.
- Evita concurrencia duplicada.
- Mantiene cache común por query.
- Permite refresh controlado por TTL.

## PRÓXIMOS PASOS

- Soporte dinámico de URLs según query.
- Respeto automático de robots.txt.
- Estrategia incremental en vez de snapshot.
- Extractores configurables por usuario.
- Monitorización programada.