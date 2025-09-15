import { TargetedMouseEvent } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { FaRobot, FaUser } from "react-icons/fa";
import styles from "./ChatHistory.module.css";
import Markdown from 'markdown-to-jsx'

interface Message {
  type: "human" | "assistant";
  content: string;
}

export interface ChatHistoryProps {
  sessionId: string;
  messages: any[];
  setMessages: (messages: any[]) => void;
  onNewChat: () => void;
}

const API_BASE = "http://localhost:8001/chat/history";

export default function ChatHistory({ sessionId, messages, setMessages, onNewChat }: ChatHistoryProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_BASE}?session_id=${sessionId}&limit=30`);
        if (!res.ok) throw new Error("Network error");
        const data = await res.json();
        if (!data.success) throw new Error("API error");
        setMessages(data.messages || []);
      } catch (err: any) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [sessionId, setMessages]);

  // Scroll to bottom after loading is complete
  useEffect(() => {
    if (!loading && messages.length > 0) {
      // Use setTimeout to ensure DOM is updated
      setTimeout(scrollToBottom, 100);
    }
  }, [loading, messages.length]);

  if (loading) return (
    <div className={styles.history}>
      <div className={styles.loading}>Loading chat history...</div>
    </div>
  );

  if (error) return (
    <div className={styles.history}>
      <div className={styles.error}>
        <strong>Error:</strong> {error}
      </div>
    </div>
  );

  function handleNewChat(event: TargetedMouseEvent<HTMLButtonElement>): void {
    event.preventDefault();
    onNewChat(); // Call the parent's onNewChat function
  }

  return (
    <div className={styles.history}>
      {messages.length === 0 ? (
        <div className={styles.emptyState}>
          <h3>Welcome to Chat!</h3>
          <p>Start a conversation by typing a message below.</p>
        </div>
      ) : (
        <>
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`${styles.messageRow} ${msg.type === "human" ? styles.human : styles.assistant}`}
            >
              <div className={styles.icon}>
                {msg.type === "human" ? <FaUser /> : <FaRobot />}
              </div>
              <div className={styles.bubble}>
                <Markdown>
                  {msg.content || (msg.type === "assistant" && "Typing...")}
                </Markdown>
              </div>
            </div>
          ))}
          <div className={styles.newChatButtonContainer}>
            <button className={styles.newChatButton} onClick={handleNewChat}>
              ----- Start a new chat -----
            </button>
          </div>
        </>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}
