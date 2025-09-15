import { useState } from "preact/hooks";
import styles from "./ChatInput.module.css";

export default function ChatInput({ onSend, disabled }) {
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!disabled && input.trim()) {
      onSend(input.trim());
      setInput("");
    }
  };

  const handleKeyDown = (e) => {
    if (!disabled && e.key === "Enter") handleSend();
  };

  return (
    <div className={styles.inputBox}>
      <div className={styles.inputInner}>
        <input
          className={styles.input}
          type="text"
          value={input}
          placeholder="Type your message…"
          onChange={e => setInput((e.target as HTMLInputElement).value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
        />
        <button
          className={styles.button}
          onClick={handleSend}
          disabled={disabled}
        >
          Send
        </button>
      </div>
    </div>
  );
}

