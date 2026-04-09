import { supabase } from '@/integrations/supabase/client';

export interface Conversation {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  created_at: string;
}

interface SendMessageInput {
  listingId: string;
  buyerId: string;
  sellerId: string;
  senderId: string;
  body: string;
}

interface MessageInsertPayload {
  conversation_id: string;
  sender_id: string;
  recipient_id: string;
  listing_id: string;
  body: string;
}

type MessageInsertRow = {
  conversation_id: string;
  sender_id: string;
  body: string;
};

function getRecipientId(input: Pick<SendMessageInput, 'buyerId' | 'sellerId' | 'senderId'>) {
  if (input.senderId === input.buyerId) return input.sellerId;
  if (input.senderId === input.sellerId) return input.buyerId;

  throw new Error('Sender must be a participant in the conversation');
}

export async function fetchUserConversations(userId: string) {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order('last_message_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Conversation[];
}

export async function fetchConversationMessages(conversationId: string) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as ChatMessage[];
}

export async function getOrCreateConversation(listingId: string, buyerId: string, sellerId: string) {
  const { data: existing, error: lookupError } = await supabase
    .from('conversations')
    .select('*')
    .eq('listing_id', listingId)
    .eq('buyer_id', buyerId)
    .eq('seller_id', sellerId)
    .maybeSingle();

  if (lookupError) throw lookupError;
  if (existing) return existing as Conversation;

  const { data, error } = await supabase
    .from('conversations')
    .insert({
      listing_id: listingId,
      buyer_id: buyerId,
      seller_id: sellerId,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data as Conversation;
}

export async function sendConversationMessage(input: SendMessageInput) {
  const body = input.body.trim();
  if (!body) throw new Error('Message body cannot be empty');

  const recipientId = getRecipientId(input);
  const conversation = await getOrCreateConversation(input.listingId, input.buyerId, input.sellerId);

  const messagePayload: MessageInsertPayload = {
    conversation_id: conversation.id,
    sender_id: input.senderId,
    recipient_id: recipientId,
    listing_id: input.listingId,
    body,
  };

  const { data, error } = await supabase
    .from('messages')
    .insert(messagePayload as unknown as MessageInsertRow)
    .select('*')
    .single();

  if (error) throw error;

  return {
    conversation,
    message: data as ChatMessage,
  };
}
