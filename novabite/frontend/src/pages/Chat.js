import React, { useState, useRef, useEffect } from "react";

const API = process.env.REACT_APP_API_URL || "";

const SUGGESTIONS = [
  "Which region had the highest net revenue in Q1 2024?",
  "What is the gross profit margin for Snacks?",
  "Which sales rep closed the most units in 2025?",
  "Compare E-Commerce vs Modern Trade net revenue.",
  "What was the best performing product in the West region?",
];

function TypingIndicator() {
  return (
    <div className="message">
      <div className="avatar bot-avatar">🤖</div>
      <div className="bubble bot-bubble">
        <div className="typing">
          <span /><span /><span />
        </div>
      </div>
    </div>
  );
}

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(question) {
    const q = (question || input).trim();
    if (!q || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: q }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Request failed");
      setMessages((prev) => [...prev, { role: "bot", content: data.answer }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", content: `⚠ Error: ${err.message}`, error: true },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  function autoResize(e) {
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Ask AI</div>
        <div className="page-subtitle">Ask anything about NovaBite sales — powered by Claude</div>
      </div>

      <div className="content" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 89px)", paddingBottom: 8 }}>
        {/* Messages area */}
        <div className="chat-messages">
          {messages.length === 0 && !loading ? (
            <div className="chat-empty">
              <div className="chat-empty-icon">◎</div>
              <div className="chat-empty-title">Your sales analyst is ready.</div>
              <div className="chat-empty-desc">
                Ask questions about revenue, regions, products, reps, or trends. It knows all the numbers.
              </div>
              <div className="suggestion-chips">
                {SUGGESTIONS.map((s) => (
                  <button key={s} className="chip" onClick={() => send(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((m, i) => (
                <div key={i} className={`message ${m.role === "user" ? "user" : ""}`}>
                  <div className={`avatar ${m.role === "user" ? "user-avatar" : "bot-avatar"}`}>
                    {m.role === "user" ? "👤" : "🤖"}
                  </div>
                  <div
                    className={`bubble ${m.role === "user" ? "user-bubble" : "bot-bubble"}`}
                    style={m.error ? { borderColor: "rgba(255,90,90,0.3)", color: "#ff8a8a" } : {}}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && <TypingIndicator />}
              <div ref={bottomRef} />
            </>
          )}
        </div>

        {/* Input bar */}
        <div className="chat-input-bar">
          <div className="chat-input-row">
            <textarea
              ref={textareaRef}
              className="chat-input"
              placeholder="Ask about revenue, regions, products, reps…"
              value={input}
              onChange={(e) => { setInput(e.target.value); autoResize(e); }}
              onKeyDown={handleKey}
              rows={1}
              disabled={loading}
            />
            <button
              className="send-btn"
              onClick={() => send()}
              disabled={!input.trim() || loading}
              title="Send"
            >
              ↑
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
