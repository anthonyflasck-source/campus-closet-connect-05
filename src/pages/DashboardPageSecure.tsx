import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { useProfilesByIds } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import type { DressListing } from '@/lib/types';
import ChangePasswordSection from '@/components/ChangePasswordSection';
import { fetchConversationMessages, fetchUserConversations, sendConversationMessage, type ChatMessage, type Conversation } from '@/lib/messaging';
import { formatDate } from '@/lib/store';
import { toast } from 'sonner';

export default function DashboardPageSecure() {
  const navigate = useNavigate();
  const { user, profile, loading, isSchoolEmailVerified } = useAuth();
  const [activeTab, setActiveTab] = useState<'listings' | 'received' | 'sent' | 'sales' | 'settings'>('listings');
  const [salesOrders, setSalesOrders] = useState<Array<{ id: string; dress_id: string; buyer_id: string; final_price: number; status: string; created_at: string; purchased_at: string }>>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<Array<{ id: string; dress_id: string; seller_id: string; final_price: number; status: string; created_at: string; purchased_at: string }>>([]);
  const [myListings, setMyListings] = useState<DressListing[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [conversationListings, setConversationListings] = useState<Map<string, DressListing>>(new Map());

  useEffect(() => {
    if (!user) return;

    supabase
      .from('dresses')
      .select('*')
      .eq('owner_id', user.id)
      .neq('status', 'inactive')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setMyListings((data as DressListing[]) || []);
        setLoadingListings(false);
      });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    supabase.from('orders').select('*').eq('seller_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => setSalesOrders((data as any) || []));
    supabase.from('orders').select('*').eq('buyer_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => setPurchaseOrders((data as any) || []));
  }, [user]);

  const handleOrderDecision = async (
    orderId: string,
    dressId: string,
    buyerId: string,
    decision: 'accepted' | 'declined'
  ) => {
    if (!user) return;
    const { error: orderErr } = await supabase
      .from('orders')
      .update({ status: decision })
      .eq('id', orderId)
      .eq('seller_id', user.id);
    if (orderErr) {
      toast.error(`Could not ${decision === 'accepted' ? 'accept' : 'decline'} order`);
      return;
    }

    // If declined, relist the dress so it shows up on Explore again
    if (decision === 'declined') {
      await supabase
        .from('dresses')
        .update({ status: 'available', is_available: true })
        .eq('id', dressId)
        .eq('owner_id', user.id);
    }

    // Notify the buyer in the conversation thread
    try {
      const dressTitle = orderDresses.get(dressId)?.title || 'your purchase';
      const msg = decision === 'accepted'
        ? `✅ Your purchase of "${dressTitle}" has been accepted by the seller. Coordinate pickup/shipping in this chat.`
        : `❌ The seller declined your purchase of "${dressTitle}". Your card was not charged and the listing is available again.`;
      await sendConversationMessage({
        listingId: dressId,
        buyerId,
        sellerId: user.id,
        senderId: user.id,
        body: msg,
      });
    } catch {
      // non-fatal
    }

    setSalesOrders(prev => prev.map(o => (o.id === orderId ? { ...o, status: decision } : o)));
    toast.success(decision === 'accepted' ? 'Purchase accepted' : 'Purchase declined — listing relisted');
  };

  useEffect(() => {
    if (!user || !isSchoolEmailVerified) {
      setConversations([]);
      setLoadingConversations(false);
      return;
    }

    let cancelled = false;
    setLoadingConversations(true);

    fetchUserConversations(user.id)
      .then(data => {
        if (!cancelled) {
          setConversations(data);
          setLoadingConversations(false);
        }
      })
      .catch(error => {
        if (!cancelled) {
          setLoadingConversations(false);
          toast.error(error.message);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user, isSchoolEmailVerified]);

  const conversationListingIds = useMemo(
    () => [...new Set(conversations.map(conversation => conversation.listing_id))],
    [conversations]
  );

  useEffect(() => {
    if (conversationListingIds.length === 0) {
      setConversationListings(new Map());
      return;
    }

    let cancelled = false;

    supabase
      .from('dresses')
      .select('*')
      .in('id', conversationListingIds)
      .then(({ data, error }) => {
        if (cancelled || error) return;

        const listingMap = new Map<string, DressListing>();
        ((data as DressListing[]) || []).forEach(listing => listingMap.set(listing.id, listing));
        setConversationListings(listingMap);
      });

    return () => {
      cancelled = true;
    };
  }, [conversationListingIds]);

  const conversationUserIds = useMemo(() => {
    if (!user) return [];

    const ids = new Set<string>();
    conversations.forEach(conversation => {
      ids.add(conversation.buyer_id);
      ids.add(conversation.seller_id);
    });
    salesOrders.forEach(o => ids.add(o.buyer_id));
    purchaseOrders.forEach(o => ids.add(o.seller_id));
    ids.delete(user.id);
    return [...ids];
  }, [conversations, user, salesOrders, purchaseOrders]);

  const { profiles: conversationProfiles } = useProfilesByIds(conversationUserIds);

  const orderDressIds = useMemo(
    () => [...new Set([...salesOrders.map(o => o.dress_id), ...purchaseOrders.map(o => o.dress_id)])],
    [salesOrders, purchaseOrders]
  );
  const [orderDresses, setOrderDresses] = useState<Map<string, DressListing>>(new Map());
  useEffect(() => {
    if (orderDressIds.length === 0) { setOrderDresses(new Map()); return; }
    supabase.from('dresses').select('*').in('id', orderDressIds).then(({ data }) => {
      const map = new Map<string, DressListing>();
      ((data as DressListing[]) || []).forEach(d => map.set(d.id, d));
      setOrderDresses(map);
    });
  }, [orderDressIds.join(',')]);

  const receivedConversations = useMemo(
    () => conversations.filter(conversation => conversation.seller_id === user?.id),
    [conversations, user]
  );

  const sentConversations = useMemo(
    () => conversations.filter(conversation => conversation.buyer_id === user?.id),
    [conversations, user]
  );

  const visibleConversations = activeTab === 'received' ? receivedConversations : sentConversations;

  useEffect(() => {
    if (activeTab === 'listings') return;

    if (visibleConversations.length === 0) {
      setSelectedConversationId(null);
      return;
    }

    const stillVisible = visibleConversations.some(conversation => conversation.id === selectedConversationId);
    if (!selectedConversationId || !stillVisible) {
      setSelectedConversationId(visibleConversations[0].id);
    }
  }, [activeTab, selectedConversationId, visibleConversations]);

  const selectedConversation = useMemo(
    () => conversations.find(conversation => conversation.id === selectedConversationId) ?? null,
    [conversations, selectedConversationId]
  );

  useEffect(() => {
    if (!selectedConversationId || !user || !isSchoolEmailVerified) {
      setMessages([]);
      setLoadingMessages(false);
      return;
    }

    let cancelled = false;
    setLoadingMessages(true);

    fetchConversationMessages(selectedConversationId)
      .then(data => {
        if (!cancelled) {
          setMessages(data);
          setLoadingMessages(false);
        }
      })
      .catch(error => {
        if (!cancelled) {
          setLoadingMessages(false);
          toast.error(error.message);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedConversationId, user, isSchoolEmailVerified]);

  useEffect(() => {
    if (!user || !isSchoolEmailVerified) return;

    const channel = supabase.channel(`messaging-${user.id}-${selectedConversationId ?? 'none'}`);

    channel.on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'conversations',
      filter: `buyer_id=eq.${user.id}`,
    }, async () => {
      const data = await fetchUserConversations(user.id);
      setConversations(data);
    });

    channel.on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'conversations',
      filter: `seller_id=eq.${user.id}`,
    }, async () => {
      const data = await fetchUserConversations(user.id);
      setConversations(data);
    });

    if (selectedConversationId) {
      channel.on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${selectedConversationId}`,
      }, async () => {
        const data = await fetchConversationMessages(selectedConversationId);
        setMessages(data);
      });
    }

    channel.subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, selectedConversationId, isSchoolEmailVerified]);

  if (loading) return null;
  if (!user) {
    navigate('/login');
    return null;
  }

  const isVerified = isSchoolEmailVerified;
  const displayName = profile?.full_name || user.email?.split('@')[0] || 'User';

  const handleDelete = async (id: string) => {
    if (confirm('Remove this listing?')) {
      await supabase.from('dresses').update({ status: 'inactive' }).eq('id', id);
      setMyListings(prev => prev.filter(listing => listing.id !== id));
      toast.success('Listing removed');
    }
  };

  const handleSendReply = async () => {
    if (!selectedConversation || !replyText.trim() || !user) return;

    setSendingReply(true);

    try {
      await sendConversationMessage({
        listingId: selectedConversation.listing_id,
        buyerId: selectedConversation.buyer_id,
        sellerId: selectedConversation.seller_id,
        senderId: user.id,
        body: replyText.trim(),
      });

      setReplyText('');

      const [updatedMessages, updatedConversations] = await Promise.all([
        fetchConversationMessages(selectedConversation.id),
        fetchUserConversations(user.id),
      ]);

      setMessages(updatedMessages);
      setConversations(updatedConversations);
      toast.success('Reply sent');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send reply';
      toast.error(message);
    } finally {
      setSendingReply(false);
    }
  };

  const tabClass = (tab: string) =>
    `py-3 px-5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
      activeTab === tab ? 'text-primary border-primary' : 'text-muted-foreground border-transparent hover:text-foreground'
    }`;

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-16 min-h-screen">
        <div className="container">
          <div className="mb-8 animate-fade-in">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl md:text-3xl font-extrabold">Hello, {displayName.split(' ')[0]} ðŸ‘‹</h1>
              {isVerified ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-success/15 text-success border border-success/20">âœ… Verified</span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-warning/15 text-warning border border-warning/20">â³ Verification Pending</span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {isVerified ? 'Manage your listings and messages' : 'Verify your .edu email to start listing dresses and messages'}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8 animate-fade-in">
            {[
              { value: myListings.length, label: 'Listings' },
              { value: receivedConversations.length, label: 'Inbox' },
              { value: sentConversations.length, label: 'Sent' },
            ].map(stat => (
              <div key={stat.label} className="border border-border rounded-2xl p-6 text-center" style={{ background: 'var(--gradient-card)' }}>
                <div className="text-2xl font-extrabold gradient-text">{stat.value}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="flex gap-1 border-b border-border mb-8">
            <button className={tabClass('listings')} onClick={() => setActiveTab('listings')}>My Listings</button>
            <button className={tabClass('received')} onClick={() => setActiveTab('received')}>Inbox ({receivedConversations.length})</button>
            <button className={tabClass('sent')} onClick={() => setActiveTab('sent')}>Sent ({sentConversations.length})</button>
            <button className={tabClass('sales')} onClick={() => setActiveTab('sales')}>Sales ({salesOrders.length})</button>
            <button className={tabClass('settings')} onClick={() => setActiveTab('settings')}>Settings</button>
          </div>

          <div className="animate-slide-up">
            {activeTab === 'listings' && (
              loadingListings ? (
                <div className="text-center py-16 text-muted-foreground">Loading...</div>
              ) : myListings.length === 0 ? (
                <EmptyState icon="âœ¨" title="No listings yet" desc={isVerified ? 'List your first dress and reach fellow students!' : 'Verify your .edu email to start listing dresses.'}>
                  {isVerified && <Link to="/create" className="inline-flex px-6 py-3 rounded-full font-semibold text-primary-foreground" style={{ background: 'var(--gradient-primary)' }}>+ Create Listing</Link>}
                </EmptyState>
              ) : (
                myListings.map(listing => {
                  const imageUrl = listing.image_urls && listing.image_urls.length > 0 ? listing.image_urls[0] : '';
                  const price = listing.purchase_price || listing.rental_price_per_day || 0;
                  const typeLabel = listing.listing_type === 'both' ? 'Sale/Rent' : listing.listing_type === 'rent' ? 'Rent' : 'Sale';
                  return (
                    <div key={listing.id} className="flex items-center gap-4 p-4 border border-border rounded-2xl mb-2 cursor-pointer hover:border-primary/30 transition-colors" style={{ background: 'var(--gradient-card)' }} onClick={() => navigate(`/listing/${listing.id}`)}>
                      {imageUrl ? (
                        <img src={imageUrl} alt={listing.title} className="w-16 h-20 rounded-lg object-cover bg-surface shrink-0" />
                      ) : (
                        <div className="w-16 h-20 rounded-lg bg-surface flex items-center justify-center text-2xl shrink-0">ðŸ‘—</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium whitespace-nowrap overflow-hidden text-ellipsis">{listing.title}</h4>
                        <p className="text-xs text-muted-foreground">{listing.size} Â· {listing.color || 'â€”'} Â· {typeLabel} Â· ${price}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={e => { e.stopPropagation(); navigate(`/edit/${listing.id}`); }}
                          className="px-4 py-2 rounded-full text-xs font-semibold text-primary bg-primary/15 border border-primary/20 hover:bg-primary/25 transition-all"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); handleDelete(listing.id); }}
                          className="px-4 py-2 rounded-full text-xs font-semibold text-destructive bg-destructive/15 border border-destructive/20 hover:bg-destructive/25 transition-all"
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  );
                })
              )
            )}

            {activeTab === 'sales' && (
              salesOrders.length === 0 && purchaseOrders.length === 0 ? (
                <EmptyState icon="🧾" title="No sales or purchases yet" desc="When someone buys one of your dresses (or you buy one), the order will appear here." />
              ) : (
                <div className="space-y-8">
                  {salesOrders.length > 0 && (
                    <div>
                      <h3 className="text-lg font-bold mb-3">Sales Received</h3>
                      <div className="space-y-2">
                        {salesOrders.map(o => {
                          const buyer = conversationProfiles.get(o.buyer_id);
                          const dress = orderDresses.get(o.dress_id);
                          const isPending = !o.status || o.status === 'pending';
                          const statusColor =
                            o.status === 'accepted' || o.status === 'completed' ? 'text-success'
                            : o.status === 'declined' ? 'text-destructive'
                            : 'text-muted-foreground';
                          return (
                            <div key={o.id} className="flex flex-wrap items-center gap-4 p-4 border border-border rounded-2xl" style={{ background: 'var(--gradient-card)' }}>
                              <div className="w-12 h-12 rounded-full flex items-center justify-center text-base font-bold text-primary-foreground shrink-0" style={{ background: 'var(--gradient-primary)' }}>
                                {(buyer?.full_name || 'U').charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold truncate">{buyer?.full_name || 'Unknown buyer'}</div>
                                <div className="text-xs text-muted-foreground truncate">{dress?.title || 'Listing removed'} · {formatDate(o.created_at)}</div>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="font-extrabold text-primary-light">${o.final_price}</div>
                                <div className={`text-xs uppercase tracking-wide ${statusColor}`}>{o.status || 'pending'}</div>
                              </div>
                              {isPending && (
                                <div className="flex gap-2 w-full sm:w-auto">
                                  <button
                                    onClick={() => handleOrderDecision(o.id, o.dress_id, o.buyer_id, 'accepted')}
                                    className="flex-1 sm:flex-none px-4 py-2 rounded-full text-sm font-semibold text-primary-foreground hover:opacity-90 transition"
                                    style={{ background: 'var(--gradient-primary)' }}
                                  >
                                    Accept
                                  </button>
                                  <button
                                    onClick={() => handleOrderDecision(o.id, o.dress_id, o.buyer_id, 'declined')}
                                    className="flex-1 sm:flex-none px-4 py-2 rounded-full text-sm font-semibold border border-destructive text-destructive hover:bg-destructive/10 transition"
                                  >
                                    Decline
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {purchaseOrders.length > 0 && (
                    <div>
                      <h3 className="text-lg font-bold mb-3">My Purchases</h3>
                      <div className="space-y-2">
                        {purchaseOrders.map(o => {
                          const seller = conversationProfiles.get(o.seller_id);
                          const dress = orderDresses.get(o.dress_id);
                          return (
                            <div key={o.id} className="flex items-center gap-4 p-4 border border-border rounded-2xl" style={{ background: 'var(--gradient-card)' }}>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold truncate">{dress?.title || 'Listing removed'}</div>
                                <div className="text-xs text-muted-foreground truncate">Sold by {seller?.full_name || 'Unknown'} · {formatDate(o.created_at)}</div>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="font-extrabold text-primary-light">${o.final_price}</div>
                                <div className="text-xs uppercase tracking-wide text-success">{o.status}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            )}

            {activeTab === 'settings' && (
              <ChangePasswordSection />
            )}

            {(activeTab === 'received' || activeTab === 'sent') && (
              !isVerified ? (
                <EmptyState icon="â³" title="Verification Required" desc="Verify your .edu email before you can open or send messages." />
              ) : loadingConversations ? (
                <div className="text-center py-16 text-muted-foreground">Loading conversations...</div>
              ) : visibleConversations.length === 0 ? (
                <EmptyState
                  icon="ðŸ’Œ"
                  title={activeTab === 'received' ? 'No conversations yet' : 'No messages sent'}
                  desc={activeTab === 'received'
                    ? 'When someone contacts you about a listing, the thread will appear here.'
                    : 'Open any listing and use Contact Seller to start a conversation.'}
                />
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-[320px,1fr] gap-6">
                  <div className="border border-border rounded-2xl overflow-hidden" style={{ background: 'var(--gradient-card)' }}>
                    {visibleConversations.map(conversation => {
                      const counterpartId = conversation.buyer_id === user.id ? conversation.seller_id : conversation.buyer_id;
                      const counterpart = conversationProfiles.get(counterpartId);
                      const listing = conversationListings.get(conversation.listing_id);
                      const isSelected = conversation.id === selectedConversationId;

                      return (
                        <button
                          key={conversation.id}
                          onClick={() => setSelectedConversationId(conversation.id)}
                          className={`w-full text-left px-4 py-4 border-b border-border/60 transition-colors ${isSelected ? 'bg-primary/10' : 'hover:bg-foreground/[0.03]'}`}
                        >
                          <div className="flex items-center justify-between gap-3 mb-1">
                            <span className="font-semibold">{counterpart?.full_name || 'Unknown User'}</span>
                            <span className="text-xs text-muted-foreground">{formatDate(conversation.last_message_at)}</span>
                          </div>
                          <div className="text-sm text-muted-foreground truncate">{listing?.title || 'Listing removed'}</div>
                        </button>
                      );
                    })}
                  </div>

                  <ConversationThread
                    conversation={selectedConversation}
                    listing={selectedConversation ? conversationListings.get(selectedConversation.listing_id) ?? null : null}
                    currentUserId={user.id}
                    counterpartName={selectedConversation
                      ? conversationProfiles.get(selectedConversation.buyer_id === user.id ? selectedConversation.seller_id : selectedConversation.buyer_id)?.full_name || 'Unknown User'
                      : 'Unknown User'}
                    messages={messages}
                    loadingMessages={loadingMessages}
                    replyText={replyText}
                    setReplyText={setReplyText}
                    onSendReply={handleSendReply}
                    sendingReply={sendingReply}
                  />
                </div>
              )
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function EmptyState({ icon, title, desc, children }: { icon: string; title: string; desc: string; children?: React.ReactNode }) {
  return (
    <div className="text-center py-16 text-muted-foreground">
      <div className="text-5xl mb-4 opacity-50">{icon}</div>
      <h3 className="text-lg mb-2 text-foreground">{title}</h3>
      <p className="text-sm max-w-[400px] mx-auto mb-6">{desc}</p>
      {children}
    </div>
  );
}

function ConversationThread({
  conversation,
  listing,
  currentUserId,
  counterpartName,
  messages,
  loadingMessages,
  replyText,
  setReplyText,
  onSendReply,
  sendingReply,
}: {
  conversation: Conversation | null;
  listing: DressListing | null;
  currentUserId: string;
  counterpartName: string;
  messages: ChatMessage[];
  loadingMessages: boolean;
  replyText: string;
  setReplyText: (value: string) => void;
  onSendReply: () => void;
  sendingReply: boolean;
}) {
  if (!conversation) {
    return (
      <div className="border border-border rounded-2xl p-8 text-center text-muted-foreground" style={{ background: 'var(--gradient-card)' }}>
        Select a conversation to read messages.
      </div>
    );
  }

  return (
    <div className="border border-border rounded-2xl overflow-hidden" style={{ background: 'var(--gradient-card)' }}>
      <div className="px-6 py-5 border-b border-border/60">
        <div className="font-semibold">{counterpartName}</div>
        <div className="text-sm text-muted-foreground">{listing?.title || 'Listing removed'}</div>
      </div>

      <div className="p-6 space-y-3 min-h-[320px] max-h-[480px] overflow-y-auto">
        {loadingMessages ? (
          <div className="text-center text-muted-foreground py-10">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-10">No messages in this conversation yet.</div>
        ) : (
          messages.map(message => (
            <div key={message.id} className={`flex ${message.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.sender_id === currentUserId ? 'text-primary-foreground' : 'bg-foreground/[0.05] text-foreground'}`} style={message.sender_id === currentUserId ? { background: 'var(--gradient-primary)' } : undefined}>
                <div className="text-sm leading-relaxed whitespace-pre-wrap">{message.body}</div>
                <div className={`text-xs mt-2 ${message.sender_id === currentUserId ? 'text-primary-foreground/75' : 'text-muted-foreground'}`}>
                  {formatDate(message.created_at)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-6 border-t border-border/60">
        <label className="block text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Reply</label>
        <textarea
          value={replyText}
          onChange={e => setReplyText(e.target.value)}
          placeholder="Type your reply..."
          className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 resize-y min-h-[100px]"
        />
        <button
          onClick={onSendReply}
          disabled={sendingReply || !replyText.trim()}
          className="mt-4 w-full py-4 rounded-full font-semibold text-primary-foreground text-base disabled:opacity-50"
          style={{ background: 'var(--gradient-primary)' }}
        >
          {sendingReply ? 'Sending...' : 'Send Reply'}
        </button>
      </div>
    </div>
  );
}
