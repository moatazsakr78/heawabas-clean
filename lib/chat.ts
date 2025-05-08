import { supabase } from './supabase';

// واجهات البيانات
export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  is_from_admin: boolean;
  content: string;
  created_at: string;
  is_read: boolean;
}

export interface Conversation {
  id: string;
  user_id: string;
  username?: string;
  created_at: string;
  updated_at: string;
  is_read_by_admin: boolean;
  is_read_by_user: boolean;
  last_message: string;
  last_message_time: string;
  unread_count?: number;
}

// وظيفة إنشاء محادثة جديدة للمستخدم
export async function createConversation(): Promise<{
  data: string | null;
  error: any;
}> {
  try {
    const { data, error } = await supabase.rpc('create_conversation');
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error creating conversation:', error);
    return { data: null, error };
  }
}

// وظيفة إرسال رسالة
export async function sendMessage(
  conversationId: string, 
  content: string, 
  isAdmin: boolean = false
): Promise<{
  data: string | null;
  error: any;
}> {
  try {
    const { data, error } = await supabase.rpc('send_message', {
      conversation_id: conversationId,
      message_content: content,
      is_admin: isAdmin
    });
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error sending message:', error);
    return { data: null, error };
  }
}

// وظيفة للحصول على محادثة المستخدم
export async function getUserConversation(): Promise<{
  data: Conversation | null;
  error: any;
}> {
  try {
    const { data, error } = await supabase.rpc('get_user_conversation');
    
    if (error) throw error;
    
    return { data: data.length > 0 ? data[0] : null, error: null };
  } catch (error) {
    console.error('Error getting user conversation:', error);
    return { data: null, error };
  }
}

// وظيفة للحصول على جميع المحادثات (للمشرف)
export async function getAllConversations(): Promise<{
  data: Conversation[] | null;
  error: any;
}> {
  try {
    const { data, error } = await supabase.rpc('get_all_conversations');
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error getting all conversations:', error);
    return { data: null, error };
  }
}

// وظيفة للحصول على رسائل محادثة
export async function getConversationMessages(conversationId: string): Promise<{
  data: Message[] | null;
  error: any;
}> {
  try {
    const { data, error } = await supabase.rpc('get_conversation_messages', {
      conversation_id_param: conversationId
    });
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error getting conversation messages:', error);
    return { data: null, error };
  }
}

// الاستماع للرسائل الجديدة في محادثة
export function subscribeToConversation(
  conversationId: string,
  callback: (message: Message) => void
) {
  console.log(`Subscribing to conversation: ${conversationId}`);
  
  const subscription = supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      (payload) => {
        console.log('New message received:', payload);
        callback(payload.new as Message);
      }
    )
    .subscribe((status) => {
      console.log(`Subscription status for conversation ${conversationId}:`, status);
    });
  
  return subscription;
}

// الاستماع للمحادثات الجديدة أو المحدثة (للمشرف)
export function subscribeToAllConversations(
  callback: (conversation: Conversation) => void
) {
  console.log('Subscribing to all conversations');
  
  const subscription = supabase
    .channel('all_conversations')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'conversations'
      },
      (payload) => {
        console.log('Conversation update received:', payload);
        callback(payload.new as Conversation);
      }
    )
    .subscribe((status) => {
      console.log('Subscription status for all conversations:', status);
    });
  
  return subscription;
} 