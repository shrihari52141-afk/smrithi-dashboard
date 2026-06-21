'use client';

import React, { useState, useEffect } from 'react';

// Types
interface User {
  id: number;
  phone: string;
  name: string;
  nickname: string;
  gender: string;
  language: string;
  mode: 'ai' | 'manual';
  lastActive: string;
  active: boolean;
  totalMsgs: number;
}

interface Message {
  id: number;
  from: 'user' | 'ai' | 'manual';
  text: string;
  time: string;
}

// Mock data - Replace with real Supabase/API calls
const initialUsers: User[] = [
  { id: 1, phone: "919876543210", name: "Chaaru Shree", nickname: "Chaaru", gender: "female", language: "Tamil", mode: "ai", lastActive: "2026-06-21T10:14:00", active: true, totalMsgs: 128 },
  { id: 2, phone: "919812345678", name: "Rahul Sharma", nickname: "Rahul", gender: "male", language: "Hindi", mode: "manual", lastActive: "2026-06-21T09:50:00", active: true, totalMsgs: 94 },
  { id: 3, phone: "918765432109", name: "Ananya Rao", nickname: "Anu", gender: "female", language: "Telugu", mode: "ai", lastActive: "2026-06-20T18:30:00", active: false, totalMsgs: 312 },
  { id: 4, phone: "919912345678", name: "Arjun Menon", nickname: "Arjun", gender: "male", language: "Malayalam", mode: "ai", lastActive: "2026-06-21T11:05:00", active: true, totalMsgs: 67 },
];

const initialMessages: Record<string, Message[]> = {
  "919876543210": [
    { id: 1, from: "user", text: "Heyy 👀", time: "10:12" },
    { id: 2, from: "ai", text: "Enna da! Epdi irukka? 😊", time: "10:13" },
    { id: 3, from: "user", text: "Packing luggage for home", time: "10:14" },
    { id: 4, from: "ai", text: "Oh veetuku poriya? Safe journey da 🥺", time: "10:14" },
  ],
  "919812345678": [
    { id: 1, from: "user", text: "Bhai exam result kab aayega?", time: "09:45" },
    { id: 2, from: "manual", text: "Arre bhai result toh 28 ko aa raha hai!", time: "09:48" },
  ],
};

