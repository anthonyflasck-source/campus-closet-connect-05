import { Link } from 'react-router-dom';
import { getUserById } from '@/lib/store';
import type { Listing } from '@/lib/store';

interface Props {
  listing: Listing;
  index?: number;
}

export default function ListingCard({ listing, index = 0 }: Props) {
  const seller = getUserById(listing.userId);
  const sellerName = seller ? seller.name : 'Unknown';

  const badgeStyles: Record<string, string> = {
    sell: 'var(--gradient-badge-sell)',
    rent: 'var(--gradient-badge-rent)',
    trade: 'var(--gradient-badge-trade)',
    'sell-rent': 'var(--gradient-badge-sell-rent)',
  };

  const badgeLabel: Record<string, string> = {
    sell: 'Buy', rent: 'Rent', trade: 'Trade', 'sell-rent': 'Buy or Rent',
  };

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
        <img
          src={listing.image}
          alt={listing.title}
          loading="lazy"
          className="absolute top-0 left-0 w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
        />
        <span
          className="absolute top-2 left-2 px-3 py-1 rounded-full text-[0.7rem] font-bold uppercase tracking-wide text-primary-foreground z-10"
          style={{ background: badgeStyles[listing.listingType] }}
         >
          {badgeLabel[listing.listingType] || listing.listingType}
        </span>
      </div>
      <div className="p-4">
        <div className="text-[1.05rem] font-semibold mb-1 whitespace-nowrap overflow-hidden text-ellipsis">
          {listing.title}
        </div>
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.7rem] bg-foreground/5 text-muted-foreground">📏 {listing.size}</span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.7rem] bg-foreground/5 text-muted-foreground">🎨 {listing.color}</span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.7rem] bg-foreground/5 text-muted-foreground">📐 {listing.dressLength}</span>
        </div>
        {listing.listingType === 'trade' ? (
          <span className="text-sm text-success font-medium">✨ Open to Trade</span>
        ) : listing.listingType === 'sell-rent' ? (
          <span className="text-lg font-bold text-primary-light">${listing.price} <span className="text-xs font-normal text-muted-foreground">buy · ${Math.round(listing.price * 0.3)}/rent</span></span>
        ) : (
          <span className="text-lg font-bold text-primary-light">${listing.price}</span>
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
