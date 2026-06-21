@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: 'Inter', system-ui, sans-serif;
}

.message-bubble {
  max-width: 72%;
  padding: 8px 13px;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.35;
}

.message-bubble.sent {
  background-color: #dcf8c6;
  border-bottom-right-radius: 4px;
}

.message-bubble.received {
  background-color: white;
  border-bottom-left-radius: 4px;
  box-shadow: 0 1px 0.5px rgba(0, 0, 0, 0.1);
}

.chat-bg {
  background-color: #e5ddd5;
  background-image: 
    linear-gradient(rgba(229, 221, 213, 0.88), rgba(229, 221, 213, 0.88)),
    url('https://picsum.photos/id/1015/800/800');
  background-size: cover;
  background-position: center;
}

.user-row {
  transition: background-color 0.1s;
}

.user-row:hover {
  background-color: #f3f4f6;
}

.user-row.active {
  background-color: #e5e7eb;
}

.stat-card {
  transition: transform 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-1px);
}

.whatsapp-header {
  background: #00a884;
}
