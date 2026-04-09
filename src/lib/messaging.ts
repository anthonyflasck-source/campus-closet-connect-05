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
  const conversation = await getOrCreateConversation(input.listingId, input.buyerId, input.sellerId);

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversation.id,
      sender_id: input.senderId,
      body: input.body.trim(),
    })
    .select('*')
    .single();

  if (error) throw error;

  return {
    conversation,
    message: data as ChatMessage,
  };
}
