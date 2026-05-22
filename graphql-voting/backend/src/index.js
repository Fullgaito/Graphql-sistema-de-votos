import http from "node:http";
import express from "express";
import cors from "cors";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/use/ws";
import { typeDefs, resolvers } from "./resolvers.js";

const PORT = Number(process.env.PORT) || 4000;
const corsOrigins = (process.env.FRONTEND_ORIGIN ?? "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }
    if (corsOrigins.includes(origin)) {
      callback(null, origin);
      return;
    }
    console.warn(`CORS blocked origin: ${origin}`);
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "apollo-require-preflight",
    "x-apollo-operation-name",
  ],
};

function isAllowedOrigin(origin) {
  return !origin || corsOrigins.includes(origin);
}

const schema = makeExecutableSchema({ typeDefs, resolvers });

const app = express();
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

const httpServer = http.createServer(app);

const wsServer = new WebSocketServer({
  server: httpServer,
  path: "/graphql",
});

const serverCleanup = useServer(
  {
    schema,
    onConnect: async (ctx) => {
      const origin = ctx.extra.request.headers.origin;
      if (!isAllowedOrigin(origin)) {
        console.warn(`WebSocket blocked origin: ${origin}`);
        return false;
      }
    },
  },
  wsServer
);

const server = new ApolloServer({
  schema,
  plugins: [
    ApolloServerPluginDrainHttpServer({ httpServer }),
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose();
          },
        };
      },
    },
  ],
});

await server.start();

app.use("/graphql", express.json(), expressMiddleware(server));

const shutdown = async (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  await server.stop();
  httpServer.close(() => {
    console.log("HTTP server closed.");
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

httpServer.listen(PORT, () => {
  console.log(`🚀 GraphQL HTTP ready on port ${PORT}/graphql`);
  console.log(`🔌 Subscriptions ready on port ${PORT}/graphql (ws)`);
  console.log(`🌐 CORS allowed origins: ${corsOrigins.join(", ")}`);
});
