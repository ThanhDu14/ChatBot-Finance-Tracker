import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, Send, User, Image as ImageIcon, Paperclip, Check, Trash2, Loader2, Mic, MicOff } from 'lucide-react';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, limit } from "firebase/firestore";
import { db } from "../../services/firebase";
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { uploadImage, sendMessage, saveTransaction } from '../../services/chatbotService';

const ChatbotWidget = () => {
  const { currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [savingMsgId, setSavingMsgId] = useState(null); // Chong click luu nhieu lan
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const unsubscribeRef = useRef(null);
  const abortControllerRef = useRef(null); // Huy request khi user logout/navigate away

  // ── Speech Recognition Setup ──
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'vi-VN';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        // Co the tu dong gui o day neu muon: handleSendVoice(transcript);
      };
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          toast.error('Vui lòng cho phép truy cập Micro để sử dụng tính năng này.');
        }
      };
      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error('Trình duyệt của bạn không hỗ trợ nhận diện giọng nói.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  // ── Load / real-time sync lich su chat tu Firestore ──
  useEffect(() => {
    if (!currentUser?.uid) return;

    const messagesRef = collection(db, 'chat_history', currentUser.uid, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'), limit(100));

    unsubscribeRef.current = onSnapshot(q, (snapshot) => {
      if (snapshot.empty && !historyLoaded) {
        // Lan dau, chua co lich su → hien tin nhan chao
        setMessages([
          {
            id: 'welcome',
            sender: 'ai',
            text: `Chào ${currentUser?.displayName || 'bạn'}! Bạn muốn ghi chép khoản chi tiêu nào hôm nay?`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else {
        const loaded = snapshot.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            firestoreId: d.id,
            sender: data.sender,
            text: data.text,
            image: data.image_url || null,
            transactionData: data.transactionData || null,
            confirmed: data.confirmed || false,
            time: data.timestamp?.toDate
              ? data.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : ''
          };
        });
        setMessages(loaded);
      }
      setHistoryLoaded(true);
    });

    return () => {
      unsubscribeRef.current?.();
      // Huy bat ky request dang xu ly khi user logout (currentUser thay doi)
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [currentUser?.uid]);


  const toggleChat = () => setIsOpen(!isOpen);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isTyping]);

  // ── Helper: luu 1 tin nhan vao Firestore ──
  const saveChatMessage = async (sender, text, extra = {}) => {
    if (!currentUser?.uid) return null;
    try {
      const messagesRef = collection(db, 'chat_history', currentUser.uid, 'messages');
      const docRef = await addDoc(messagesRef, {
        sender,
        text,
        timestamp: serverTimestamp(),
        ...extra,
      });
      return docRef.id;
    } catch (err) {
      console.error('[Firestore] Luu chat loi:', err);
      return null;
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };



  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() && !selectedImage) return;

    const userText = inputValue;
    const currentImage = selectedImage;
    const currentPreview = previewUrl;

    // Clear inputs
    setInputValue('');
    setSelectedImage(null);
    setPreviewUrl(null);

    const newUserMsg = {
      id: Date.now(),
      sender: 'user',
      text: userText,
      image: currentPreview,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newUserMsg]);
    setIsTyping(true);

    // Tao AbortController moi cho request nay
    // Neu co request cu dang chay → huy truoc
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const { signal } = controller;

    try {
      let imageUrl = null;
      if (currentImage) {
        setIsUploading(true);
        imageUrl = await uploadImage(currentImage, signal);
        setIsUploading(false);
      }

      // Luu tin nhan user vao Firestore
      await saveChatMessage('user', userText, {
        image_url: imageUrl || null,
      });

      // Goi chatbot service
      const data = await sendMessage({
        userId: currentUser.uid,
        message: userText,
        imageUrl,
        signal,
      });
      setIsTyping(false);

      const transactionData = data.amount > 0 ? data : null;

      // Luu tin nhan AI vao Firestore
      const firestoreId = await saveChatMessage('ai', data.reply_message, {
        transactionData: transactionData,
        confirmed: false,
      });

      // Hien thi AI message (onSnapshot se tu dong cap nhat,
      // nhung them ngay de UX nhanh hon)
      setMessages(prev => {
        // Tranh duplicate neu onSnapshot da cap nhat truoc
        if (firestoreId && prev.some(m => m.firestoreId === firestoreId)) return prev;
        const aiMsgId = Date.now();
        return [...prev, {
          id: aiMsgId,
          firestoreId,
          sender: 'ai',
          text: data.reply_message,
          transactionData,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }];
      });

    } catch (error) {
      // AbortError: user da logout/navigate away — khong hien thi loi
      if (error.name === 'AbortError') {
        console.log('[Chat] Request bi huy (user logout hoac chuyen trang)');
        setIsTyping(false);
        setIsUploading(false);
        return;
      }
      console.error("Chat error:", error);
      setIsTyping(false);
      setIsUploading(false);
      toast.error("Co loi xay ra khi ket noi voi AI.");
    }

  };

  const confirmTransaction = async (msgId, firestoreId, data) => {
    // Guard: chong click nhieu lan
    if (savingMsgId) return;
    setSavingMsgId(msgId);

    try {
      // Goi backend de luu giao dich + tu dong mark confirmed
      await saveTransaction({
        userId: currentUser.uid,
        amount: data.amount,
        category: data.category,
        note: data.note,
        chatMessageId: firestoreId || null,
      });

      toast.success('Đã lưu giao dịch thành công!');

      // Cap nhat UI ngay (onSnapshot cung se tu dong cap nhat)
      setMessages(prev => prev.map(msg =>
        msg.id === msgId ? { ...msg, transactionData: null, confirmed: true } : msg
      ));
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Không thể lưu giao dịch: ' + error.message);
    } finally {
      setSavingMsgId(null);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-[100] flex flex-col items-end gap-4">
      {/* Chat Panel */}
      {isOpen && (
        <div className="w-[calc(100vw-32px)] sm:w-[380px] h-[500px] sm:h-[600px] glass-panel bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-white/40 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-gradient-to-br from-[#005ab6] to-[#1672df] p-4 flex items-center justify-between text-white shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border border-white/30">
                <Bot className="w-6 h-6 fill-current" />
              </div>
              <div>
                <p className="text-sm font-bold">Trợ lý Tài chính AI</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                  <p className="text-[10px] opacity-90">Trực tuyến</p>
                </div>
              </div>
            </div>
            <button onClick={toggleChat} className="hover:bg-white/20 p-2 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-slate-50/50 scrollbar-hide">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col gap-1 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto items-end' : ''}`}>
                <div className={`p-3 text-sm leading-relaxed shadow-sm ${msg.sender === 'user'
                  ? 'bg-primary text-white rounded-2xl rounded-tr-none'
                  : 'bg-white border border-slate-100 text-on-surface rounded-2xl rounded-tl-none'
                  }`}>
                  {msg.image && (
                    <img src={msg.image} alt="Upload" className="max-w-full rounded-lg mb-2 border border-white/20" />
                  )}
                  {msg.text}

                  {/* Transaction Confirmation Card */}
                  {msg.transactionData && (
                    <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-primary/10 text-on-surface space-y-2">
                      <p className="text-xs font-bold text-primary uppercase tracking-wider">Xác nhận giao dịch</p>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Số tiền:</span>
                        <span className="font-bold text-lg">{msg.transactionData.amount.toLocaleString()}đ</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Hạng mục:</span>
                        <span className="font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">{msg.transactionData.category}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Ghi chú:</span>
                        <span className="italic">"{msg.transactionData.note}"</span>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => confirmTransaction(msg.id, msg.firestoreId, msg.transactionData)}
                          disabled={savingMsgId === msg.id}
                          className="flex-1 bg-primary text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          {savingMsgId === msg.id
                            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang lưu...</>
                            : <><Check className="w-3.5 h-3.5" /> Lưu lại</>
                          }
                        </button>
                        <button
                          onClick={() => setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, transactionData: null } : m))}
                          className="px-3 bg-slate-200 text-slate-600 py-2 rounded-lg text-xs font-bold hover:bg-slate-300 transition-all"
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  )}

                  {msg.confirmed && (
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] text-green-600 font-bold bg-green-50 px-2 py-1 rounded-lg w-fit">
                      <Check className="w-3 h-3" /> Đã lưu vào hệ thống
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-on-surface-variant px-1 font-medium">
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
            {previewUrl && (
              <div className="relative w-20 h-20 mb-3 group">
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover rounded-xl border-2 border-primary/20 shadow-sm" />
                <button
                  onClick={() => { setSelectedImage(null); setPreviewUrl(null); }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            <form onSubmit={handleSend} className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 bg-slate-100 rounded-2xl px-4 py-2.5 focus-within:ring-2 ring-primary/20 transition-all">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current.click()}
                  className="text-slate-500 hover:text-primary transition-colors"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
                <input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm p-0 placeholder:text-slate-400"
                  placeholder={isListening ? "Đang nghe..." : "Nhập chi tiêu hoặc gửi ảnh bill..."}
                  type="text"
                />
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`transition-all ${isListening ? 'text-red-500 scale-125' : 'text-slate-500 hover:text-primary'}`}
                >
                  {isListening ? (
                    <div className="relative">
                      <Mic className="w-5 h-5 animate-pulse" />
                      <span className="absolute -inset-1 bg-red-500/20 rounded-full animate-ping"></span>
                    </div>
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                </button>
              </div>
              <button
                type="submit"
                disabled={(!inputValue.trim() && !selectedImage) || isUploading}
                className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all shadow-lg shadow-primary/20"
              >
                {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
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
