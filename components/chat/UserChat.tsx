'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { 
  createConversation, 
  getUserConversation, 
  getConversationMessages, 
  sendMessage, 
  subscribeToConversation,
  Message,
  Conversation
} from '@/lib/chat';
import { FiSend } from 'react-icons/fi';

export default function UserChat({ showChat, onToggleChat }: { showChat: boolean, onToggleChat: () => void }) {
  const { user } = useAuth();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // تحميل بيانات المحادثة والرسائل
  useEffect(() => {
    if (!user) return;
    
    async function loadChatData() {
      try {
        setLoading(true);
        
        // الحصول على محادثة المستخدم أو إنشاء واحدة جديدة
        let { data: conversationData, error: conversationError } = await getUserConversation();
        
        if (conversationError) throw conversationError;
        
        console.log('User conversation data:', conversationData);
        
        let currentConversation = conversationData;
        
        // إذا لم تكن هناك محادثة، قم بإنشاء واحدة جديدة
        if (!currentConversation) {
          console.log('No conversation found, creating a new one');
          const { data: newConversationId, error: createError } = await createConversation();
          
          if (createError) throw createError;
          
          console.log('New conversation created with ID:', newConversationId);
          
          // إعادة تحميل بيانات المحادثة المنشأة حديثًا
          const { data: newConversationData } = await getUserConversation();
          currentConversation = newConversationData;
          console.log('Loaded new conversation:', currentConversation);
        }
        
        setConversation(currentConversation);
        
        // تحميل الرسائل بمجرد أن تكون المحادثة جاهزة
        if (currentConversation) {
          console.log('Loading messages for conversation:', currentConversation.id);
          const { data: messagesData, error: messagesError } = await getConversationMessages(currentConversation.id);
          
          if (messagesError) throw messagesError;
          
          console.log('Loaded messages:', messagesData);
          // ترتيب الرسائل من الأقدم إلى الأحدث
          setMessages(messagesData?.sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          ) || []);
        }
      } catch (error: any) {
        console.error('Error loading chat data:', error);
        setError(error.message || 'حدث خطأ أثناء تحميل بيانات المحادثة');
      } finally {
        setLoading(false);
      }
    }
    
    loadChatData();
  }, [user]);
  
  // الاشتراك في الرسائل الجديدة
  useEffect(() => {
    if (!conversation) return;
    
    // إنشاء اشتراك للاستماع للرسائل الجديدة
    const subscription = subscribeToConversation(
      conversation.id,
      (newMessage) => {
        setMessages(prev => [...prev, newMessage]);
      }
    );
    
    return () => {
      // إلغاء الاشتراك عند إزالة المكون
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [conversation]);
  
  // التمرير إلى آخر رسالة عند إضافة رسائل جديدة
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: isInitialLoad ? 'auto' : 'smooth' });
    }
    
    if (isInitialLoad && messages.length > 0) {
      setIsInitialLoad(false);
    }
  }, [messages, isInitialLoad]);
  
  // إرسال رسالة جديدة
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!conversation || !newMessage.trim()) return;
    
    try {
      console.log('Sending message to conversation:', conversation.id);
      
      const { data, error } = await sendMessage(
        conversation.id,
        newMessage.trim(),
        false // ليس من قبل المشرف
      );
      
      if (error) throw error;
      
      console.log('Message sent successfully, ID:', data);
      
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
  
  if (!user) {
    return (
      <div className="text-center py-8">
        <p>يرجى تسجيل الدخول للوصول إلى المحادثات</p>
      </div>
    );
  }
  
  return (
    <>
      {/* نافذة المحادثة */}
      {showChat && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-gray-900 bg-opacity-50 p-0 md:p-2">
          <div className="bg-white rounded-t-lg md:rounded-lg shadow-xl w-full max-w-lg flex flex-col chat-window h-[85vh] max-h-[650px] overflow-hidden">
            {/* رأس المحادثة ثابت */}
            <div className="bg-[#5D1F1F] text-white p-3 flex justify-between items-center sticky top-0 z-10">
              <h2 className="text-lg font-semibold">محادثة مع الدعم الفني</h2>
              <button
                onClick={onToggleChat}
                className="text-white hover:text-gray-200 text-2xl font-bold p-1"
                aria-label="إغلاق المحادثة"
              >
                &times;
              </button>
            </div>
            
            {/* الرسائل - تقليل ارتفاعها لإفساح مجال لحقل الإدخال */}
            <div 
              ref={messagesContainerRef}
              className="flex-1 flex flex-col overflow-y-auto bg-gray-50 px-3 py-2 gap-2 chat-messages-container" 
              style={{
                scrollbarGutter: 'stable',
                maxHeight: 'calc(100% - 130px)'
              }}
            >
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <span className="loading loading-spinner loading-md"></span>
                </div>
              ) : error ? (
                <div className="text-center text-red-500 py-4">
                  {error}
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <p>لم تبدأ محادثة بعد. أرسل رسالة للبدء.</p>
                </div>
              ) : (
                <>
                  {messages.map((message, index) => {
                    const showDate = index === 0 || 
                      formatDate(messages[index - 1]?.created_at) !== formatDate(message.created_at);
                    return (
                      <React.Fragment key={message.id}>
                        {showDate && (
                          <div className="text-center my-1">
                            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                              {formatDate(message.created_at)}
                            </span>
                          </div>
                        )}
                        <div className={`mb-2 flex ${message.is_from_admin ? 'justify-start' : 'justify-end'}`} >
                          <div className={`p-2.5 rounded-2xl max-w-[80%] break-words shadow ${message.is_from_admin ? 'bg-white border border-gray-200 text-gray-800' : 'bg-[#5D1F1F] text-white'}`} >
                            <p className="text-sm md:text-base chat-message-text">{message.content}</p>
                            <span className={`text-xs block text-left mt-1 chat-message-time ${message.is_from_admin ? 'text-gray-500' : 'text-gray-200'}`}>{formatTime(message.created_at)}</span>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                  <div ref={messagesEndRef} className="h-16" />
                </>
              )}
            </div>
            
            {/* حاوية حقل الإدخال - مرفوعة قليلاً لتناسب هواتف الآيفون */}
            <div className="chat-input-wrapper bg-white">
              <form onSubmit={handleSendMessage} className="p-2 md:p-3 flex">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="اكتب رسالتك هنا..."
                  className="flex-1 p-2 md:p-3 border rounded-l-2xl focus:outline-none focus:ring-2 focus:ring-[#5D1F1F] focus:border-transparent chat-input"
                  required
                />
                <button
                  type="submit"
                  className="bg-[#5D1F1F] text-white p-2 md:p-3 rounded-r-2xl hover:bg-[#4a1919] transition-colors flex items-center justify-center chat-send-button"
                  disabled={!newMessage.trim()}
                  style={{ minWidth: '45px' }}
                >
                  <FiSend size={18} />
                </button>
              </form>
              {/* إضافة منطقة آمنة للهواتف الحديثة */}
              <div className="safe-area-inset-bottom"></div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 