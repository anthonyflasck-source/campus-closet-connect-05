import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function CreatePage() {
  const navigate = useNavigate();
  const { user, profile, loading, isSchoolEmailVerified } = useAuth();
  const [photos, setPhotos] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [brand, setBrand] = useState('');
  const [dressLength, setDressLength] = useState('');
  const [eventType, setEventType] = useState('');
  const [listingType, setListingType] = useState('');
  const [price, setPrice] = useState('');
  const [rentalPrice, setRentalPrice] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (loading) return null;
  if (!user) { navigate('/login'); return null; }

  const isVerified = isSchoolEmailVerified;

  if (!isVerified) {
    return (
      <>
        <Navbar />
        <main className="pt-24 pb-16 min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="text-5xl mb-4">⏳</div>
            <h1 className="text-xl font-bold mb-2">Verification Required</h1>
            <p className="text-sm text-muted-foreground mb-4">
              You need a confirmed .edu email to create listings. After signing up, click the link in your verification email and then come back here.
            </p>
            <button onClick={() => navigate('/dashboard')} className="px-6 py-3 rounded-full font-semibold text-primary-foreground" style={{ background: 'var(--gradient-primary)' }}>
              Go to Dashboard
            </button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newPhotos: string[] = [];
    const remaining = 5 - photos.length;
    const toProcess = Array.from(files).slice(0, remaining);
    if (toProcess.length < files.length) toast.error(`Max 5 photos — only adding ${toProcess.length}`);
    let loaded = 0;
    toProcess.forEach(file => {
      if (file.size > 5 * 1024 * 1024) { toast.error(`${file.name} too large (max 5MB)`); loaded++; return; }
      const reader = new FileReader();
      reader.onload = ev => {
        newPhotos.push(ev.target?.result as string);
        loaded++;
        if (loaded === toProcess.length) setPhotos(prev => [...prev, ...newPhotos]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => setPhotos(prev => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!title || !desc || !size || !color || !dressLength || !eventType || !listingType) {
      setError('Please fill in all required fields'); return;
    }

    setSubmitting(true);

    const purchasePrice = (listingType === 'sale' || listingType === 'both') ? (parseInt(price) || 0) : null;
    const rentalPriceVal = (listingType === 'rent' || listingType === 'both') ? (parseInt(rentalPrice || price) || 0) : null;

    const { data, error: insertError } = await supabase
      .from('dresses')
      .insert({
        owner_id: user.id,
        title,
        description: desc,
        size,
        color,
        brand: brand.trim() || null,
        event_type: eventType,
        category: eventType, // keep category in sync for backward compat
        listing_type: listingType,
        purchase_price: purchasePrice,
        rental_price_per_day: rentalPriceVal,
        image_urls: photoData ? [photoData] : [],
        university: profile?.university || '',
        pickup_location_general: pickupLocation.trim() || null,
        condition: dressLength, // store dress length in condition for now
        status: 'available',
      })
      .select()
      .single();

    setSubmitting(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    toast.success('Listing published! ✨');
    navigate(`/listing/${data.id}`);
  };

  const inputClass = "w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15";
  const selectClass = inputClass + " appearance-none";

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-16 min-h-screen">
        <div className="container">
          <div className="border border-border rounded-3xl p-8 max-w-[680px] mx-auto animate-fade-in" style={{ background: 'var(--gradient-card)' }}>
            <h1 className="text-xl font-bold mb-1">Create a Listing</h1>
            <p className="text-sm text-muted-foreground mb-8">List your dress for sale or rent</p>

            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Photo</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-2xl p-8 text-center cursor-pointer text-muted-foreground hover:border-primary hover:bg-primary/5 transition-all"
                >
                  {photoData ? (
                    <img src={photoData} alt="Preview" className="max-h-[250px] mx-auto rounded-lg" />
                  ) : (
                    <>
                      <div className="text-4xl mb-2">📸</div>
                      <p>Click to upload a photo</p>
                      <p className="text-xs text-muted-foreground mt-1">JPG, PNG — max 5MB</p>
                    </>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Title</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Rose Satin A-Line Formal Dress" className={inputClass} required />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Description</label>
                <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Describe condition, fit, style..." className={`${inputClass} resize-y min-h-[100px]`} required />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6 max-[480px]:grid-cols-1">
                <div>
                  <label className="block text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Size</label>
                  <select value={size} onChange={e => setSize(e.target.value)} className={selectClass} required>
                    <option value="">Select size</option>
                    {['XXS','XS','S','M','L','XL','XXL'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Color</label>
                  <select value={color} onChange={e => setColor(e.target.value)} className={selectClass} required>
                    <option value="">Select color</option>
                    {['Black','Blue','Brown','Coral','Gold','Green','Grey','Ivory','Lavender','Maroon','Navy','Orange','Pink','Purple','Red','Rose','Silver','Tan','Teal','White','Yellow'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6 max-[480px]:grid-cols-1">
                <div>
                  <label className="block text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Dress Length</label>
                  <select value={dressLength} onChange={e => setDressLength(e.target.value)} className={selectClass} required>
                    <option value="">Select length</option>
                    {['Short','Midi','Long'].map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Event Type</label>
                  <select value={eventType} onChange={e => setEventType(e.target.value)} className={selectClass} required>
                    <option value="">Select event</option>
                    {['Formal','Semi-Formal','Date Party','Mixer','Other'].map(ev => <option key={ev} value={ev}>{ev}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6 max-[480px]:grid-cols-1">
                <div>
                  <label className="block text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Brand <span className="normal-case font-normal">(optional)</span></label>
                  <input value={brand} onChange={e => setBrand(e.target.value)} placeholder="e.g. Lulus, ASOS" className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Pickup Area <span className="normal-case font-normal">(optional)</span></label>
                  <input value={pickupLocation} onChange={e => setPickupLocation(e.target.value)} placeholder="e.g. North Campus" className={inputClass} />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Listing Type</label>
                <select value={listingType} onChange={e => setListingType(e.target.value)} className={selectClass} required>
                  <option value="">Select type</option>
                  <option value="sale">Sell</option>
                  <option value="rent">Rent</option>
                  <option value="both">Sell or Rent</option>
                </select>
              </div>

              {(listingType === 'sale' || listingType === 'both') && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Sale Price ($)</label>
                  <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0" min="0" className={inputClass} />
                </div>
              )}

              {(listingType === 'rent' || listingType === 'both') && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Rental Price ($/day)</label>
                  <input type="number" value={rentalPrice} onChange={e => setRentalPrice(e.target.value)} placeholder="0" min="0" className={inputClass} />
                </div>
              )}

              {error && <p className="text-xs text-destructive mb-4">{error}</p>}

              <button type="submit" disabled={submitting} className="w-full py-4 rounded-full font-semibold text-primary-foreground text-base disabled:opacity-50" style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-glow)' }}>
                {submitting ? 'Publishing...' : '✨ Publish Listing'}
              </button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
