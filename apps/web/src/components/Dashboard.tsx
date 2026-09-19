import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { ConversationRow, EscalationRow, OrderRow, Stats } from "../lib/types";

function formatMad(n: number) {
  return `${n.toLocaleString("fr-FR")} MAD`;
}
function formatPct(n: number) {
  return `${Math.round(n * 100)}%`;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [escalations, setEscalations] = useState<EscalationRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function refresh() {
      const [s, c, e, o] = await Promise.all([
        api.stats(), api.conversations(), api.escalations(), api.orders(),
      ]);
      setStats(s); setConversations(c); setEscalations(e); setOrders(o);
      setLoading(false);
    }
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="dashboard"><p className="empty-state">Chargement du tableau de bord…</p></div>;
  }

  return (
    <div className="dashboard">
      <div className="statgrid">
        <div className="statcard">
          <span className="stat-number">{stats?.conversations ?? 0}</span>
          <span className="stat-label">Conversations</span>
        </div>
        <div className="statcard">
          <span className="stat-number">{formatPct(stats?.taux_conversion ?? 0)}</span>
          <span className="stat-label">Taux de conversion</span>
        </div>
        <div className="statcard">
          <span className="stat-number">{formatMad(stats?.ventes_total_mad ?? 0)}</span>
          <span className="stat-label">Ventes réalisées par l'agent</span>
        </div>
        <div className="statcard statcard-alert">
          <span className="stat-number">{escalations.length}</span>
          <span className="stat-label">Escalades à traiter</span>
        </div>
      </div>

      <div className="panelgrid">
        <div className="panel">
          <h2 className="panel-title">File d'escalade</h2>
          {escalations.length === 0 && <p className="empty-state">Rien à traiter pour l'instant.</p>}
          <ul className="esc-list">
            {escalations.map((e) => (
              <li key={e.id} className="esc-item">
                <span className="esc-reason">{e.reason}</span>
                <span className="esc-meta">client {e.customer_id} · {new Date(e.created_at).toLocaleString("fr-FR")}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="panel">
          <h2 className="panel-title">Conversations récentes</h2>
          {conversations.length === 0 && <p className="empty-state">Aucune conversation pour l'instant.</p>}
          <ul className="conv-list">
            {conversations.map((c) => (
              <li key={c.id} className="conv-item">
                <span className="conv-client">{c.customer_id}</span>
                <span className="conv-last">{c.dernier_message ?? "—"}</span>
                <span className="conv-count">{c.nb_messages} messages</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="panel">
        <h2 className="panel-title">Commandes créées par l'agent</h2>
        {orders.length === 0 && <p className="empty-state">Aucune commande créée pour l'instant.</p>}
        <ul className="order-list">
          {orders.map((o) => (
            <li key={o.id} className="order-item">
              <span className="order-id">{o.id}</span>
              <span className="order-client">{o.customer_id}</span>
              <span className="order-ville">{o.ville_livraison}</span>
              <span className="order-total">{formatMad(o.total_mad)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}