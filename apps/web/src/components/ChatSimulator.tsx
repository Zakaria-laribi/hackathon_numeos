import { useState } from "react";
import { useChatSocket } from "../lib/useChatSocket";

const SAMPLE_CLIENTS = ["CLI-0001", "CLI-0002", "CLI-0003"];

function newClientId() {
  return `CLI-TEST-${Date.now().toString().slice(-6)}`;
}

const LANG_LABEL: Record<string, string> = { fr: "Français", ar: "Arabe", darija: "Darija" };

export default function ChatSimulator() {
  const [clientId, setClientId] = useState(SAMPLE_CLIENTS[0]);
  const [draft, setDraft] = useState("");
  const { messages, connected, thinking, lastInsight, send } = useChatSocket(clientId);

  function handleSend() {
    send(draft);
    setDraft("");
  }

  return (
    <div className="chatview">
      <aside className="clientpanel">
        <h2 className="panel-title">Client de test</h2>
        <ul className="clientlist">
          {SAMPLE_CLIENTS.map((id) => (
            <li key={id}>
              <button
                className={`clientitem ${id === clientId ? "active" : ""}`}
                onClick={() => setClientId(id)}
              >
                {id}
              </button>
            </li>
          ))}
        </ul>
        <button className="newclient-btn" onClick={() => setClientId(newClientId())}>
          Nouveau client
        </button>
        <p className="clientpanel-id">
          Fil en cours : <code>{clientId}</code>
        </p>
      </aside>

      <section className="conversation-col">
        <div className="conversation">
          {messages.length === 0 && (
            <p className="empty-state">Écris un message ci-dessous pour démarrer la conversation avec {clientId}.</p>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`bubble ${m.role}`} dir="auto">
              {m.content}
              {m.role === "agent" && m.escalation && (
                <span className="badge badge-escalation">transféré au commerçant</span>
              )}
            </div>
          ))}
          {thinking && <div className="bubble agent thinking">…</div>}
        </div>
        <form
          className="composer"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="chhal taman dyal... / écrire un message"
            dir="auto"
          />
          <button type="submit" disabled={!connected}>Envoyer</button>
        </form>
        {!connected && <p className="conn-warning">Connexion au serveur en cours…</p>}
      </section>

      <aside className="insightpanel">
        <h2 className="panel-title">Ce que l'agent voit</h2>
        {!lastInsight && <p className="empty-state">En attente d'un premier message.</p>}
        {lastInsight && (
          <div className="insight-body">
            <div className="insight-row">
              <span className="insight-label">Intention</span>
              <span className="insight-value">{lastInsight.intent?.intention ?? "—"}</span>
            </div>
            <div className="insight-row">
              <span className="insight-label">Langue détectée</span>
              <span className="insight-value">
                {lastInsight.intent ? LANG_LABEL[lastInsight.intent.langue_detectee] : "—"}
              </span>
            </div>
            <div className="insight-row">
              <span className="insight-label">Escalade</span>
              <span className="insight-value">{lastInsight.escalation ? lastInsight.escalation.reason : "aucune"}</span>
            </div>
            <div className="insight-row">
              <span className="insight-label">Résultat d'outil brut</span>
              <pre className="insight-raw">
                {lastInsight.toolResult ? JSON.stringify(lastInsight.toolResult, null, 2) : "—"}
              </pre>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}