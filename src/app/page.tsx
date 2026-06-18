"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Conversation {
  id: string;
  user_id: string;
  profile_name: string;
  mobile: string;
  updated_at: string;
}

interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  message_type: string;
  created_at: string;
}

interface ApiLog {
  id: string;
  model: string;
  status: string;
  latency_ms: number;
  api_key_index: number;
  created_at: string;
}

export default function Dashboard() {
  const [view, setView] = useState<"chat" | "analytics">("chat");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChat, setActiveChat] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [totalApiCalls, setTotalApiCalls] = useState(0);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  // Fetch Conversations & Logs on Mount
  useEffect(() => {
    const fetchConversations = async () => {
      const { data } = await supabase.from("conversations").select("*").order("updated_at", { ascending: false });
      if (data) setConversations(data as Conversation[]);
    };

    const fetchLogs = async () => {
      const { data: logsData } = await supabase.from("api_logs").select("*").order("created_at", { ascending: false }).limit(50);
      if (logsData) setLogs(logsData as ApiLog[]);
      
      const { count } = await supabase.from("api_logs").select("*", { count: "exact", head: true });
      setTotalApiCalls(count || 0);
    };

    fetchConversations();
    fetchLogs();

    // Realtime Subscriptions
    const convChannel = supabase.channel("conversations-realtime").on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () => fetchConversations()).subscribe();
    const logChannel = supabase.channel("logs-realtime").on("postgres_changes", { event: "INSERT", schema: "public", table: "api_logs" }, (payload) => {
      setLogs((prev) => [payload.new as ApiLog, ...prev].slice(0, 50));
      setTotalApiCalls((prev) => prev + 1);
    }).subscribe();

    return () => {
      supabase.removeChannel(convChannel);
      supabase.removeChannel(logChannel);
    };
  }, []);

  // Fetch Messages when a chat is selected
  useEffect(() => {
    if (!activeChat) return;

    const fetchMessages = async () => {
      setLoadingMsgs(true);
      const { data } = await supabase.from("messages").select("*").eq("conversation_id", activeChat.id).order("created_at", { ascending: true });
      if (data) setMessages(data as Message[]);
      setLoadingMsgs(false);
    };

    fetchMessages();

    const msgChannel = supabase.channel(`messages-${activeChat.id}`).on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${activeChat.id}` },
      (payload) => setMessages((prev) => [...prev, payload.new as Message])
    ).subscribe();

    return () => { supabase.removeChannel(msgChannel); };
  }, [activeChat]);

  // Calculate Stats
  const totalMessages = conversations.reduce((acc, c) => acc + 1, 0); // Simplified stat
  const failedRequests = logs.filter(l => l.status === "error").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", backgroundColor: "#0b141a", color: "#e9edef", fontFamily: "Segoe UI, system-ui, sans-serif", overflow: "hidden" }}>
      
      {/* TOP NAVIGATION BAR (Premium Glassmorphism) */}
      <div style={{ padding: "12px 24px", backgroundColor: "rgba(17, 27, 33, 0.8)", backdropFilter: "blur(10px)", borderBottom: "1px solid #222d34", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "8px", backgroundColor: "#00a884", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>🧠</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "16px" }}>Smrithi Control Center</div>
            <div style={{ fontSize: "11px", color: "#8696a0" }}>Realtime AI Bot Monitor</div>
          </div>
        </div>

        <div style={{ display: "flex", backgroundColor: "#202c33", borderRadius: "10px", padding: "4px" }}>
          <button onClick={() => setView("chat")} style={{ padding: "8px 20px", fontSize: "13px", fontWeight: 600, border: "none", borderRadius: "8px", cursor: "pointer", backgroundColor: view === "chat" ? "#00a884" : "transparent", color: view === "chat" ? "#0b141a" : "#8696a0" }}>💬 Live Monitor</button>
          <button onClick={() => setView("analytics")} style={{ padding: "8px 20px", fontSize: "13px", fontWeight: 600, border: "none", borderRadius: "8px", cursor: "pointer", backgroundColor: view === "analytics" ? "#00a884" : "transparent", color: view === "analytics" ? "#0b141a" : "#8696a0" }}>📊 Analytics</button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        
        {/* ========================================== */}
        {/* VIEW 1: LIVE WHATSAPP MONITOR              */}
        {/* ========================================== */}
        {view === "chat" && (
          <div style={{ display: "flex", height: "100%" }}>
            
            {/* LEFT SIDEBAR (Contacts) */}
            <div style={{ width: "30%", minWidth: "300px", borderRight: "1px solid #222d34", display: "flex", flexDirection: "column", backgroundColor: "#111b21" }}>
              <div style={{ padding: "8px 12px", backgroundColor: "#111b21" }}>
                <div style={{ backgroundColor: "#202c33", borderRadius: "8px", padding: "8px 12px", fontSize: "13px", color: "#8696a0" }}>🔍 Search or start new chat</div>
              </div>
              <div style={{ overflowY: "auto", flex: 1 }}>
                {conversations.length === 0 && <div style={{ padding: "20px", textAlign: "center", color: "#8696a0", fontSize: "13px" }}>No chats yet. Send a WhatsApp message to your bot!</div>}
                {conversations.map((convo) => (
                  <div key={convo.id} onClick={() => setActiveChat(convo)} style={{ padding: "12px 16px", borderBottom: "1px solid #222d34", cursor: "pointer", display: "flex", alignItems: "center", gap: "12px", backgroundColor: activeChat?.id === convo.id ? "#2a3942" : "transparent", borderLeft: activeChat?.id === convo.id ? "3px solid #00a884" : "3px solid transparent" }}>
                    <div style={{ width: "44px", height: "44px", borderRadius: "50%", backgroundColor: "#6a7175", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", color: "#0b141a", fontWeight: "bold" }}>{convo.profile_name.charAt(0).toUpperCase()}</div>
                    <div style={{ flex: 1, overflow: "hidden" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontWeight: 600, fontSize: "15px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{convo.profile_name}</span>
                        <span style={{ fontSize: "11px", color: "#00a884" }}>{new Date(convo.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div style={{ fontSize: "13px", color: "#8696a0" }}>{convo.mobile}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* MIDDLE CHAT WINDOW */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", backgroundColor: "#0b141a" }}>
              {!activeChat ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#8696a0", textAlign: "center", flexDirection: "column" }}>
                  <div style={{ fontSize: "40px", marginBottom: "12px" }}>💬</div>
                  <h2>Smrithi Dashboard</h2>
                  <p>Select a chat to view the conversation.</p>
                </div>
              ) : (
                <>
                  <div style={{ padding: "10px 16px", backgroundColor: "#202c33", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #222d34" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "#6a7175", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", color: "#0b141a", fontWeight: "bold" }}>{activeChat.profile_name.charAt(0).toUpperCase()}</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "15px" }}>{activeChat.profile_name}</div>
                        <div style={{ fontSize: "12px", color: "#8696a0" }}>{activeChat.mobile} • online</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <button style={{ fontSize: "11px", padding: "5px 10px", borderRadius: "6px", backgroundColor: "rgba(255,255,255,0.1)", color: "#e9edef", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer" }}>⏸️ Pause AI</button>
                    </div>
                  </div>

                  <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "8px", backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23222e35\" fill-opacity=\"0.4\"%3E%3Cpath d=\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')" }}>
                    {loadingMsgs && <div style={{ textAlign: "center", color: "#8696a0", fontSize: "14px" }}>Loading messages...</div>}
                    {!loadingMsgs && messages.length === 0 && <div style={{ textAlign: "center", color: "#8696a0", fontSize: "14px" }}>No messages in this chat yet.</div>}
                    {messages.map((msg) => (
                      <div key={msg.id} style={{ maxWidth: "65%", padding: "8px 12px", borderRadius: "8px", fontSize: "14px", lineHeight: "1.4", alignSelf: msg.role === "user" ? "flex-start" : "flex-end", backgroundColor: msg.role === "user" ? "#202c33" : "#005c4b", color: "#e9edef" }}>
                        {msg.content ? msg.content : <span style={{ fontStyle: "italic", color: "#8696a0" }}>[{msg.message_type} shared]</span>}
                        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", textAlign: "right", marginTop: "4px" }}>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ padding: "12px 16px", backgroundColor: "#202c33", display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ flex: 1, backgroundColor: "#2a3942", borderRadius: "8px", padding: "12px 16px", color: "#8696a0", fontSize: "14px" }}>AI is replying... Switch to MANUAL to type</div>
                    <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "rgba(0,168,132,0.5)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>➤</div>
                  </div>
                </>
              )}
            </div>

            {/* RIGHT SIDEBAR (Profile) */}
            <div style={{ width: "25%", minWidth: "280px", borderLeft: "1px solid #222d34", backgroundColor: "#111b21", display: "flex", flexDirection: "column", padding: "16px", gap: "12px" }}>
              {activeChat ? (
                <>
                  <div style={{ textAlign: "center", paddingBottom: "16px", borderBottom: "1px solid #222d34" }}>
                    <div style={{ width: "80px", height: "80px", borderRadius: "50%", backgroundColor: "#6a7175", margin: "0 auto 10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px", color: "#0b141a", fontWeight: "bold" }}>{activeChat.profile_name.charAt(0).toUpperCase()}</div>
                    <div style={{ fontSize: "16px", fontWeight: 600 }}>{activeChat.profile_name}</div>
                    <div style={{ fontSize: "12px", color: "#8696a0" }}>{activeChat.mobile}</div>
                  </div>
                  <div style={{ flex: 1, overflowY: "auto", fontSize: "13px", color: "#e9edef" }}>
                    <h4 style={{ color: "#8696a0", fontSize: "12px", textTransform: "uppercase", marginBottom: "8px" }}>AI Extracted Memory</h4>
                    <div style={{ backgroundColor: "#202c33", padding: "12px", borderRadius: "8px", marginBottom: "12px" }}>
                      <div style={{ marginBottom: "8px" }}><strong style={{ color: "#8696a0" }}>Status:</strong> <span style={{ color: "#00a884" }}>● Active</span></div>
                      <div style={{ marginBottom: "8px" }}><strong style={{ color: "#8696a0" }}>Total Messages:</strong> {messages.length}</div>
                    </div>
                    <button style={{ width: "100%", padding: "10px", borderRadius: "8px", backgroundColor: "rgba(239,68,68,0.2)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)", cursor: "pointer" }}>🛑 Pause AI for this user</button>
                  </div>
                </>
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#8696a0", textAlign: "center", fontSize: "13px" }}>Select a chat to view profile.</div>
              )}
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* VIEW 2: ANALYTICS & REPORTS                */}
        {/* ========================================== */}
        {view === "analytics" && (
          <div style={{ padding: "32px", overflowY: "auto", backgroundColor: "#0b141a" }}>
            
            {/* Stat Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px", marginBottom: "32px" }}>
              <div style={{ backgroundColor: "#111b21", border: "1px solid #222d34", borderRadius: "16px", padding: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                  <span style={{ fontSize: "12px", color: "#8696a0", textTransform: "uppercase", fontWeight: 600 }}>Total Users</span>
                  <span style={{ fontSize: "20px" }}>👥</span>
                </div>
                <div style={{ fontSize: "32px", fontWeight: 800, color: "#60a5fa" }}>{conversations.length}</div>
              </div>
              
              <div style={{ backgroundColor: "#111b21", border: "1px solid #222d34", borderRadius: "16px", padding: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                  <span style={{ fontSize: "12px", color: "#8696a0", textTransform: "uppercase", fontWeight: 600 }}>API Requests</span>
                  <span style={{ fontSize: "20px" }}>⚡</span>
                </div>
                <div style={{ fontSize: "32px", fontWeight: 800, color: "#a855f7" }}>{totalApiCalls}</div>
              </div>

              <div style={{ backgroundColor: "#111b21", border: "1px solid #222d34", borderRadius: "16px", padding: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                  <span style={{ fontSize: "12px", color: "#8696a0", textTransform: "uppercase", fontWeight: 600 }}>Failed / Errors</span>
                  <span style={{ fontSize: "20px" }}>⚠️</span>
                </div>
                <div style={{ fontSize: "32px", fontWeight: 800, color: "#ef4444" }}>{failedRequests}</div>
              </div>
            </div>

            {/* API Logs Table */}
            <div style={{ backgroundColor: "#111b21", border: "1px solid #222d34", borderRadius: "16px", overflow: "hidden" }}>
              <div style={{ padding: "20px", borderBottom: "1px solid #222d34" }}>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>Live API Logs</h3>
                <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#8696a0" }}>Showing last {logs.length} requests</p>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#0b141a" }}>
                      <th style={{ padding: "12px 20px", textAlign: "left", fontSize: "11px", color: "#8696a0", textTransform: "uppercase" }}>Status</th>
                      <th style={{ padding: "12px 20px", textAlign: "left", fontSize: "11px", color: "#8696a0", textTransform: "uppercase" }}>Model</th>
                      <th style={{ padding: "12px 20px", textAlign: "left", fontSize: "11px", color: "#8696a0", textTransform: "uppercase" }}>API Key</th>
                      <th style={{ padding: "12px 20px", textAlign: "left", fontSize: "11px", color: "#8696a0", textTransform: "uppercase" }}>Latency</th>
                      <th style={{ padding: "12px 20px", textAlign: "left", fontSize: "11px", color: "#8696a0", textTransform: "uppercase" }}>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} style={{ borderBottom: "1px solid #111b21" }}>
                        <td style={{ padding: "14px 20px", fontSize: "13px" }}>
                          <span style={{ padding: "2px 10px", borderRadius: "9999px", fontSize: "11px", fontWeight: 600, backgroundColor: log.status === "success" ? "#14532d" : "#450a0a", color: log.status === "success" ? "#4ade80" : "#f87171" }}>{log.status}</span>
                        </td>
                        <td style={{ padding: "14px 20px", fontSize: "13px", color: "#a855f7", fontWeight: 600 }}>{log.model}</td>
                        <td style={{ padding: "14px 20px", fontSize: "13px", color: "#cbd5e1" }}>Key {log.api_key_index + 1}</td>
                        <td style={{ padding: "14px 20px", fontSize: "13px", color: "#94a3b8" }}>{log.latency_ms}ms</td>
                        <td style={{ padding: "14px 20px", fontSize: "13px", color: "#64748b" }}>{new Date(log.created_at).toLocaleTimeString()}</td>
                      </tr>
                    ))}
                    {logs.length === 0 && (
                      <tr><td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "#475569" }}>No API calls logged yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
