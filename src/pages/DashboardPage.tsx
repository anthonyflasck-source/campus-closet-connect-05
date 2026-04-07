import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { getListingsByUser, getMessagesForUser, getListingById, getUserById, deleteListing, formatDate } from '@/lib/store';
import { toast } from 'sonner';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'listings' | 'received' | 'sent'>('listings');
  const [, forceUpdate] = useState(0);

  if (loading) return null;
  if (!user) { navigate('/login'); return null; }

  const isVerified = profile?.verification_status ?? false;
  const displayName = profile?.full_name || user.email?.split('@')[0] || 'User';

  // Still using localStorage for listings/messages until migrated
  const myListings = getListingsByUser(user.id);
  const { received, sent } = getMessagesForUser(user.id);

  const handleDelete = (id: string) => {
    if (confirm('Remove this listing?')) {
      deleteListing(id);
      toast.success('Listing removed');
      forceUpdate(n => n + 1);
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
              <h1 className="text-2xl md:text-3xl font-extrabold">Hello, {displayName.split(' ')[0]} 👋</h1>
              {isVerified ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-success/15 text-success border border-success/20">✅ Verified</span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-warning/15 text-warning border border-warning/20">⏳ Verification Pending</span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {isVerified ? 'Manage your listings and messages' : 'Verify your .edu email to start listing dresses'}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8 animate-fade-in">
            {[
              { value: myListings.length, label: 'Listings' },
              { value: received.length, label: 'Received' },
              { value: sent.length, label: 'Sent' },
            ].map(stat => (
              <div key={stat.label} className="border border-border rounded-2xl p-6 text-center" style={{ background: 'var(--gradient-card)' }}>
                <div className="text-2xl font-extrabold gradient-text">{stat.value}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="flex gap-1 border-b border-border mb-8">
            <button className={tabClass('listings')} onClick={() => setActiveTab('listings')}>My Listings</button>
            <button className={tabClass('received')} onClick={() => setActiveTab('received')}>Inbox ({received.length})</button>
            <button className={tabClass('sent')} onClick={() => setActiveTab('sent')}>Sent ({sent.length})</button>
          </div>

          <div className="animate-slide-up">
            {activeTab === 'listings' && (
              myListings.length === 0 ? (
                <EmptyState icon="✨" title="No listings yet" desc={isVerified ? "List your first dress and reach fellow students!" : "Verify your .edu email to start listing dresses."}>
                  {isVerified && <Link to="/create" className="inline-flex px-6 py-3 rounded-full font-semibold text-primary-foreground" style={{ background: 'var(--gradient-primary)' }}>+ Create Listing</Link>}
                </EmptyState>
              ) : (
                myListings.map(l => (
                  <div key={l.id} className="flex items-center gap-4 p-4 border border-border rounded-2xl mb-2 cursor-pointer hover:border-primary/30 transition-colors" style={{ background: 'var(--gradient-card)' }} onClick={() => navigate(`/listing/${l.id}`)}>
                    <img src={l.image} alt={l.title} className="w-16 h-20 rounded-lg object-cover bg-surface shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium whitespace-nowrap overflow-hidden text-ellipsis">{l.title}</h4>
                      <p className="text-xs text-muted-foreground">{l.size} · {l.color} · {l.dressLength} · {l.listingType === 'trade' ? 'Trade' : l.listingType === 'sell-rent' ? `$${l.price} (Buy/Rent)` : `$${l.price}`}</p>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(l.id); }}
                      className="px-4 py-2 rounded-full text-xs font-semibold text-destructive bg-destructive/15 border border-destructive/20 hover:bg-destructive/25 transition-all shrink-0"
                    >
                      🗑
                    </button>
                  </div>
                ))
              )
            )}

            {activeTab === 'received' && (
              received.length === 0 ? (
                <EmptyState icon="💌" title="No messages yet" desc="When someone is interested in your listing, their message will appear here." />
              ) : (
                [...received].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(msg => (
                  <MessageItem key={msg.id} msg={msg} direction="received" />
                ))
              )
            )}

            {activeTab === 'sent' && (
              sent.length === 0 ? (
                <EmptyState icon="💌" title="No messages sent" desc="Browse listings and send a message to get started!" />
              ) : (
                [...sent].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(msg => (
                  <MessageItem key={msg.id} msg={msg} direction="sent" />
                ))
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

function MessageItem({ msg, direction }: { msg: { id: string; fromUserId: string; toUserId: string; listingId: string; message: string; createdAt: string }; direction: 'received' | 'sent' }) {
  const other = direction === 'received' ? getUserById(msg.fromUserId) : getUserById(msg.toUserId);
  const otherName = other ? other.name : 'Unknown User';
  const listing = getListingById(msg.listingId);
  const listingTitle = listing ? listing.title : 'Removed listing';

  return (
    <div className="border border-border rounded-2xl p-6 mb-4 hover:border-primary/30 transition-colors" style={{ background: 'var(--gradient-card)' }}>
      <div className="flex items-center justify-between mb-2">
        <strong className="text-primary-light">{direction === 'received' ? 'From' : 'To'}: {otherName}</strong>
        <span className="text-xs text-muted-foreground">{formatDate(msg.createdAt)}</span>
      </div>
      <Link to={`/listing/${msg.listingId}`} className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer block mb-2">
        Re: {listingTitle}
      </Link>
      <div className="text-sm leading-relaxed">{msg.message}</div>
    </div>
  );
}
