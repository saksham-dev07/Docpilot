import React, { useState, useEffect, useRef } from 'react';
import { client, databases, APPWRITE_DATABASE_ID, APPWRITE_COLLECTIONS } from '../lib/appwrite';
import { X, Send, User } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
}

interface ChatWidgetProps {
  doctorId: string;
  patientId: string;
  sessionContext?: string;
  currentUserId: string;
  currentUserName: string;
  onClose: () => void;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ doctorId, patientId, sessionContext, currentUserId, currentUserName, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatId = `${doctorId}_${patientId}_chat`;

  useEffect(() => {

    const fetchMessages = async () => {
      try {
        const docSnap = await databases.getDocument(APPWRITE_DATABASE_ID, APPWRITE_COLLECTIONS.CONSULTATIONS, chatId);
        const data = docSnap;
        if (data.messages && Array.isArray(data.messages)) {
          setMessages(data.messages);
          // Auto-mark as read natively
          const lastMsg = data.messages[data.messages.length - 1];
          if (lastMsg && lastMsg.senderId !== currentUserId && !lastMsg.read) {
            const updatedMessages = data.messages.map((m: any) => ({ ...m, read: true }));
            await databases.updateDocument(APPWRITE_DATABASE_ID, APPWRITE_COLLECTIONS.CONSULTATIONS, chatId, { messages: updatedMessages }).catch(console.error);
          }
        }
      } catch (e) {
        // Doc might not exist yet
      }
    };

    fetchMessages();

    const interval = setInterval(fetchMessages, 3000);

    return () => clearInterval(interval);
  }, [chatId, currentUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: currentUserId,
      senderName: currentUserName,
      text: inputText.trim(),
      timestamp: new Date().toISOString()
    };

    setInputText('');
    try {
      try {
         const existingDoc = await databases.getDocument(APPWRITE_DATABASE_ID, APPWRITE_COLLECTIONS.CONSULTATIONS, chatId);
         await databases.updateDocument(APPWRITE_DATABASE_ID, APPWRITE_COLLECTIONS.CONSULTATIONS, chatId, {
            messages: [...(existingDoc.messages || []), newMessage]
         });
      } catch (e) {
         // Create it
         await databases.createDocument(APPWRITE_DATABASE_ID, APPWRITE_COLLECTIONS.CONSULTATIONS, chatId, {
            doctorId,
            patientId,
            doctorName: currentUserId === doctorId ? currentUserName : "Doctor",
            patientName: currentUserId === patientId ? currentUserName : "Patient",
            date: new Date().toISOString().split('T')[0],
            time: '00:00',
            status: 'Completed',
            messages: [newMessage]
         });
      }
    } catch (err: any) {
      console.error('Failed to send message:', err);
      alert('Error: ' + err.message);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-3rem)] h-[500px] bg-white rounded-3xl shadow-2xl flex flex-col z-50 overflow-hidden border border-slate-100">
      {/* Header */}
      <div className="p-4 bg-brand-600 text-white flex justify-between items-center shrink-0 shadow-sm z-10">
        <div>
          <h3 className="font-bold flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            Live Chat
          </h3>
          <p className="text-xs text-brand-100 ml-4">{sessionContext || 'Secure Channel'}</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
            <User className="w-12 h-12 mb-2 bg-slate-200 p-2 rounded-2xl" />
            <p className="text-sm font-bold">No messages yet.</p>
            <p className="text-xs">Start a secure conversation directly below.</p>
          </div>
        ) : (
          <>
            {sessionContext && (
              <div className="flex items-center gap-4 my-6 opacity-60">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{sessionContext}</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
            )}
            {messages.map((msg) => {
              const isMe = msg.senderId === currentUserId;
            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={msg.id}
                className={cn("flex flex-col max-w-[85%]", isMe ? "ml-auto items-end" : "mr-auto items-start")}
              >
                <span className="text-[10px] font-bold text-slate-400 mb-1 px-1">{isMe ? 'You' : msg.senderName}</span>
                <div className={cn("px-4 py-2.5 rounded-2xl text-sm leading-relaxed", isMe ? "bg-brand-600 text-white rounded-tr-none shadow-md shadow-brand-500/20" : "bg-white text-slate-700 border border-slate-100 shadow-sm rounded-tl-none")}>
                  {msg.text}
                </div>
              </motion.div>
            );
          })}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-50 flex gap-3 shrink-0">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 bg-slate-100 rounded-2xl px-5 py-3.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 placeholder:text-slate-400 transition-all border border-transparent focus:bg-white"
        />
        <button type="submit" disabled={!inputText.trim()} className="bg-brand-600 text-white w-12 h-12 flex items-center justify-center rounded-2xl disabled:opacity-50 hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20 shrink-0">
          <Send className="w-5 h-5 -ml-1" />
        </button>
      </form>
    </div>
  );
};
