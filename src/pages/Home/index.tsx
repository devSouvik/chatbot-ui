import { useState, useEffect } from "preact/hooks";
import ChatHistory from "../../components/ChatHistory";
import ChatInput from "../../components/ChatInput";

export function Home() {
  const [messages, setMessages] = useState([]);
  const [streaming, setStreaming] = useState(false);
  const [sessionId, setSessionId] = useState(() => {
    // Try to get session ID from localStorage, or create a new one
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem("session_id");
      if (stored) return stored;
    }
    const newId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    if (typeof window !== 'undefined') {
      localStorage.setItem("session_id", newId);
    }
    return newId;
  });

  const handleNewChat = () => {
    // Generate new session ID
    const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Store in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem("session_id", newSessionId);
    }

    // Update state
    setSessionId(newSessionId);
    setMessages([]);
    setStreaming(false);
  };

  async function handleSend(content) {
    setMessages(prev => [...prev, { type: "human", content }]);
    setStreaming(true);

    // Add empty assistant message
    setMessages(prev => [...prev, { type: "assistant", content: "" }]);
    let aiReply = "";

    try {
      const res = await fetch("http://localhost:8001/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: content, session_id: sessionId })
      });

      if (!res.body) throw new Error("No response body from server");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // Split by SSE event (\n\n)
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const event of events) {
          if (!event.trim() || !event.startsWith("data:")) continue;
          const dataStr = event.replace(/^data:\s*/, "").trim();
          if (dataStr === "[DONE]") {
            setStreaming(false);
            return;
          }
          try {
            const parsedEvent = JSON.parse(dataStr);
            if (parsedEvent.type === "message_chunk" && parsedEvent.message) {
              aiReply += parsedEvent.message;
              // Stream update assistant message
              setMessages(prev =>
                prev.map((msg, i) =>
                  i === prev.length - 1 ? { ...msg, content: aiReply } : msg
                )
              );
            } else if (parsedEvent.type === "final_message" && parsedEvent.message) {
              aiReply = parsedEvent.message;
              setMessages(prev =>
                prev.map((msg, i) =>
                  i === prev.length - 1 ? { ...msg, content: aiReply } : msg
                )
              );
            }
          } catch (err) {
            // Ignore non-JSON events in normal UI; optionally log errors
          }
        }
      }
      setStreaming(false);
    } catch (error) {
      setMessages(prev =>
        prev.map((msg, i) =>
          i === prev.length - 1 ? { ...msg, content: "Sorry, something went wrong." } : msg
        )
      );
      setStreaming(false);
    }
  }

  return (
    <>
      <ChatHistory
        sessionId={sessionId}
        messages={messages}
        setMessages={setMessages}
        onNewChat={handleNewChat}
      />
      <ChatInput onSend={handleSend} disabled={streaming} />
    </>
  );
}
