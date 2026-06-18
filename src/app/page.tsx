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

export default function Dashboard() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChat, setActiveChat] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  // 1. Fetch Conversations on Mount
  useEffect(() => {
    const fetchConversations = async () => {
      const { data } = await supabase
        .from("conversations")
        .select("*")
        .order("updated_at", { ascending: false });
      if (data) setConversations(data as Conversation[]);
    };

    fetchConversations();

    // Realtime: Update conversation list when a new chat starts
    const convChannel = supabase
      .channel("conversations-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        () => fetchConversations()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(convChannel);
    };
  }, []);

  // 2. Fetch Messages when a chat is selected
  useEffect(() => {
    if (!activeChat) return;

    const fetchMessages = async () => {
      setLoadingMsgs(true);
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", activeChat.id)
        .order("created_at", { ascending: true });
      
      if (data) setMessages(data as Message[]);
      setLoadingMsgs(false);
    };

    fetchMessages();

    // Realtime: Listen for new messages in THIS specific conversation
    const msgChannel = supabase
      .channel(`messages-${activeChat.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${activeChat.id}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(msgChannel);
    };
  }, [activeChat]);

  return (
    <div style={{ display: "flex", height: "100vh", backgroundColor: "#0b141a", color: "#e9edef", fontFamily: "Segoe UI, system-ui, sans-serif", overflow: "hidden" }}>
      
      {/* LEFT SIDEBAR (Contacts List) */}
      <div style={{ width: "30%", minWidth: "320px", borderRight: "1px solid #222d34", display: "flex", flexDirection: "column", backgroundColor: "#111b21" }}>
        {/* Top Bar */}
        <div style={{ padding: "10px 16px", backgroundColor: "#202c33", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "8px", backgroundColor: "#00a884", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>🧠</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: "15px" }}>Smrithi Control</div>
              <div style={{ fontSize: "11px", color: "#8696a0" }}>Live Dashboard</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button style={{ fontSize: "11px", padding: "5px 10px", borderRadius: "6px", backgroundColor: "rgba(239,68,68,0.2)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)", cursor: "pointer" }}>🛑 STOP AI</button>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ padding: "8px 12px", backgroundColor: "#111b21" }}>
          <div style={{ backgroundColor: "#202c33", borderRadius: "8px", padding: "8px 12px", fontSize: "13px", color: "#8696a0" }}>
            🔍 Search or start new chat
          </div>
        </div>

        {/* Conversations */}
        <div style={{ overflowY: "auto", flex: 1 }}>
          {conversations.length === 0 && (
            <div style={{ padding: "20px", textAlign: "center", color: "#8696a0", fontSize: "13px" }}>
              No chats yet. Send a WhatsApp message to your bot!
            </div>
          )}
          
          {conversations.map((convo) => (
            <div
              key={convo.id}
              onClick={() => setActiveChat(convo)}
              style={{
                padding: "12px 16px",
                borderBottom: "1px solid #222d34",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                backgroundColor: activeChat?.id === convo.id ? "#2a3942" : "transparent",
                borderLeft: activeChat?.id === convo.id ? "3px solid #00a884" : "3px solid transparent",
              }}
            >
              <div style={{ width: "44px", height: "44px", borderRadius: "50%", backgroundColor: "#6a7175", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", color: "#0b141a", fontWeight: "bold" }}>
                {convo.profile_name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, overflow: "hidden" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: 600, fontSize: "15px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{convo.profile_name}</span>
                  <span style={{ fontSize: "11px", color: "#00a884" }}>{new Date(convo.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div style={{ fontSize: "13px", color: "#8696a0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {convo.mobile}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MIDDLE CHAT WINDOW */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", backgroundColor: "#0b141a", backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23222e35\" fill-opacity=\"0.4\"%3E%3Cpath d=\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')" }}>
        {!activeChat ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#8696a0", textAlign: "center", flexDirection: "column" }}>
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>💬</div>
            <h2>Smrithi Dashboard</h2>
            <p>Select a chat to view the conversation.</p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div style={{ padding: "10px 16px", backgroundColor: "#202c33", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #222d34" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "#6a7175", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", color: "#0b141a", fontWeight: "bold" }}>
                  {activeChat.profile_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "15px" }}>{activeChat.profile_name}</div>
                  <div style={{ fontSize: "12px", color: "#8696a0" }}>{activeChat.mobile} • online</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", backgroundColor: "rgba(0,0,0,0.3)", borderRadius: "12px", padding: "2px", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <button style={{ padding: "4px 10px", fontSize: "11px", borderRadius: "10px", backgroundColor: "#00a884", color: "#000", fontWeight: 600, border: "none", cursor: "pointer" }}>AI</button>
                  <button style={{ padding: "4px 10px", fontSize: "11px", borderRadius: "10px", color: "#8696a0", border: "none", cursor: "pointer", backgroundColor: "transparent" }}>MANUAL</button>
                </div>
                <button style={{ fontSize: "11px", padding: "5px 10px", borderRadius: "6px", backgroundColor: "rgba(255,255,255,0.1)", color: "#e9edef", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer" }}>⏸️ Pause AI</button>
              </div>
            </div>

            {/* Chat Messages Area */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
              
              {loadingMsgs && (
                <div style={{ textAlign: "center", color: "#8696a0", fontSize: "14px" }}>Loading messages...</div>
              )}

              {!loadingMsgs && messages.length === 0 && (
                <div style={{ textAlign: "center", color: "#8696a0", fontSize: "14px" }}>No messages in this chat yet.</div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    maxWidth: "65%",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    fontSize: "14px",
                    lineHeight: "1.4",
                    alignSelf: msg.role === "user" ? "flex-start" : "flex-end",
                    backgroundColor: msg.role === "user" ? "#202c33" : "#005c4b",
                    color: "#e9edef",
                  }}
                >
                  {msg.content ? msg.content : <span style={{ fontStyle: "italic", color: "#8696a0" }}>[{msg.message_type} shared]</span>}
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", textAlign: "right", marginTop: "4px" }}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>

            {/* Fake Input Box */}
            <div style={{ padding: "12px 16px", backgroundColor: "#202c33", display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ flex: 1, backgroundColor: "#2a3942", borderRadius: "8px", padding: "12px 16px", color: "#8696a0", fontSize: "14px" }}>
                AI is replying... Switch to MANUAL to type
              </div>
              <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "rgba(0,168,132,0.5)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                ➤
              </div>
            </div>
          </>
        )}
      </div>

      {/* RIGHT SIDEBAR (User Profile & Controls) */}
      <div style={{ width: "25%", minWidth: "280px", borderLeft: "1px solid #222d34", backgroundColor: "#111b21", display: "flex", flexDirection: "column", padding: "16px", gap: "12px" }}>
        {activeChat ? (
          <>
            <div style={{ textAlign: "center", paddingBottom: "16px", borderBottom: "1px solid #222d34" }}>
              <div style={{ width: "80px", height: "80px", borderRadius: "50%", backgroundColor: "#6a7175", margin: "0 auto 10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px", color: "#0b141a", fontWeight: "bold" }}>
                {activeChat.profile_name.charAt(0).toUpperCase()}
              </div>
              <div style={{ fontSize: "16px", fontWeight: 600 }}>{activeChat.profile_name}</div>
              <div style={{ fontSize: "12px", color: "#8696a0" }}>{activeChat.mobile}</div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", fontSize: "13px", color: "#e9edef" }}>
              <h4 style={{ color: "#8696a0", fontSize: "12px", textTransform: "uppercase", marginBottom: "8px" }}>AI Extracted Memory</h4>
              <div style={{ backgroundColor: "#202c33", padding: "12px", borderRadius: "8px", marginBottom: "12px" }}>
                <div style={{ marginBottom: "8px" }}><strong style={{ color: "#8696a0" }}>Status:</strong> <span style={{ color: "#00a884" }}>● Active</span></div>
                <div style={{ marginBottom: "8px" }}><strong style={{ color: "#8696a0" }}>Total Messages:</strong> {messages.length}</div>
                <div style={{ marginBottom: "8px" }}><strong style={{ color: "#8696a0" }}>First Seen:</strong> {new Date(activeChat.updated_at).toLocaleDateString()}</div>
              </div>
              
              <h4 style={{ color: "#8696a0", fontSize: "12px", textTransform: "uppercase", marginBottom: "8px" }}>Admin Controls</h4>
              <button style={{ width: "100%", padding: "10px", borderRadius: "8px", backgroundColor: "rgba(239,68,68,0.2)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)", cursor: "pointer", marginBottom: "8px" }}>🛑 Pause AI for this user</button>
              <button style={{ width: "100%", padding: "10px", borderRadius: "8px", backgroundColor: "rgba(14,165,233,0.2)", color: "#60a5fa", border: "1px solid rgba(14,165,233,0.3)", cursor: "pointer" }}>View Raw JSON Data</button>
            </div>
          </>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#8696a0", textAlign: "center", fontSize: "13px" }}>
            Select a chat to view user profile and AI controls.
          </div>
        )}
      </div>
    </div>
  );
}
