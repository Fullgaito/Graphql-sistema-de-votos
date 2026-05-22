# graphql-voting

Una demostración mínima de votación en tiempo real construida con **GraphQL**, mostrando los tres tipos de operaciones: **Query**, **Mutation** y **Subscription**.

Abre dos pestañas del navegador, vota en una y observa cómo el contador se actualiza instantáneamente en la otra, impulsado por WebSockets y PubSub en memoria.

---

## Stack

| Capa | Tecnologías |
|------|-------------|
| Backend | Node.js, Apollo Server 4, Express, graphql-ws, PubSub |
| Frontend | React, Apollo Client 3, Vite, graphql-ws |
| Almacenamiento | Estado en memoria del módulo (sin base de datos) |

---

## Estructura del proyecto

```text
graphql-voting/
  backend/          # Apollo Server + suscripciones WebSocket
  frontend/         # Interfaz React con Apollo Client
  README.md
```

---

## Instalación

### Backend

```bash
cd backend
npm install
```

### Frontend

```bash
cd frontend
npm install
npm run build
```

> El script `start` del frontend sirve la versión de producción usando Vite preview. Ejecuta `npm run build` una vez antes de `npm start`.

---

## Ejecución de la aplicación

Inicia primero el backend y luego el frontend.

### Backend (puerto 4000)

```bash
cd backend
npm start
# o para desarrollo con recarga automática:
npm run dev
```

### Frontend (puerto 5173)

```bash
cd frontend
npm start
# o para desarrollo con hot reload:
npm run dev
```

Abre `http://localhost:5173` en tu navegador.

---

## Probando las subscriptions

1. Inicia tanto el backend como el frontend.
2. Abre **dos pestañas del navegador** en `http://localhost:5173`.
3. Verifica que el indicador WebSocket muestre un **punto verde** (conectado).
4. Haz clic en **👍 Votar** en cualquier opción en la **pestaña 1**.
5. Observa cómo el contador de votos se actualiza en la **pestaña 2** sin recargar — esa es la subscription `voteUpdated` en acción.
6. El contador de **Total de votos** también se actualiza en ambas pestañas.

---

## Conceptos demostrados

### HTTP (Query y Mutation)

- Las **queries** (`getVotes`) y **mutations** (`addVote`) viajan mediante **HTTP POST** hacia `http://localhost:4000/graphql`.
- Cada solicitud es independiente: el cliente envía una operación, el servidor responde y la conexión se cierra.
- Ideal para obtener el estado inicial y ejecutar acciones puntuales como emitir un voto.

---

### WebSocket (Subscription)

- Las **subscriptions** (`voteUpdated`) utilizan una conexión persistente **WebSocket** en `ws://localhost:4000/graphql` mediante **graphql-ws**.
- Después de suscribirse, el servidor puede **enviar** eventos al cliente cada vez que cambia un voto.
- Apollo Client enruta automáticamente las operaciones:
  - queries/mutations → `HttpLink`
  - subscriptions → `GraphQLWsLink`

---

### PubSub (lado del servidor)

Cuando se ejecuta `addVote`, el resolver incrementa el contador y publica `VOTE_UPDATED`. Todos los listeners activos de subscriptions reciben el objeto `Vote` actualizado y lo envían mediante WebSocket a los clientes conectados.

---

## Limitaciones

- El **PubSub en memoria** solo funciona dentro de un **único proceso de Node.js**. Si ejecutas múltiples instancias del servidor (por ejemplo, detrás de un balanceador de carga), cada instancia tiene su propia memoria y los suscriptores en la instancia A no recibirán eventos publicados en la instancia B.
- Para despliegues de producción con múltiples instancias se necesitaría una capa compartida de pub/sub (por ejemplo Redis), la cual intencionalmente **no** se utiliza en esta demostración.
- Reiniciar el backend **restablece todos los contadores de votos** a cero.

---

## Referencia de la API

| Operación | Tipo | Descripción |
|------------|------|-------------|
| `getVotes` | Query | Retorna todas las opciones de voto |
| `addVote` | Mutation | Incrementa el contador para el `id` dado |
| `voteUpdated` | Subscription | Envía el `Vote` actualizado tras un voto |