import styles from "./VoteCard.module.css";

export default function VoteCard({ vote, onVote, voting, pulse }) {
  return (
    <article className={styles.card}>
      <h2 className={styles.label}>{vote.label}</h2>
      <p
        className={`${styles.count} ${pulse ? styles.pulse : ""}`}
        aria-live="polite"
      >
        {vote.count}
      </p>
      <button
        type="button"
        className={styles.button}
        onClick={() => onVote(vote.id)}
        disabled={voting}
      >
        👍 Votar
      </button>
    </article>
  );
}
