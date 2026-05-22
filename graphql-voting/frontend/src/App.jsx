import { useCallback, useEffect, useMemo, useState } from "react";
import { gql, useMutation, useQuery, useSubscription } from "@apollo/client";
import VoteCard from "./components/VoteCard.jsx";
import ConnectionStatus from "./components/ConnectionStatus.jsx";
import styles from "./App.module.css";

const GET_VOTES = gql`
  query GetVotes {
    getVotes {
      id
      label
      count
    }
  }
`;

const ADD_VOTE = gql`
  mutation AddVote($id: ID!) {
    addVote(id: $id) {
      id
      label
      count
    }
  }
`;

const VOTE_UPDATED = gql`
  subscription VoteUpdated {
    voteUpdated {
      id
      label
      count
    }
  }
`;

export default function App() {
  const [votes, setVotes] = useState([]);
  const [pulseIds, setPulseIds] = useState(new Set());
  const [votingId, setVotingId] = useState(null);

  const { data, loading, error } = useQuery(GET_VOTES);

  useEffect(() => {
    if (data?.getVotes) {
      setVotes(data.getVotes);
    }
  }, [data]);

  const [addVote] = useMutation(ADD_VOTE);

  const triggerPulse = useCallback((id) => {
    setPulseIds((prev) => new Set(prev).add(id));
    setTimeout(() => {
      setPulseIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 450);
  }, []);

  useSubscription(VOTE_UPDATED, {
    onData: ({ data: subData }) => {
      const updated = subData?.data?.voteUpdated;
      if (!updated) return;

      setVotes((prev) =>
        prev.map((v) => (v.id === updated.id ? { ...v, count: updated.count } : v))
      );
      triggerPulse(updated.id);
    },
  });

  const totalVotes = useMemo(
    () => votes.reduce((sum, v) => sum + v.count, 0),
    [votes]
  );

  const handleVote = async (id) => {
    setVotingId(id);
    try {
      const { data: result } = await addVote({ variables: { id } });
      const updated = result?.addVote;
      if (updated) {
        setVotes((prev) =>
          prev.map((v) => (v.id === updated.id ? { ...v, count: updated.count } : v))
        );
      }
    } catch (err) {
      console.error("Vote failed:", err);
    } finally {
      setVotingId(null);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <p className={styles.loading}>Loading votes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <p className={styles.error}>Error: {error.message}</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>GraphQL Voting</h1>
        <ConnectionStatus />
      </header>

      <p className={styles.total}>
        Total votes: <strong>{totalVotes}</strong>
      </p>

      <div className={styles.grid}>
        {votes.map((vote) => (
          <VoteCard
            key={vote.id}
            vote={vote}
            onVote={handleVote}
            voting={votingId === vote.id}
            pulse={pulseIds.has(vote.id)}
          />
        ))}
      </div>
    </div>
  );
}
