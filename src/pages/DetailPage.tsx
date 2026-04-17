import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [currentImg, setCurrentImg] = useState(0);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutName, setCheckoutName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [processing, setProcessing] = useState(false);
  const [confirmation, setConfirmation] = useState<string | null>(null);

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
  const images = listing.image_urls && listing.image_urls.length > 0 ? listing.image_urls : [];
  const hasMultiple = images.length > 1;
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
      console.error('[Messaging] Send failed:', message);
      if (message.includes('permission denied') || message.includes('row-level security') || message.includes('violates row-level security')) {
        toast.error('Unable to send message. Your account verification may still be processing — please check your profile or try again shortly.');
      } else if (message.includes('relation') && message.includes('does not exist')) {
        toast.error('Messaging is not yet available. Please contact support.');
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
    if (user.id === listing.owner_id) {
      toast.error("You can't message yourself");
      return;
    }
    setShowModal(true);
  };

  const contactLabel = listing.listing_type === 'rent' ? 'Request to Rent' : listing.listing_type === 'both' ? 'Buy or Rent' : 'Contact Seller';
  const canBuy = listing.listing_type === 'sale' || listing.listing_type === 'both';
  const buyPrice = listing.purchase_price || 0;

  const handleBuyNow = () => {
    if (!user) { toast.error('Please sign in to purchase'); navigate('/login'); return; }
    if (!isSchoolEmailVerified) { toast.error('Verify your school email before purchasing'); navigate('/dashboard'); return; }
    if (user.id === listing.owner_id) { toast.error("You can't buy your own listing"); return; }
    setCheckoutName(user.user_metadata?.full_name || user.email?.split('@')[0] || '');
    setShowCheckout(true);
  };

  const handleConfirmPurchase = async () => {
    if (!user || !listing) return;
    const cleanCard = cardNumber.replace(/\s/g, '');
    if (!checkoutName.trim()) return toast.error('Enter the cardholder name');
    if (!/^\d{15,16}$/.test(cleanCard)) return toast.error('Enter a valid 15-16 digit card number');
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardExpiry)) return toast.error('Expiry must be MM/YY');
    if (!/^\d{3,4}$/.test(cardCvv)) return toast.error('CVV must be 3-4 digits');

    setProcessing(true);
    const confirmationCode = `CC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const { error } = await supabase.from('orders').insert({
      buyer_id: user.id,
      seller_id: listing.owner_id,
      dress_id: listing.id,
      final_price: buyPrice,
      status: 'completed',
    });

    if (error) {
      setProcessing(false);
      toast.error(error.message || 'Payment failed');
      return;
    }

    try {
      await sendConversationMessage({
        listingId: listing.id,
        buyerId: user.id,
        sellerId: listing.owner_id,
        senderId: user.id,
        body: `✅ Purchase confirmed!\n\nBuyer: ${checkoutName.trim()}\nAmount: $${buyPrice}\nConfirmation: ${confirmationCode}\n\nPlease coordinate pickup details.`,
      });
    } catch (e) {
      console.warn('Could not auto-message seller:', e);
    }

    await supabase.from('dresses').update({ is_available: false }).eq('id', listing.id);

    setProcessing(false);
    setConfirmation(confirmationCode);
    toast.success('Payment successful!');
  };

  const closeCheckout = () => {
    setShowCheckout(false);
    setConfirmation(null);
    setCardNumber(''); setCardExpiry(''); setCardCvv('');
  };


  return (
    <>
      <Navbar />
      <main className="pt-20 min-h-screen">
        <div className="container">
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 py-4 text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer">
            ← Back to listings
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-16 animate-fade-in">
            <div className="rounded-3xl overflow-hidden bg-surface border border-border relative group">
              {images.length > 0 ? (
                <img src={images[currentImg]} alt={listing.title} className="w-full aspect-[3/4] object-cover" />
              ) : (
                <div className="w-full aspect-[3/4] flex items-center justify-center text-5xl text-muted-foreground bg-surface">👗</div>
              )}
              {hasMultiple && (
                <>
                  <button
                    onClick={() => setCurrentImg(i => (i - 1 + images.length) % images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
                  >
                    <ChevronLeft className="w-5 h-5 text-foreground" />
                  </button>
                  <button
                    onClick={() => setCurrentImg(i => (i + 1) % images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
                  >
                    <ChevronRight className="w-5 h-5 text-foreground" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
                    {images.map((_, i) => (
                      <button key={i} onClick={() => setCurrentImg(i)} className={`w-2 h-2 rounded-full transition-colors ${i === currentImg ? 'bg-primary-foreground' : 'bg-primary-foreground/40'}`} />
                    ))}
                  </div>
                </>
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
