'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { 
  getConversationMessages, 
  sendMessage, 
  subscribeToConversation,
  Message,
  Conversation
} from '@/lib/chat';
import { FiSend, FiArrowRight, FiUser } from 'react-icons/fi';

interface AdminChatWindowProps {
  conversation: Conversation;
  onBack: () => void;
}

export default function AdminChatWindow({ conversation, onBack }: AdminChatWindowProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // تحميل الرسائل
  useEffect(() => {
    if (!conversation || !user) return;
    
    async function loadMessages() {
      try {
        setLoading(true);
        
        const { data, error } = await getConversationMessages(conversation.id);
        
        if (error) throw error;
        
        // ترتيب الرسائل من الأقدم إلى الأحدث
        setMessages(data?.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        ) || []);
      } catch (error: any) {
        console.error('Error loading messages:', error);
        setError(error.message || 'حدث خطأ أثناء تحميل الرسائل');
      } finally {
        setLoading(false);
      }
    }
    
    loadMessages();
  }, [conversation, user]);
  
  // الاشتراك في الرسائل الجديدة
  useEffect(() => {
    if (!conversation) return;
    
    const subscription = subscribeToConversation(
      conversation.id,
      (newMessage) => {
        setMessages(prev => [...prev, newMessage]);
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, [conversation]);
  
  // التمرير إلى آخر رسالة بعد تحميل الرسائل أو عند وصول رسائل جديدة
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: isInitialLoad ? 'auto' : 'smooth' });
    }
    
    if (isInitialLoad && messages.length > 0) {
      setIsInitialLoad(false);
    }
  }, [messages, isInitialLoad]);
  
  // إعادة تعيين isInitialLoad عند تغيير المحادثة
  useEffect(() => {
    setIsInitialLoad(true);
  }, [conversation?.id]);
  
  // إرسال رسالة جديدة
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!conversation || !newMessage.trim()) return;
    
    try {
      const { data, error } = await sendMessage(
        conversation.id,
        newMessage.trim(),
        true // رسالة من المشرف
      );
      
      if (error) throw error;
      
      // مسح حقل الرسالة بعد الإرسال
      setNewMessage('');
    } catch (error: any) {
      console.error('Error sending message:', error);
      setError(error.message || 'حدث خطأ أثناء إرسال الرسالة');
      setTimeout(() => setError(null), 3000);
    }
  };
  
  // تنسيق الوقت
  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  // تنسيق التاريخ
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  return (
    <div className="flex flex-col h-full max-h-full">
      {/* رأس المحادثة */}
      <div className="bg-[#5D1F1F] text-white p-4 flex items-center sticky top-0 z-10">
        <button 
          onClick={onBack}
          className="text-white ml-2 flex items-center"
          aria-label="العودة إلى قائمة المحادثات"
        >
          <FiArrowRight size={20} />
          <span className="mr-1 text-sm md:hidden">رجوع</span>
        </button>
        
        <div className="bg-white text-[#5D1F1F] h-10 w-10 rounded-full flex items-center justify-center mr-3">
          <FiUser />
        </div>
        
        <div>
          <h2 className="font-semibold">{conversation.username || 'مستخدم'}</h2>
        </div>
      </div>
      
      {/* محتوى المحادثة */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col" 
        style={{scrollbarGutter:'stable'}}
      >
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <span className="loading loading-spinner loading-md"></span>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 p-4">
            {error}
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 p-8">
            <p>لا توجد رسائل بعد. ابدأ المحادثة بإرسال رسالة.</p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              // تحديد ما إذا كان يجب عرض التاريخ
              const showDate = index === 0 || 
                formatDate(messages[index - 1]?.created_at) !== formatDate(message.created_at);
              
              return (
                <React.Fragment key={message.id}>
                  {showDate && (
                    <div className="text-center my-2">
                      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                        {formatDate(message.created_at)}
                      </span>
                    </div>
                  )}
                  
                  <div 
                    className={`mb-4 flex ${message.is_from_admin ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`p-3 rounded-lg max-w-[80%] md:max-w-[70%] ${
                        message.is_from_admin 
                          ? 'bg-[#5D1F1F] text-white' 
                          : 'bg-white border border-gray-200 text-gray-800'
                      }`}
                    >
                      <p className="break-words">{message.content}</p>
                      <span className={`text-xs block text-right mt-1 ${
                        message.is_from_admin ? 'text-gray-200' : 'text-gray-500'
                      }`}>
                        {formatTime(message.created_at)}
                      </span>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      
      {/* شريط الإدخال ثابت في الأسفل */}
      <form onSubmit={handleSendMessage} className="p-4 border-t flex bg-white sticky bottom-0 z-10">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="اكتب رسالتك هنا..."
          className="flex-1 p-2 border rounded-l-2xl focus:outline-none focus:ring-2 focus:ring-[#5D1F1F] focus:border-transparent"
          required
        />
        <button
          type="submit"
          className="bg-[#5D1F1F] text-white p-2 rounded-r-2xl hover:bg-[#4a1919] transition-colors"
          disabled={!newMessage.trim()}
        >
          <FiSend />
        </button>
      </form>
    </div>
  );
} 