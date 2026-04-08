/**
 * Shared TypeScript interface for a dress listing from Supabase.
 * Mirrors the `public.dresses` table schema.
 */
export interface DressListing {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  size: string;
  color: string | null;
  brand: string | null;
  condition: string | null;
  category: string;
  event_type: string | null;
  image_urls: string[] | null;
  purchase_price: number | null;
  rental_price_per_day: number | null;
  listing_type: 'sale' | 'rent' | 'both';
  status: 'available' | 'pending' | 'rented' | 'sold' | 'inactive';
  is_available: boolean;
  university: string | null;
  pickup_location_general: string | null;
  created_at: string;
  updated_at: string;
}

/** Badge background gradient CSS variables for each listing type */
export const LISTING_TYPE_BADGE_STYLES: Record<string, string> = {
  sale: 'var(--gradient-badge-sell)',
  rent: 'var(--gradient-badge-rent)',
  both: 'var(--gradient-badge-sell-rent)',
};

/** Human-readable labels for listing types */
export const LISTING_TYPE_LABELS: Record<string, string> = {
  sale: 'Buy',
  rent: 'Rent',
  both: 'Buy or Rent',
};
