import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { useProfileById } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import type { DressListing } from '@/lib/types';
import { LISTING_TYPE_BADGE_STYLES, LISTING_TYPE_LABELS } from '@/lib/types';
import { formatDate } from '@/lib/store';
import { sendConversationMessage } from '@/lib/messaging';
import { toast } from 'sonner';

export default function DetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isSchoolEmailVerified } = useAuth();
  const [listing, setListing] = useState<DressListing | null>(null);
  const [loadingListing, setLoadingListing] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [msgText, setMsgText] = useState('');

  // Fetch listing from Supabase
  useEffect(() => {
    if (!id) return;
    supabase
      .from('dresses')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        setListing(data as DressListing | null);
        setLoadingListing(false);
      });
  }, [id]);

  // Fetch seller profile from Supabase
  const { profile: sellerProfile } = useProfileById(listing?.owner_id);

  if (loadingListing) {
    return (
      <>
        <Navbar />
        <main className="pt-20 min-h-screen flex items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </main>
      </>
    );
  }

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

  const sellerName = sellerProfile?.full_name || 'Unknown';
  const isOwner = user && user.id === listing.owner_id;
  const imageUrl = listing.image_urls && listing.image_urls.length > 0 ? listing.image_urls[0] : '';
  const eventLabel = listing.event_type || listing.category;

  const handleDelete = async () => {
    if (confirm('Remove this listing? This cannot be undone.')) {
      await supabase.from('dresses').update({ status: 'inactive' }).eq('id', listing.id);
      toast.success('Listing removed');
      navigate('/');
    }
  };

  const handleSendMessage = async () => {
    if (!msgText.trim()) { toast.error('Please write a message'); return; }
    if (!user) { toast.error('Please sign in'); navigate('/login'); return; }
    if (!isSchoolEmailVerified) {
      toast.error('Verify your school email before messaging sellers');
      navigate('/dashboard');
      return;
    }
    if (user.id === listing.owner_id) {
      toast.error("You can't message yourself");
      return;
    }

    try {
      await sendConversationMessage({
        listingId: listing.id,
        buyerId: user.id,
        sellerId: listing.owner_id,
        senderId: user.id,
        body: msgText.trim(),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send message';
      if (message.includes('permission denied') || message.includes('row-level security')) {
        toast.error('Unable to send message. Please make sure your email is verified.');
      } else {
        toast.error(message);
      }
      return;
    }

    setShowModal(false);
    setMsgText('');
    toast.success('Message sent! The seller can reply in their dashboard.');
  };

  const handleContact = () => {
    if (!user) { toast.error('Please sign in to send a message'); navigate('/login'); return; }
    if (!isSchoolEmailVerified) {
      toast.error('Verify your school email before messaging sellers');
      navigate('/dashboard');
      return;
    }
    setShowModal(true);
  };

  const contactLabel = listing.listing_type === 'rent' ? 'Request to Rent' : listing.listing_type === 'both' ? 'Buy or Rent' : 'Contact Seller';

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
              {imageUrl ? (
                <img src={imageUrl} alt={listing.title} className="w-full aspect-[3/4] object-cover" />
              ) : (
                <div className="w-full aspect-[3/4] flex items-center justify-center text-5xl text-muted-foreground bg-surface">👗</div>
              )}
            </div>

            <div className="py-4">
              <span className="inline-block px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide text-primary-foreground mb-4" style={{ background: LISTING_TYPE_BADGE_STYLES[listing.listing_type] || LISTING_TYPE_BADGE_STYLES['sale'] }}>
                {LISTING_TYPE_LABELS[listing.listing_type] || listing.listing_type}
              </span>

              <h1 className="text-2xl md:text-3xl font-extrabold mb-2 leading-tight">{listing.title}</h1>

              {listing.listing_type === 'both' ? (
                <div className="mb-6">
                  <div className="text-xl font-bold text-primary-light mb-1">${listing.purchase_price || 0} <span className="text-sm font-normal text-muted-foreground">to buy</span></div>
                  <div className="text-base font-semibold text-accent">${listing.rental_price_per_day || 0}/day <span className="text-sm font-normal text-muted-foreground">to rent</span></div>
                </div>
              ) : listing.listing_type === 'rent' ? (
                <div className="text-xl font-bold text-primary-light mb-6">
                  ${listing.rental_price_per_day || 0}/day
                </div>
              ) : (
                <div className="text-xl font-bold text-primary-light mb-6">
                  ${listing.purchase_price || 0}
                </div>
              )}

              <p className="text-base text-muted-foreground leading-relaxed mb-8">{listing.description}</p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                {[
                  { label: 'Size', value: listing.size },
                  { label: 'Color', value: listing.color || '—' },
                  { label: 'Condition', value: listing.condition || '—' },
                  { label: 'Event Type', value: eventLabel },
                  ...(listing.brand ? [{ label: 'Brand', value: listing.brand }] : []),
                  ...(listing.pickup_location_general ? [{ label: 'Pickup Area', value: listing.pickup_location_general }] : []),
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
                  <div className="text-xs text-muted-foreground">Listed {formatDate(listing.created_at)}</div>
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
