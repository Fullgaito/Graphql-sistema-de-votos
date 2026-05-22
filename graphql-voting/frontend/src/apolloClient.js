import { ApolloClient, InMemoryCache, HttpLink, split } from "@apollo/client";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { getMainDefinition } from "@apollo/client/utilities";
import { createClient } from "graphql-ws";
const HTTP_URI =
  import.meta.env.VITE_GRAPHQL_HTTP ?? "http://localhost:4000/graphql";
const WS_URI =
  import.meta.env.VITE_GRAPHQL_WS ?? "ws://localhost:4000/graphql";

let connectionState = false;
const connectionListeners = new Set();

function notifyConnectionListeners(connected) {
  connectionState = connected;
  connectionListeners.forEach((listener) => listener(connected));
}

export function subscribeToConnectionStatus(listener) {
  connectionListeners.add(listener);
  listener(connectionState);
  return () => connectionListeners.delete(listener);
}

export function getConnectionStatus() {
  return connectionState;
}

const wsClient = createClient({
  url: WS_URI,
  on: {
    connected: () => notifyConnectionListeners(true),
    closed: () => notifyConnectionListeners(false),
    error: () => notifyConnectionListeners(false),
  },
});

const wsLink = new GraphQLWsLink(wsClient);

const httpLink = new HttpLink({ uri: HTTP_URI });

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === "OperationDefinition" &&
      definition.operation === "subscription"
    );
  },
  wsLink,
  httpLink
);

export const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});
