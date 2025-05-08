-- إعداد جداول وسياسات نظام الدردشة
-- هذا الملف يضيف جداول وسياسات وRPC دوال لنظام الدردشة بين المستخدمين والمشرف

-- إنشاء جدول المحادثات (تمثيل محادثة واحدة بين مستخدم والمشرف)
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_read_by_admin BOOLEAN DEFAULT FALSE,
  is_read_by_user BOOLEAN DEFAULT TRUE,
  last_message TEXT,
  last_message_time TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء مؤشرات للبحث السريع
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at);
CREATE INDEX IF NOT EXISTS idx_conversations_is_read_by_admin ON conversations(is_read_by_admin);
CREATE INDEX IF NOT EXISTS idx_conversations_is_read_by_user ON conversations(is_read_by_user);

-- إنشاء جدول الرسائل
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_from_admin BOOLEAN NOT NULL DEFAULT FALSE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_read BOOLEAN DEFAULT FALSE
);

-- إنشاء مؤشرات للبحث السريع
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);

-- تحديث آخر رسالة في المحادثة
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations 
  SET 
    last_message = NEW.content,
    last_message_time = NEW.created_at,
    updated_at = NOW(),
    is_read_by_admin = CASE WHEN NEW.is_from_admin THEN TRUE ELSE FALSE END,
    is_read_by_user = CASE WHEN NEW.is_from_admin THEN FALSE ELSE TRUE END
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- محفز لتحديث المحادثة عند إضافة رسالة جديدة
DROP TRIGGER IF EXISTS on_message_created ON messages;
CREATE TRIGGER on_message_created
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_last_message();

-- وظيفة لإنشاء محادثة جديدة
CREATE OR REPLACE FUNCTION create_conversation()
RETURNS UUID AS $$
DECLARE
  new_conversation_id UUID;
  current_user_id UUID;
BEGIN
  -- الحصول على معرف المستخدم الحالي
  current_user_id := auth.uid();
  
  -- التحقق من وجود محادثة سابقة
  SELECT id INTO new_conversation_id 
  FROM conversations 
  WHERE user_id = current_user_id 
  LIMIT 1;
  
  -- إذا لم توجد محادثة، قم بإنشاء واحدة جديدة
  IF new_conversation_id IS NULL THEN
    INSERT INTO conversations (user_id)
    VALUES (current_user_id)
    RETURNING id INTO new_conversation_id;
  END IF;
  
  RETURN new_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- وظيفة لإرسال رسالة جديدة
CREATE OR REPLACE FUNCTION send_message(
  conversation_id UUID,
  message_content TEXT,
  is_admin BOOLEAN DEFAULT FALSE
)
RETURNS UUID AS $$
DECLARE
  new_message_id UUID;
  current_user_id UUID;
  admin_id UUID;
  user_id UUID;
  message_sender_id UUID;
BEGIN
  -- الحصول على معرف المستخدم الحالي
  current_user_id := auth.uid();
  
  -- التحقق من وجود المحادثة
  SELECT user_id INTO user_id 
  FROM conversations 
  WHERE id = conversation_id 
  LIMIT 1;
  
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'المحادثة غير موجودة';
  END IF;
  
  -- تحديد من هو المرسل
  IF is_admin THEN
    -- التحقق من أن المستخدم الحالي لديه صلاحية المشرف
    SELECT id INTO admin_id 
    FROM users 
    WHERE id = current_user_id AND is_admin = TRUE 
    LIMIT 1;
    
    IF admin_id IS NULL THEN
      RAISE EXCEPTION 'ليس لديك صلاحية المشرف لإرسال رسالة';
    END IF;
    
    message_sender_id := current_user_id;
  ELSE
    -- التحقق من أن المستخدم الحالي هو صاحب المحادثة
    IF user_id <> current_user_id THEN
      RAISE EXCEPTION 'لا يمكنك إرسال رسائل في محادثة لا تخصك';
    END IF;
    
    message_sender_id := current_user_id;
  END IF;
  
  -- إضافة الرسالة
  INSERT INTO messages (
    conversation_id,
    sender_id,
    is_from_admin,
    content
  ) VALUES (
    conversation_id,
    message_sender_id,
    is_admin,
    message_content
  ) RETURNING id INTO new_message_id;
  
  RETURN new_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- وظيفة للحصول على محادثات المستخدم الحالي