export default function SmrithiDashboard() {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [messages, setMessages] = useState<Record<string, Message[]>>(initialMessages);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [globalMode, setGlobalMode] = useState<'ai' | 'manual'>('ai');
  const [newUserDefault, setNewUserDefault] = useState<'ai' | 'manual'>('ai');
  
  const [messageInput, setMessageInput] = useState('');
  const [broadcastInput, setBroadcastInput] = useState('');
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponses, setAiResponses] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [stats, setStats] = useState({
    totalUsers: 248,
    messagesToday: 1842,
    activeToday: 92,
    apiRequests: 4291,
    aiReplies: 1671,
    manual: 38,
  });

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone.includes(searchTerm) ||
    user.nickname.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectUser = (user: User) => {
    setCurrentUser(user);
    setAiResponses([]);
  };

  const renderMessages = () => {
    if (!currentUser || !messages[currentUser.phone]) {
      return (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
          Select a user to view the chat
        </div>
      );
    }

    return messages[currentUser.phone].map((msg) => {
      const isSent = msg.from === 'ai' || msg.from === 'manual';
      return (
        <div key={msg.id} className={`flex mb-2 ${isSent ? 'justify-end' : 'justify-start'}`}>
          <div className={`message-bubble max-w-[75%] px-4 py-2 text-sm rounded-2xl ${isSent ? 'bg-[#dcf8c6] rounded-br-none' : 'bg-white rounded-bl-none'}`}>
            <div>{msg.text}</div>
            <div className="text-[10px] text-gray-500 text-right mt-1">{msg.time}</div>
          </div>
        </div>
      );
    });
  };

  const sendMessage = () => {
    if (!currentUser || !messageInput.trim()) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newMsg: Message = {
      id: Date.now(),
      from: currentUser.mode === 'manual' ? 'manual' : 'ai',
      text: messageInput.trim(),
      time,
    };

    setMessages(prev => ({
      ...prev,
      [currentUser.phone]: [...(prev[currentUser.phone] || []), newMsg]
    }));

    setMessageInput('');
  };

  const toggleUserMode = (mode: 'ai' | 'manual') => {
    if (!currentUser) return;

    const updatedUser = { ...currentUser, mode };
    setUsers(prev => prev.map(u => u.phone === currentUser.phone ? updatedUser : u));
    setCurrentUser(updatedUser);
  };

  const setGlobalModeHandler = (mode: 'ai' | 'manual') => {
    setGlobalMode(mode);
    setUsers(prev => prev.map(u => ({ ...u, mode })));
    if (currentUser) setCurrentUser({ ...currentUser, mode });
  };

  const emergencyStop = () => {
    if (!confirm("⚠️ This will STOP AI for ALL users. Continue?")) return;
    setGlobalMode('manual');
    setUsers(prev => prev.map(u => ({ ...u, mode: 'manual' } as User)));
    if (currentUser) setCurrentUser({ ...currentUser, mode: 'manual' });
    alert("EMERGENCY STOP ACTIVATED — AI disabled globally");
  };

  const sendBroadcast = () => {
    if (!broadcastInput.trim()) return;
    if (!confirm(`Send to all ${users.length} users?`)) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setMessages(prev => {
      const updated = { ...prev };
      users.forEach(user => {
        if (!updated[user.phone]) updated[user.phone] = [];
        updated[user.phone].push({
          id: Date.now() + Math.random(),
          from: 'ai',
          text: `📢 ${broadcastInput.trim()}`,
          time,
        });
      });
      return updated;
    });

    setBroadcastInput('');
  };

  const useAIForBroadcast = () => {
    const suggestions = [
      "Hey everyone! Just a quick check-in from Smrithi 👀 How's your day going?",
      "Good morning da! Hope you're having a great day 🥺",
      "Reminder: If you told me about any plans, I've got you covered 🫂",
    ];
    setBroadcastInput(suggestions[Math.floor(Math.random() * suggestions.length)]);
  };

  const askUserAI = () => {
    if (!currentUser || !aiQuery.trim()) return;

    const query = aiQuery.trim();
    setAiResponses(prev => [...prev, { type: 'user', text: query }]);

    setTimeout(() => {
      let response = "";
      const q = query.toLowerCase();

      if (q.includes("reminder")) response = `User has 3 active reminders. Latest: "Joining on 22nd".`;
      else if (q.includes("memory")) response = `Top memories: Packing for home, family pressure, OCD cleaning.`;
      else if (q.includes("language")) response = `Preferred language: ${currentUser.language}. Uses Roman script only.`;
      else if (q.includes("active")) response = `Sent 17 messages today. Mood: slightly stressed.`;
      else if (q.includes("summary")) response = `${currentUser.name} — ${currentUser.language} background. Female, 22. Has job starting soon.`;
      else response = `Total messages: ${currentUser.totalMsgs}. Language: ${currentUser.language}. Mode: ${currentUser.mode}.`;

      setAiResponses(prev => [...prev, { type: 'ai', text: response }]);
    }, 700);

    setAiQuery('');
  };

  // Live stats demo
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        messagesToday: prev.messagesToday + Math.floor(Math.random() * 2),
        activeToday: Math.max(85, Math.min(105, prev.activeToday + (Math.random() > 0.7 ? 1 : 0))),
      }));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Bar */}
      <div className="bg-white border-b">
        <div className="max-w-[1480px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-emerald-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xl">🤖</span>
              </div>
              <span className="font-bold text-2xl tracking-tight">Smrithi</span>
              <span className="text-xs text-emerald-600 ml-1 font-mono">v2.0</span>
            </div>
            <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">PRODUCTION</div>
          </div>

          <div className="flex items-center gap-3">
            {/* Global Mode Toggle */}
            <div className="flex bg-white border rounded-2xl p-1 text-sm">
              <button onClick={() => setGlobalModeHandler('ai')} className={`px-4 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-semibold transition-all ${globalMode === 'ai' ? 'bg-emerald-600 text-white' : 'hover:bg-gray-100'}`}>🤖 AI MODE</button>
              <button onClick={() => setGlobalModeHandler('manual')} className={`px-4 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-semibold transition-all ${globalMode === 'manual' ? 'bg-emerald-600 text-white' : 'hover:bg-gray-100'}`}>👤 MANUAL</button>
            </div>

            {/* Emergency Stop */}
            <button onClick={emergencyStop} className="flex items-center gap-2 px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-2xl">⛔ EMERGENCY STOP</button>

            <div className="flex items-center gap-2">
              <div className="text-right text-sm"><div className="font-semibold">Shreehari</div><div className="text-[10px] text-gray-500">Mangalore</div></div>
              <div className="w-8 h-8 bg-gray-300 rounded-full overflow-hidden"><img src="https://i.pravatar.cc/32?img=68" alt="avatar" /></div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1480px] mx-auto p-4">
        {/* Stats Row */}
        <div className="mb-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white rounded-3xl p-4 border"><div className="text-xs text-gray-500">TOTAL USERS</div><div className="text-3xl font-bold">{stats.totalUsers}</div></div>
          <div className="bg-white rounded-3xl p-4 border"><div className="text-xs text-gray-500">MESSAGES TODAY</div><div className="text-3xl font-bold">{stats.messagesToday}</div></div>
          <div className="bg-white rounded-3xl p-4 border"><div className="text-xs text-gray-500">ACTIVE (24h)</div><div className="text-3xl font-bold">{stats.activeToday}</div></div>
          <div className="bg-white rounded-3xl p-4 border"><div className="text-xs text-gray-500">API REQUESTS</div><div className="text-3xl font-bold">{stats.apiRequests}</div></div>
          <div className="bg-white rounded-3xl p-4 border"><div className="text-xs text-gray-500">AI REPLIES</div><div className="text-3xl font-bold">{stats.aiReplies}</div></div>
          <div className="bg-white rounded-3xl p-4 border"><div className="text-xs text-gray-500">MANUAL MODE</div><div className="text-3xl font-bold">{stats.manual}</div></div>
        </div>

        {/* Broadcast */}
        <div className="bg-white border rounded-3xl p-4 mb-4 flex items-center gap-4">
          <div className="flex-1">
            <div className="text-sm font-semibold mb-1.5">📢 Broadcast to ALL users</div>
            <div className="flex gap-2">
              <input type="text" value={broadcastInput} onChange={(e) => setBroadcastInput(e.target.value)} placeholder="Type message..." className="flex-1 border rounded-2xl px-4 py-2 text-sm" />
              <button onClick={sendBroadcast} className="px-5 bg-emerald-600 text-white rounded-2xl text-sm font-semibold">Send</button>
              <button onClick={useAIForBroadcast} className="px-4 border rounded-2xl text-sm">Use AI</button>
            </div>
          </div>
          <div>
            <div className="text-xs font-medium mb-1">New users default:</div>
            <div className="flex gap-1 text-xs">
              <button onClick={() => setNewUserDefault('ai')} className={`px-3 py-1 rounded-full ${newUserDefault === 'ai' ? 'bg-emerald-600 text-white' : 'bg-gray-200'}`}>AI</button>
              <button onClick={() => setNewUserDefault('manual')} className={`px-3 py-1 rounded-full ${newUserDefault === 'manual' ? 'bg-emerald-600 text-white' : 'bg-gray-200'}`}>Manual</button>
            </div>
          </div>
        </div>

        {/* Main 3-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Users List */}
          <div className="lg:col-span-3 bg-white border rounded-3xl flex flex-col h-[680px] overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <div className="font-semibold mb-3">All Users ({users.length})</div>
              <input type="text" placeholder="Search users..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full border rounded-2xl px-3 py-2 text-sm" />
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredUsers.map(user => (
                <div key={user.phone} onClick={() => selectUser(user)} className={`px-4 py-3 flex gap-3 cursor-pointer border-b hover:bg-gray-50 ${currentUser?.phone === user.phone ? 'bg-gray-100' : ''}`}>
                  <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0"><img src={`https://i.pravatar.cc/36?u=${user.phone}`} alt="" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between"><div className="font-medium truncate">{user.name}</div><div className="text-xs text-gray-400">{user.lastActive.split('T')[1]?.slice(0,5)}</div></div>
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-gray-500">{user.language}</span>
                      <span className={`px-1.5 py-px rounded text-[10px] text-white ${user.mode === 'ai' ? 'bg-emerald-500' : 'bg-amber-500'}`}>{user.mode.toUpperCase()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Window */}
          <div className="lg:col-span-6 bg-white border rounded-3xl flex flex-col h-[680px] overflow-hidden">
            <div className="px-4 py-3 bg-[#00a884] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                {currentUser ? (
                  <>
                    <div className="w-9 h-9 rounded-full overflow-hidden"><img src={`https://i.pravatar.cc/36?u=${currentUser.phone}`} alt="" /></div>
                    <div>
                      <div className="font-semibold">{currentUser.name}</div>
                      <div className="text-xs text-white/80">{currentUser.language} • {currentUser.active ? 'Online' : 'Offline'}</div>
                    </div>
                  </>
                ) : <div className="font-semibold">Select a user</div>}
              </div>

              {currentUser && (
                <div className="flex bg-white/20 rounded-2xl p-1 text-xs">
                  <button onClick={() => toggleUserMode('ai')} className={`px-3 py-1 rounded-l-2xl ${currentUser.mode === 'ai' ? 'bg-white text-emerald-700 font-semibold' : ''}`}>🤖 AI</button>
                  <button onClick={() => toggleUserMode('manual')} className={`px-3 py-1 rounded-r-2xl ${currentUser.mode === 'manual' ? 'bg-white text-emerald-700 font-semibold' : ''}`}>👤 Manual</button>
                </div>
              )}
            </div>

            <div className="flex-1 p-4 overflow-y-auto bg-[#e5ddd5]" style={{ backgroundImage: 'url(https://picsum.photos/id/1015/800/800)', backgroundSize: 'cover', opacity: 0.92 }}>
              {renderMessages()}
            </div>

            <div className="p-3 bg-white border-t flex items-center gap-2">
              <input type="text" value={messageInput} onChange={(e) => setMessageInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} placeholder="Type a message..." className="flex-1 border rounded-3xl px-4 py-2 text-sm" disabled={!currentUser} />
              <button onClick={sendMessage} className="text-emerald-600 px-2" disabled={!currentUser}>✈️</button>
            </div>
          </div>

          {/* Right AI Assistant */}
          <div className="lg:col-span-3 bg-white border rounded-3xl flex flex-col h-[680px]">
            <div className="p-4 border-b bg-gray-50">
              <div className="font-semibold text-sm">User AI Assistant</div>
              <div className="text-xs text-gray-500">Ask about this user</div>
            </div>

            <div className="flex-1 p-3 overflow-y-auto bg-gray-50 text-sm space-y-3">
              {!currentUser ? (
                <div className="text-center text-gray-400 text-xs py-8">Select a user to ask the AI</div>
              ) : (
                aiResponses.map((res, i) => (
                  <div key={i} className={res.type === 'user' ? 'text-right' : ''}>
                    <div className={`inline-block px-3 py-1.5 rounded-2xl text-sm max-w-[85%] ${res.type === 'user' ? 'bg-emerald-100' : 'bg-white border'}`}>
                      {res.text}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 border-t bg-white">
              <div className="flex gap-2">
                <input value={aiQuery} onChange={(e) => setAiQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && askUserAI()} placeholder="Ask about this user..." className="flex-1 border rounded-3xl px-3 py-1.5 text-sm" disabled={!currentUser} />
                <button onClick={askUserAI} className="px-4 bg-emerald-600 text-white rounded-3xl text-xs font-semibold" disabled={!currentUser}>Ask</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
