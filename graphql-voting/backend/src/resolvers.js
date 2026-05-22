import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import gql from "graphql-tag";
import { pubsub } from "./pubsub.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const typeDefs = gql(
  readFileSync(join(__dirname, "schema.graphql"), "utf8")
);

const VOTE_UPDATED = "VOTE_UPDATED";

let votes = [
  { id: "1", label: "Opción A", count: 0 },
  { id: "2", label: "Opción B", count: 0 },
  { id: "3", label: "Opción C", count: 0 },
];

const resolvers = {
  Query: {
    getVotes: () => votes,
  },
  Mutation: {
    addVote: async (_, { id }) => {
      const vote = votes.find((v) => v.id === id);
      if (!vote) {
        throw new Error(`Vote option with id "${id}" not found`);
      }
      vote.count += 1;
      const updated = { ...vote };
      await pubsub.publish(VOTE_UPDATED, { voteUpdated: updated });
      return updated;
    },
  },
  Subscription: {
    voteUpdated: {
      subscribe: () => pubsub.asyncIterableIterator([VOTE_UPDATED]),
    },
  },
};

export { typeDefs, resolvers };
