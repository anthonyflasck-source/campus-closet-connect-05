import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProfileById } from '@/hooks/useProfile';
import type { DressListing } from '@/lib/types';
import { LISTING_TYPE_BADGE_STYLES, LISTING_TYPE_LABELS } from '@/lib/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  listing: DressListing;
  index?: number;
}

export default function ListingCard({ listing, index = 0 }: Props) {
  const { profile: sellerProfile } = useProfileById(listing.owner_id);
  const sellerName = sellerProfile?.full_name || 'Unknown';
  const images = listing.image_urls && listing.image_urls.length > 0 ? listing.image_urls : [];
  const [currentImg, setCurrentImg] = useState(0);
  const hasMultiple = images.length > 1;

  return (
    <Link
      to={`/listing/${listing.id}`}
      className="group flex flex-col rounded-2xl border border-border overflow-hidden cursor-pointer transition-all duration-250 hover:-translate-y-1 hover:border-primary/30 animate-slide-up"
      style={{
        background: 'var(--gradient-card)',
        boxShadow: 'none',
        animationDelay: `${index * 60}ms`,
        animationFillMode: 'backwards',
      }}
    >
      <div className="relative w-full overflow-hidden bg-surface" style={{ paddingTop: '120%' }}>
        {images.length > 0 ? (
          <img
            src={images[currentImg]}
            alt={listing.title}
            loading="lazy"
            className="absolute top-0 left-0 w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-5xl text-muted-foreground">👗</div>
        )}
        {hasMultiple && (
          <>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrentImg(i => (i - 1 + images.length) % images.length); }}
              className="absolute left-1.5 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
            >
              <ChevronLeft className="w-4 h-4 text-foreground" />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrentImg(i => (i + 1) % images.length); }}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
            >
              <ChevronRight className="w-4 h-4 text-foreground" />
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex gap-1">
              {images.map((_, i) => (
                <span key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === currentImg ? 'bg-primary-foreground' : 'bg-primary-foreground/40'}`} />
              ))}
            </div>
          </>
        )}
        <span
          className="absolute top-2 left-2 px-3 py-1 rounded-full text-[0.7rem] font-bold uppercase tracking-wide text-primary-foreground z-10"
          style={{ background: LISTING_TYPE_BADGE_STYLES[listing.listing_type] || LISTING_TYPE_BADGE_STYLES['sale'] }}
         >
          {LISTING_TYPE_LABELS[listing.listing_type] || listing.listing_type}
        </span>
      </div>
      <div className="p-4">
        <div className="text-[1.05rem] font-semibold mb-1 whitespace-nowrap overflow-hidden text-ellipsis">
          {listing.title}
        </div>
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.7rem] bg-foreground/5 text-muted-foreground">📏 {listing.size}</span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.7rem] bg-foreground/5 text-muted-foreground">🎨 {listing.color || '—'}</span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.7rem] bg-foreground/5 text-muted-foreground">🏷️ {listing.event_type || listing.category}</span>
        </div>
        {listing.listing_type === 'both' ? (
          <span className="text-lg font-bold text-primary-light">${listing.purchase_price || 0} <span className="text-xs font-normal text-muted-foreground">buy · ${listing.rental_price_per_day || 0}/day rent</span></span>
        ) : listing.listing_type === 'rent' ? (
          <span className="text-lg font-bold text-primary-light">${listing.rental_price_per_day || 0}<span className="text-xs font-normal text-muted-foreground">/day</span></span>
        ) : (
          <span className="text-lg font-bold text-primary-light">${listing.purchase_price || 0}</span>
        )}
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border text-xs text-muted-foreground">
          <span
            className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[9px] font-bold text-primary-foreground"
            style={{ background: 'var(--gradient-primary)' }}
          >
            {sellerName.charAt(0)}
          </span>
          <span>{sellerName}</span>
        </div>
      </div>
    </Link>
  );
}