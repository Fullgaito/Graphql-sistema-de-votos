import { useEffect, useState } from "react";
import { subscribeToConnectionStatus } from "../apolloClient.js";
import styles from "./ConnectionStatus.module.css";

export default function ConnectionStatus() {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    return subscribeToConnectionStatus(setConnected);
  }, []);

  return (
    <div className={styles.status} role="status" aria-live="polite">
      <span
        className={`${styles.dot} ${connected ? styles.connected : styles.disconnected}`}
        aria-hidden="true"
      />
      <span className={styles.label}>
        WebSocket {connected ? "connected" : "disconnected"}
      </span>
    </div>
  );
}
