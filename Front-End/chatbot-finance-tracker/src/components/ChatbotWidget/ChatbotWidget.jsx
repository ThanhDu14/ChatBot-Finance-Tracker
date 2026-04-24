import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, Send, User } from 'lucide-react';

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, sender: 'ai', text: 'Chào Thanh Du! Bạn muốn ghi chép khoản chi tiêu nào hôm nay?', time: '10:00 AM' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const toggleChat = () => setIsOpen(!isOpen);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isTyping]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const newUserMsg = {
      id: Date.now(),
      sender: 'user',
      text: inputValue,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages([...messages, newUserMsg]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: Date.now(),
        sender: 'ai',
        text: 'Đã ghi nhận! Mình vừa cập nhật dữ liệu của bạn.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 1500);
  };

  return (
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end gap-4">
      {/* Chat Panel */}
      {isOpen && (
        <div className="w-[350px] h-[500px] glass-panel bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-white/40 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-gradient-to-br from-[#005ab6] to-[#1672df] p-4 flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="w-5 h-5 fill-current" />
              </div>
              <div>
                <p className="text-sm font-bold">Trợ lý Tài chính AI</p>
                <p className="text-[10px] opacity-80">Trực tuyến</p>
              </div>
            </div>
            <button onClick={toggleChat} className="hover:bg-white/20 p-1 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-slate-50/50">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col gap-1 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto items-end' : ''}`}>
                <div className={`p-3 text-sm leading-relaxed ${
                  msg.sender === 'user' 
                    ? 'bg-primary text-white rounded-2xl rounded-tr-none' 
                    : 'bg-white shadow-sm border border-slate-100 text-on-surface rounded-2xl rounded-tl-none'
                }`}>
                  {msg.text}
                </div>
                <span className="text-[10px] text-on-surface-variant px-1">
                  {msg.sender === 'user' ? 'Bạn' : 'AI'} • {msg.time}
                </span>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex flex-col gap-1 max-w-[85%]">
                <div className="bg-white shadow-sm border border-slate-100 p-4 rounded-2xl rounded-tl-none flex items-center gap-1.5 w-16">
                  <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                  <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="p-4 border-t border-slate-100 bg-white">
            <form onSubmit={handleSend} className="flex items-center gap-2 bg-surface-container-low rounded-full px-4 py-2 focus-within:ring-2 ring-primary/20 transition-all">
              <input 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm p-0 placeholder:text-outline" 
                placeholder="Nhập chi tiêu hoặc hỏi AI..." 
                type="text"
              />
              <button type="submit" disabled={!inputValue.trim()} className="text-primary hover:text-primary-container disabled:opacity-50 transition-colors">
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button 
        onClick={toggleChat}
        className={`w-16 h-16 bg-gradient-to-br from-[#005ab6] to-[#1672df] text-white rounded-full flex items-center justify-center shadow-[0_8px_24px_rgba(0,90,182,0.3)] hover:scale-105 active:scale-95 transition-all duration-300 ${isOpen ? 'scale-0 opacity-0 hidden' : 'scale-100 opacity-100'}`}
      >
        <Bot className="w-8 h-8 fill-current" />
      </button>
    </div>
  );
};

export default ChatbotWidget;
