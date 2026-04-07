import { useState, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ListingCard from '@/components/ListingCard';
import { getListings } from '@/lib/store';
import type { Listing } from '@/lib/store';

export default function ExplorePage() {
  const listings = getListings();
  const [filters, setFilters] = useState({
    search: '', size: '', color: '', length: '', event: '', type: '', price: '',
  });

  const updateFilter = useCallback((key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = () => {
    setFilters({ search: '', size: '', color: '', length: '', event: '', type: '', price: '' });
  };

  const filtered = listings.filter((l: Listing) => {
    if (filters.search && !l.title.toLowerCase().includes(filters.search.toLowerCase()) && !l.description.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.size && l.size !== filters.size) return false;
    if (filters.color && l.color !== filters.color) return false;
    if (filters.length && l.dressLength !== filters.length) return false;
    if (filters.event && l.eventType !== filters.event) return false;
    if (filters.type && l.listingType !== filters.type && !(filters.type === 'sell' && l.listingType === 'sell-rent') && !(filters.type === 'rent' && l.listingType === 'sell-rent')) return false;
    if (filters.price) {
      if (filters.price === '0-25' && l.price > 25) return false;
      if (filters.price === '25-50' && (l.price < 25 || l.price > 50)) return false;
      if (filters.price === '50-100' && (l.price < 50 || l.price > 100)) return false;
      if (filters.price === '100+' && l.price < 100) return false;
    }
    return true;
  });

  const selectClass = "bg-input border border-border rounded-full px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 min-w-[130px] flex-1 appearance-none";

  return (
    <>
      <Navbar />
      <main className="pt-20 min-h-screen">
        <div className="container">
          <div className="text-center py-12 pb-8 animate-fade-in">
            <h1 className="text-3xl md:text-4xl font-extrabold mb-2 leading-tight">
              Find Your Perfect <span className="gradient-text">Look</span>
            </h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-[500px] mx-auto">
              Buy, rent, sell & trade dresses for every campus occasion
            </p>
          </div>

          <div className="flex items-center gap-2 p-4 bg-card border border-border rounded-2xl flex-wrap backdrop-blur-lg animate-fade-in mb-4">
            <input
              type="text"
              placeholder="🔍 Search dresses..."
              value={filters.search}
              onChange={e => updateFilter('search', e.target.value)}
              className={`${selectClass} flex-[2] min-w-[180px]`}
            />
            <select value={filters.size} onChange={e => updateFilter('size', e.target.value)} className={selectClass}>
              <option value="">All Sizes</option>
              {['XS','S','M','L','XL'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filters.color} onChange={e => updateFilter('color', e.target.value)} className={selectClass}>
              <option value="">All Colors</option>
              {['Black','Blue','Gold','Green','Navy','Pink','Purple','Red','Rose','White'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={filters.length} onChange={e => updateFilter('length', e.target.value)} className={selectClass}>
              <option value="">All Lengths</option>
              {['Short','Midi','Long'].map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <select value={filters.event} onChange={e => updateFilter('event', e.target.value)} className={selectClass}>
              <option value="">All Events</option>
              {['Formal','Semi-Formal','Date Party','Mixer'].map(e => <option key={e} value={e}>{e}</option>)}
            </select>
            <select value={filters.type} onChange={e => updateFilter('type', e.target.value)} className={selectClass}>
              <option value="">All Types</option>
              <option value="sell">Buy</option>
              <option value="rent">Rent</option>
              <option value="trade">Trade</option>
              <option value="sell-rent">Buy or Rent</option>
            </select>
            <select value={filters.price} onChange={e => updateFilter('price', e.target.value)} className={selectClass}>
              <option value="">Any Price</option>
              <option value="0-25">Under $25</option>
              <option value="25-50">$25 – $50</option>
              <option value="50-100">$50 – $100</option>
              <option value="100+">$100+</option>
            </select>
            <button
              onClick={clearFilters}
              className="px-4 py-2 rounded-full text-xs font-semibold text-primary bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-all whitespace-nowrap"
            >
              Clear All
            </button>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Showing {filtered.length} of {listings.length} listings
          </p>

          {filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <div className="text-5xl mb-4 opacity-50">👗</div>
              <h3 className="text-lg mb-2 text-foreground">No dresses found</h3>
              <p className="text-sm">Try adjusting your filters or search</p>
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-6 pb-16 max-sm:grid-cols-[repeat(auto-fill,minmax(160px,1fr))] max-sm:gap-4">
              {filtered.map((l, i) => (
                <ListingCard key={l.id} listing={l} index={i} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
