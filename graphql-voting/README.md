# graphql-voting

A minimal real-time voting demo built with **GraphQL**, showcasing all three operation types: **Query**, **Mutation**, and **Subscription**.

Open two browser tabs, vote in one, and watch the counter update instantly in the other — powered by WebSockets and in-memory PubSub.

## Stack

| Layer    | Technologies                                              |
| -------- | --------------------------------------------------------- |
| Backend  | Node.js, Apollo Server 4, Express, graphql-ws, PubSub     |
| Frontend | React, Apollo Client 3, Vite, graphql-ws                  |
| Storage  | In-memory module state (no database)                      |

## Project structure

```
graphql-voting/
  backend/          # Apollo Server + WebSocket subscriptions
  frontend/         # React UI with Apollo Client
  README.md
```

## Installation

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

> The frontend `start` script serves the production build with Vite preview. Run `npm run build` once before `npm start`.

## Running the app

Start the backend first, then the frontend.

### Backend (port 4000)

```bash
cd backend
npm start
# or for development with auto-reload:
npm run dev
```

### Frontend (port 5173)

```bash
cd frontend
npm start
# or for development with hot reload:
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Testing subscriptions

1. Start both backend and frontend.
2. Open **two browser tabs** at `http://localhost:5173`.
3. Check that the WebSocket indicator shows a **green dot** (connected).
4. Click **👍 Votar** on any option in **tab 1**.
5. Watch the vote count update in **tab 2** without refreshing — that is the `voteUpdated` subscription in action.
6. The **Total votes** counter updates in both tabs as well.

## Concepts demonstrated

### HTTP (Query & Mutation)

- **Queries** (`getVotes`) and **mutations** (`addVote`) travel over **HTTP POST** to `http://localhost:4000/graphql`.
- Each request is independent: the client sends an operation, the server responds, and the connection closes.
- Ideal for fetching initial state and one-off actions like casting a vote.

### WebSocket (Subscription)

- **Subscriptions** (`voteUpdated`) use a persistent **WebSocket** connection at `ws://localhost:4000/graphql` via **graphql-ws**.
- After subscribing, the server can **push** events to the client whenever a vote changes.
- Apollo Client routes operations automatically: queries/mutations → `HttpLink`, subscriptions → `GraphQLWsLink`.

### PubSub (server-side)

When `addVote` runs, the resolver increments the count and publishes `VOTE_UPDATED`. All active subscription listeners receive the updated `Vote` object and forward it over WebSocket to connected clients.

## Limitations

- **In-memory PubSub** only works inside a **single Node.js process**. If you run multiple server instances (e.g. behind a load balancer), each instance has its own memory and subscribers on instance A will not receive events published on instance B.
- For production multi-instance deployments you would need a shared pub/sub layer (e.g. Redis), which is intentionally **not** used in this demo.
- Restarting the backend **resets all vote counts** to zero.

## API reference

| Operation    | Type         | Description                          |
| ------------ | ------------ | ------------------------------------ |
| `getVotes`   | Query        | Returns all vote options             |
| `addVote`    | Mutation     | Increments count for the given `id`  |
| `voteUpdated`| Subscription | Streams updated `Vote` after a vote  |
