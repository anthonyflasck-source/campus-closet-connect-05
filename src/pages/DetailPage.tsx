import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { getListingById, getUserById, deleteListing, sendMessage, formatDate } from '@/lib/store';
import { toast } from 'sonner';

export default function DetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const listing = getListingById(id || '');
  const [showModal, setShowModal] = useState(false);
  const [msgText, setMsgText] = useState('');

  if (!listing) {
    return (
      <>
        <Navbar />
        <main className="pt-20 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl mb-4 opacity-50">❌</div>
            <h3 className="text-lg mb-2">Listing Not Found</h3>
            <p className="text-sm text-muted-foreground mb-4">This listing may have been removed.</p>
            <button onClick={() => navigate('/')} className="px-6 py-3 rounded-full font-semibold text-primary-foreground" style={{ background: 'var(--gradient-primary)' }}>
              Browse Listings
            </button>
          </div>
        </main>
      </>
    );
  }

  const seller = getUserById(listing.userId);
  const sellerName = seller ? seller.name : 'Unknown';
  const isOwner = user && user.id === listing.userId;

  const badgeStyles: Record<string, string> = {
    sell: 'var(--gradient-badge-sell)',
    rent: 'var(--gradient-badge-rent)',
    trade: 'var(--gradient-badge-trade)',
    'sell-rent': 'var(--gradient-badge-sell-rent)',
  };

  const badgeLabel: Record<string, string> = {
    sell: 'Buy', rent: 'Rent', trade: 'Trade', 'sell-rent': 'Buy or Rent',
  };

  const handleDelete = () => {
    if (confirm('Remove this listing? This cannot be undone.')) {
      deleteListing(listing.id);
      toast.success('Listing removed');
      navigate('/');
    }
  };

  const handleSendMessage = () => {
    if (!msgText.trim()) { toast.error('Please write a message'); return; }
    if (!user) { toast.error('Please sign in'); navigate('/login'); return; }
    sendMessage(user.id, listing.userId, listing.id, msgText.trim());
    setShowModal(false);
    setMsgText('');
    toast.success('Message sent! The seller will see it in their dashboard.');
  };

  const handleContact = () => {
    if (!user) { toast.error('Please sign in to send a message'); navigate('/login'); return; }
    setShowModal(true);
  };

  const contactLabel = listing.listingType === 'trade' ? 'Propose a Trade' : listing.listingType === 'rent' ? 'Request to Rent' : listing.listingType === 'sell-rent' ? 'Buy or Rent' : 'Contact Seller';

  return (
    <>
      <Navbar />
      <main className="pt-20 min-h-screen">
        <div className="container">
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 py-4 text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer">
            ← Back to listings
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-16 animate-fade-in">
            <div className="rounded-3xl overflow-hidden bg-surface border border-border">
              <img src={listing.image} alt={listing.title} className="w-full aspect-[3/4] object-cover" />
            </div>

            <div className="py-4">
              <span className="inline-block px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide text-primary-foreground mb-4" style={{ background: badgeStyles[listing.listingType] }}>
                {badgeLabel[listing.listingType] || listing.listingType}
              </span>

              <h1 className="text-2xl md:text-3xl font-extrabold mb-2 leading-tight">{listing.title}</h1>

              {listing.listingType === 'trade' ? (
                <div className="text-lg font-bold text-success mb-6">✨ Open to Trade</div>
              ) : listing.listingType === 'sell-rent' ? (
                <div className="mb-6">
                  <div className="text-xl font-bold text-primary-light mb-1">${listing.price} <span className="text-sm font-normal text-muted-foreground">to buy</span></div>
                  <div className="text-base font-semibold text-accent">${Math.round(listing.price * 0.3)}/event <span className="text-sm font-normal text-muted-foreground">to rent</span></div>
                </div>
              ) : (
                <div className="text-xl font-bold text-primary-light mb-6">
                  {listing.listingType === 'rent' ? `$${listing.price}/event` : `$${listing.price}`}
                </div>
              )}

              <p className="text-base text-muted-foreground leading-relaxed mb-8">{listing.description}</p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                {[
                  { label: 'Size', value: listing.size },
                  { label: 'Color', value: listing.color },
                  { label: 'Length', value: listing.dressLength },
                  { label: 'Event Type', value: listing.eventType },
                ].map(spec => (
                  <div key={spec.label} className="bg-foreground/[0.03] border border-border rounded-lg p-4">
                    <div className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">{spec.label}</div>
                    <div className="text-base font-semibold">{spec.value}</div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-4 p-6 border border-border rounded-2xl mb-8" style={{ background: 'var(--gradient-card)' }}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-primary-foreground shrink-0" style={{ background: 'var(--gradient-primary)' }}>
                  {sellerName.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold">{sellerName}</div>
                  <div className="text-xs text-muted-foreground">Listed {formatDate(listing.createdAt)}</div>
                </div>
              </div>

              {isOwner ? (
                <button onClick={handleDelete} className="px-6 py-3 rounded-full font-semibold text-destructive bg-destructive/15 border border-destructive/20 hover:bg-destructive/25 transition-all">
                  🗑 Remove Listing
                </button>
              ) : (
                <button onClick={handleContact} className="w-full py-4 rounded-full font-semibold text-primary-foreground text-base transition-all hover:-translate-y-0.5 active:scale-[0.98]" style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-glow)' }}>
                  💌 {contactLabel}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {showModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 animate-fade-in" style={{ background: 'hsla(270, 30%, 5%, 0.92)', backdropFilter: 'blur(8px)' }} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="bg-surface border border-border rounded-3xl p-8 w-full max-w-[500px] animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Send a Message</h2>
              <button onClick={() => setShowModal(false)} className="w-9 h-9 rounded-full bg-foreground/5 flex items-center justify-center text-lg hover:bg-foreground/10 transition-colors">✕</button>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Contact <strong className="text-primary-light">{sellerName}</strong> about <em>{listing.title}</em>
            </p>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Your Message</label>
              <textarea
                value={msgText}
                onChange={e => setMsgText(e.target.value)}
                placeholder="Hi! I'm interested in this dress. Is it still available?"
                className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 resize-y min-h-[100px]"
              />
            </div>
            <button onClick={handleSendMessage} className="w-full py-4 rounded-full font-semibold text-primary-foreground text-base" style={{ background: 'var(--gradient-primary)' }}>
              Send Message 💌
            </button>
          </div>
        </div>
      )}
    </>
  );
}
