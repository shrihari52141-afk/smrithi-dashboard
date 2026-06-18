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
    <div style={{ display: "flex", height: "100vh", backgroundColor: "#0b141a", color: "#e9edef", fontFamily: "Segoe UI, system-ui, sans-serif" }}>
      
      {/* LEFT SIDEBAR (Contacts) */}
      <div style={{ width: "30%", minWidth: "300px", borderRight: "1px solid #202c33", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "16px", backgroundColor: "#202c33", fontWeight: "bold", fontSize: "20px", display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "#00a884", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>🤖</div>
          Smrithi Monitor
        </div>
        
        <div style={{ overflowY: "auto", flex: 1 }}>
          {conversations.length === 0 && (
            <div style={{ padding: "20px", textAlign: "center", color: "#8696a0" }}>
              No chats yet. Send a WhatsApp message to your bot!
            </div>
          )}
          
          {conversations.map((convo) => (
            <div
              key={convo.id}
              onClick={() => setActiveChat(convo)}
              style={{
                padding: "16px",
                borderBottom: "1px solid #202c33",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                backgroundColor: activeChat?.id === convo.id ? "#2a3942" : "transparent",
                transition: "background 0.2s",
              }}
            >
              <div style={{ width: "44px", height: "44px", borderRadius: "50%", backgroundColor: "#6a7175", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", color: "#0b141a", fontWeight: "bold" }}>
                {convo.profile_name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, overflow: "hidden" }}>
                <div style={{ fontWeight: 600, fontSize: "15px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {convo.profile_name}
                </div>
                <div style={{ fontSize: "12px", color: "#8696a0" }}>
                  {convo.mobile}
                </div>
              </div>
              <div style={{ fontSize: "11px", color: "#8696a0" }}>
                {new Date(convo.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT SIDEBAR (Chat Window) */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", backgroundImage: "linear-gradient(rgba(11, 20, 26, 0.9), rgba(11, 20, 26, 0.9))" }}>
        {!activeChat ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#8696a0", textAlign: "center", flexDirection: "column" }}>
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>💬</div>
            <h2>Smrithi Dashboard</h2>
            <p>Select a chat to view the conversation.</p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div style={{ padding: "16px", backgroundColor: "#202c33", display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid #2a3942" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "#6a7175", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", color: "#0b141a", fontWeight: "bold" }}>
                {activeChat.profile_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>{activeChat.profile_name}</div>
                <div style={{ fontSize: "12px", color: "#8696a0" }}>{activeChat.mobile}</div>
              </div>
            </div>

            {/* Chat Messages Area */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "8px", backgroundColor: "#0b141a", backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23222e35\" fill-opacity=\"0.4\"%3E%3Cpath d=\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')" }}>
              
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
                    padding: "10px 14px",
                    borderRadius: "8px",
                    fontSize: "14px",
                    lineHeight: "1.4",
                    position: "relative",
                    boxShadow: "0 1px 0.5px rgba(0,0,0,0.13)",
                    alignSelf: msg.role === "user" ? "flex-start" : "flex-end",
                    backgroundColor: msg.role === "user" ? "#202c33" : "#005c4b",
                    color: "#e9edef",
                  }}
                >
                  {/* Display text or media placeholder */}
                  {msg.content ? msg.content : <span style={{ fontStyle: "italic", color: "#8696a0" }}>[{msg.message_type} shared]</span>}
                  
                  {/* Timestamp */}
                  <div style={{ fontSize: "11px", color: "#8696a0", textAlign: "right", marginTop: "4px" }}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>

            {/* Fake Input Box (For UI authenticity) */}
            <div style={{ padding: "16px", backgroundColor: "#202c33", display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ flex: 1, backgroundColor: "#2a3942", borderRadius: "8px", padding: "12px 16px", color: "#8696a0", fontSize: "14px" }}>
                Type a message (Admin monitoring mode)
              </div>
              <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "#00a884", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                📤
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