CREATE OR REPLACE FUNCTION get_user_conversation()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  is_read_by_admin BOOLEAN,
  is_read_by_user BOOLEAN,
  last_message TEXT,
  last_message_time TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT c.*
  FROM conversations c
  WHERE c.user_id = auth.uid()
  ORDER BY c.updated_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- وظيفة للحصول على جميع المحادثات للمشرف
CREATE OR REPLACE FUNCTION get_all_conversations()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  username TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  is_read_by_admin BOOLEAN,
  is_read_by_user BOOLEAN,
  last_message TEXT,
  last_message_time TIMESTAMPTZ,
  unread_count BIGINT
) AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  -- التحقق من صلاحية المشرف
  SELECT u.is_admin INTO is_admin 
  FROM users u 
  WHERE u.id = auth.uid() 
  LIMIT 1;
  
  IF is_admin IS NOT TRUE THEN
    RAISE EXCEPTION 'ليس لديك صلاحية المشرف للوصول إلى هذه البيانات';
  END IF;
  
  RETURN QUERY
  SELECT 
    c.id,
    c.user_id,
    u.username,
    c.created_at,
    c.updated_at,
    c.is_read_by_admin,
    c.is_read_by_user,
    c.last_message,
    c.last_message_time,
    COUNT(m.id) FILTER (WHERE m.is_read = FALSE AND m.is_from_admin = FALSE) AS unread_count
  FROM conversations c
  LEFT JOIN users u ON c.user_id = u.id
  LEFT JOIN messages m ON c.id = m.conversation_id
  GROUP BY c.id, c.user_id, u.username, c.created_at, c.updated_at, c.is_read_by_admin, c.is_read_by_user, c.last_message, c.last_message_time
  ORDER BY c.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- وظيفة للحصول على رسائل محادثة
CREATE OR REPLACE FUNCTION get_conversation_messages(conversation_id_param UUID)
RETURNS TABLE (
  id UUID,
  conversation_id UUID,
  sender_id UUID,
  is_from_admin BOOLEAN,
  content TEXT,
  created_at TIMESTAMPTZ,
  is_read BOOLEAN
) AS $$
DECLARE
  is_admin BOOLEAN;
  user_conversation UUID;
BEGIN
  -- التحقق من الصلاحيات
  SELECT u.is_admin INTO is_admin 
  FROM users u 
  WHERE u.id = auth.uid() 
  LIMIT 1;
  
  -- إذا كان مستخدم عادي، تحقق من أن المحادثة تخصه
  IF is_admin IS NOT TRUE THEN
    SELECT id INTO user_conversation 
    FROM conversations 
    WHERE id = conversation_id_param AND user_id = auth.uid() 
    LIMIT 1;
    
    IF user_conversation IS NULL THEN
      RAISE EXCEPTION 'ليس لديك صلاحية للوصول إلى هذه المحادثة';
    END IF;
    
    -- تحديث حالة قراءة المستخدم
    UPDATE conversations 
    SET is_read_by_user = TRUE 
    WHERE id = conversation_id_param;
  ELSE
    -- تحديث حالة قراءة المشرف
    UPDATE conversations 
    SET is_read_by_admin = TRUE 
    WHERE id = conversation_id_param;
    
    -- تحديث حالة قراءة الرسائل
    UPDATE messages 
    SET is_read = TRUE 
    WHERE conversation_id = conversation_id_param AND is_from_admin = FALSE;
  END IF;
  
  -- إرجاع الرسائل
  RETURN QUERY
  SELECT m.*
  FROM messages m
  WHERE m.conversation_id = conversation_id_param
  ORDER BY m.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- سياسات الوصول للمحادثات
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own conversations"
ON conversations FOR SELECT
USING (user_id = auth.uid() OR 
       EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE));

CREATE POLICY "Users can insert their own conversations"
ON conversations FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own conversations"
ON conversations FOR UPDATE
USING (user_id = auth.uid() OR 
       EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE));

-- سياسات الوصول للرسائل
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their conversations"
ON messages FOR SELECT
USING (EXISTS (
  SELECT 1 FROM conversations c
  WHERE c.id = conversation_id AND (c.user_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE))
));

CREATE POLICY "Users can insert messages in their conversations"
ON messages FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM conversations c
  WHERE c.id = conversation_id AND (c.user_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE))
));

CREATE POLICY "Users can update their own messages"
ON messages FOR UPDATE
USING (sender_id = auth.uid() OR 
       EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)); 