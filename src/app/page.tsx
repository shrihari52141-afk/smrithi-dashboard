"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Message {
  id: string;
  sender_number: string;
  message_text: string;
  bot_reply: string;
  created_at: string;
  status: string;
}

interface Stats {
  total: number;
  today: number;
  replied: number;
  failed: number;
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", backgroundColor: "#0f172a", color: "#e2e8f0", fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", padding: "0" },
  header: { backgroundColor: "#1e293b", borderBottom: "1px solid #334155", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 },
  headerLeft: { display: "flex", alignItems: "center", gap: "12px" },
  logo: { width: "36px", height: "36px", backgroundColor: "#22c55e", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" },
  headerTitle: { fontSize: "18px", fontWeight: 700, color: "#f1f5f9", margin: 0 },
  headerSubtitle: { fontSize: "12px", color: "#64748b", margin: 0 },
  statusDot: { display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#22c55e" },
  dot: { width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#22c55e", animation: "pulse 2s infinite" },
  main: { maxWidth: "1200px", margin: "0 auto", padding: "24px 20px" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "28px" },
  statCard: { backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "12px", padding: "20px" },
  statLabel: { fontSize: "12px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px", fontWeight: 600 },
  statValue: { fontSize: "32px", fontWeight: 800, color: "#f1f5f9", lineHeight: 1, marginBottom: "4px", fontVariantNumeric: "tabular-nums" },
  statChange: { fontSize: "12px", color: "#94a3b8" },
  sectionTitle: { fontSize: "16px", fontWeight: 700, color: "#f1f5f9", marginBottom: "16px" },
  tableWrapper: { backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "12px", overflow: "hidden", marginBottom: "28px" },
  tableHeader: { padding: "16px 20px", borderBottom: "1px solid #334155", display: "flex", alignItems: "center", justifyContent: "space-between" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { padding: "12px 20px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", backgroundColor: "#0f172a", borderBottom: "1px solid #334155" },
  td: { padding: "14px 20px", fontSize: "13px", color: "#cbd5e1", borderBottom: "1px solid #1e293b", verticalAlign: "top" },
  refreshBtn: { display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", backgroundColor: "#0ea5e9", color: "white", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer" },
  emptyState: { padding: "48px", textAlign: "center", color: "#475569" },
  timeText: { fontSize: "11px", color: "#475569", fontVariantNumeric: "tabular-nums" },
  numberText: { fontWeight: 600, color: "#e2e8f0" },
};

const badge = (color: string): React.CSSProperties => ({
  display: "inline-block", padding: "2px 10px", borderRadius: "9999px", fontSize: "11px", fontWeight: 600,
  backgroundColor: color === "green" ? "#14532d" : color === "red" ? "#450a0a" : "#1e3a5f",
  color: color === "green" ? "#4ade80" : color === "red" ? "#f87171" : "#60a5fa",
});

export default function Dashboard() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, today: 0, replied: 0, failed: 0 });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("messages").select("*").order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      const rows: Message[] = data || [];
      setMessages(rows);
      const todayStr = new Date().toISOString().split("T")[0];
      setStats({
        total: rows.length,
        today: rows.filter((m) => m.created_at?.startsWith(todayStr)).length,
        replied: rows.filter((m) => m.status === "replied" || m.bot_reply).length,
        failed: rows.filter((m) => m.status === "failed").length,
      });
      setLastUpdated(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); const i = setInterval(fetchData, 30000); return () => clearInterval(i); }, [fetchData]);

  const formatPhone = (num: string) => { if (!num) return "—"; const n = num.replace(/D/g, ""); return n.length >= 10 ? `+${n.slice(0,2)} ${n.slice(2,7)} ${n.slice(7)}` : num; };
  const formatTime = (iso: string) => { if (!iso) return "—"; return new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }); };

  const statCards = [
    { label: "Total Messages", value: stats.total, icon: "💬", color: "#0ea5e9" },
    { label: "Today's Messages", value: stats.today, icon: "📅", color: "#a855f7" },
    { label: "Bot Replies Sent", value: stats.replied, icon: "🤖", color: "#22c55e" },
    { label: "Failed / Errors", value: stats.failed, icon: "⚠️", color: "#ef4444" },
  ];

  return (
    <div style={styles.page}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} } tr:hover td { background-color: #0f172a !important; }`}</style>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.logo}>💬</div>
          <div><p style={styles.headerTitle}>Smrithi Dashboard</p><p style={styles.headerSubtitle}>WhatsApp AI Bot Monitor</p></div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          {lastUpdated && <span style={styles.timeText}>Updated {lastUpdated}</span>}
          <div style={styles.statusDot}><span style={styles.dot} />Live</div>
          <button style={styles.refreshBtn} onClick={fetchData} disabled={loading}>{loading ? "⟳ Loading..." : "⟳ Refresh"}</button>
        </div>
      </header>
      <main style={styles.main}>
        <div style={styles.statsGrid}>
          {statCards.map((card) => (
            <div key={card.label} style={styles.statCard}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <span style={styles.statLabel}>{card.label}</span>
                <span style={{ fontSize: "22px" }}>{card.icon}</span>
              </div>
              <div style={{ ...styles.statValue, color: card.color }}>{loading ? "..." : card.value.toLocaleString()}</div>
              <div style={styles.statChange}>All time</div>
            </div>
          ))}
        </div>
        <div style={styles.tableWrapper}>
          <div style={styles.tableHeader}>
            <span style={styles.sectionTitle}>Recent Messages</span>
            <span style={{ fontSize: "12px", color: "#475569" }}>Showing {messages.length} records · Auto-refreshes every 30s</span>
          </div>
          {loading && messages.length === 0 ? (
            <div style={styles.emptyState}><div style={{ fontSize: "40px", marginBottom: "12px" }}>⟳</div><p>Loading messages...</p></div>
          ) : messages.length === 0 ? (
            <div style={styles.emptyState}><div style={{ fontSize: "40px", marginBottom: "12px" }}>📭</div><p style={{ fontWeight: 600, color: "#94a3b8", marginBottom: "6px" }}>No messages yet</p><p style={{ fontSize: "13px" }}>Messages will appear here automatically</p></div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={styles.table}>
                <thead><tr>
                  <th style={styles.th}>Sender</th>
                  <th style={styles.th}>Message</th>
                  <th style={styles.th}>Bot Reply</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Time</th>
                </tr></thead>
                <tbody>
                  {messages.map((msg) => (
                    <tr key={msg.id}>
                      <td style={styles.td}><span style={styles.numberText}>{formatPhone(msg.sender_number)}</span></td>
                      <td style={styles.td}><div style={{ maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{msg.message_text || "—"}</div></td>
                      <td style={styles.td}><div style={{ maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#94a3b8", fontSize: "12px" }}>{msg.bot_reply || <span style={{ color: "#334155" }}>No reply</span>}</div></td>
                      <td style={styles.td}><span style={badge(msg.status === "failed" ? "red" : (msg.bot_reply || msg.status === "replied") ? "green" : "blue")}>{msg.status === "failed" ? "Failed" : msg.bot_reply ? "Replied" : msg.status || "Received"}</span></td>
                      <td style={styles.td}><span style={styles.timeText}>{formatTime(msg.created_at)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
