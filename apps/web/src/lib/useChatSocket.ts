import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatResponse } from "./types";

export interface ChatMessage {
  role: "client" | "agent";
  content: string;
  intent?: ChatResponse["intent"];
  toolResult?: unknown;
  escalation?: ChatResponse["escalation"];
}

export function useChatSocket(clientId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [lastInsight, setLastInsight] = useState<ChatResponse | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    setMessages([]);
    setLastInsight(null);
    const ws = new WebSocket(`ws://localhost:3000/ws/chat/${encodeURIComponent(clientId)}`);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);
    ws.onmessage = (event) => {
      setThinking(false);
      const data: ChatResponse = JSON.parse(event.data);
      setLastInsight(data);
      setMessages((prev) => [
        ...prev,
        { role: "agent", content: data.reply, intent: data.intent, toolResult: data.toolResult, escalation: data.escalation },
      ]);
    };

    return () => ws.close();
  }, [clientId]);

  const send = useCallback((text: string) => {
    if (!text.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    setMessages((prev) => [...prev, { role: "client", content: text }]);
    setThinking(true);
    wsRef.current.send(JSON.stringify({ message: text }));
  }, []);

  return { messages, connected, thinking, lastInsight, send };
}