"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Types
interface Conversation {
  id: string;
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
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChat, setActiveChat] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [totalApiCalls, setTotalApiCalls] = useState(0);

  // 1. Fetch Conversations & API Logs on Mount
  useEffect(() => {
    fetchConversations();
    fetchApiLogs();

    // Subscribe to Realtime Messages
    const msgChannel = supabase
      .channel("messages-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => [...prev, newMsg]);
        }
      )
      .subscribe();

    // Subscribe to Realtime API Logs
    const logChannel = supabase
      .channel("logs-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "api_logs" },
        (payload) => {
          const newLog = payload.new as ApiLog;
          setLogs((prev) => [newLog, ...prev].slice(0, 50));
          setTotalApiCalls((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(logChannel);
    };
  }, []);

  // Fetch messages when active chat changes
  useEffect(() => {
    if (activeChat) fetchMessages(activeChat.id);
  }, [activeChat]);

  const fetchConversations = async () => {
    const { data } = await supabase
      .from("conversations")
      .select("*")
      .order("updated_at", { ascending: false });
    if (data) setConversations(data as Conversation[]);
  };

  const fetchMessages = async (chatId: string) => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", chatId)
      .order("created_at", { ascending: true });
    if (data) setMessages(data as Message[]);
  };

  const fetchApiLogs = async () => {
    const { data: logsData } = await supabase
      .from("api_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    
    if (logsData) setLogs(logsData as ApiLog[]);

    const { count } = await supabase
      .from("api_logs")
      .select("*", { count: "exact", head: true });
    
    setTotalApiCalls(count || 0);
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar: Conversations */}
      <div className="w-1/4 border-r border-gray-700 flex flex-col">
        <div className="p-4 bg-gray-800 font-bold text-lg border-b border-gray-700">
          💬 Smrithi Chats
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map((convo) => (
            <div
              key={convo.id}
              onClick={() => setActiveChat(convo)}
              className={`p-4 border-b border-gray-800 cursor-pointer hover:bg-gray-800 ${
                activeChat?.id === convo.id ? "bg-gray-700" : ""
              }`}
            >
              <div className="font-semibold">{convo.profile_name}</div>
              <div className="text-xs text-gray-400">{convo.mobile}</div>
            </div>
          ))}
          {conversations.length === 0 && (
            <div className="p-4 text-center text-gray-500 text-sm">
              No conversations yet. Send a WhatsApp message to your bot!
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Window */}
      <div className="flex-1 flex flex-col">
        {activeChat ? (
          <>
            <div className="p-4 bg-gray-800 font-bold border-b border-gray-700 sticky top-0">
              {activeChat.profile_name}
              <span className="text-xs text-gray-400 ml-2">{activeChat.mobile}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-900 bg-opacity-50">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-xs p-3 rounded-lg shadow ${
                      msg.role === "user"
                        ? "bg-gray-700 text-white rounded-bl-none"
                        : "bg-green-600 text-white rounded-br-none"
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <p className="text-[10px] text-gray-300 mt-1 text-right">
                      {new Date(msg.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a chat to view the conversation
          </div>
        )}
      </div>

      {/* Right Sidebar: API Logs & Analytics */}
      <div className="w-1/4 border-l border-gray-700 flex flex-col bg-gray-900">
        <div className="p-4 bg-gray-800 font-bold text-lg border-b border-gray-700">
          📊 API Analytics
        </div>
        
        <div className="p-4 grid grid-cols-2 gap-3 border-b border-gray-700">
          <div className="bg-gray-800 p-3 rounded-lg text-center">
            <p className="text-xs text-gray-400">Total Requests</p>
            <p className="text-2xl font-bold text-blue-400">{totalApiCalls}</p>
          </div>
          <div className="bg-gray-800 p-3 rounded-lg text-center">
            <p className="text-xs text-gray-400">Active Keys</p>
            <p className="text-2xl font-bold text-green-400">2</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">Live Logs</h3>
          {logs.map((log) => (
            <div key={log.id} className="bg-gray-800 p-3 rounded-md text-xs">
              <div className="flex justify-between items-center mb-1">
                <span className={`px-2 py-0.5 rounded font-mono ${
                  log.status === "success" ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"
                }`}>
                  {log.status}
                </span>
                <span className="text-gray-500">{log.latency_ms}ms</span>
              </div>
              <div className="font-bold text-purple-400 truncate">{log.model}</div>
              <div className="text-gray-400 mt-1 flex justify-between">
                <span>Key {log.api_key_index + 1}</span>
                <span>{new Date(log.created_at).toLocaleTimeString()}</span>
              </div>
            </div>
          ))}
          {logs.length === 0 && (
            <p className="text-gray-500 text-center text-sm mt-10">No API calls yet...</p>
          )}
        </div>
      </div>
    </div>
  );
}
