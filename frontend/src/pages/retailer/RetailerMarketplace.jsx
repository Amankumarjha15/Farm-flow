import { useEffect, useState, useCallback } from 'react';
import api from '../../utils/api';
import ProduceCard from '../../components/ProduceCard';
import { CardSkeleton, EmptyState, ErrorState, Pagination } from '../../components/Feedback';

const SORT_OPTIONS = [
  { value: '-createdAt', label: 'Newest' },
  { value: 'price', label: 'Price: Low to High' },
  { value: '-price', label: 'Price: High to Low' },
];

export default function RetailerMarketplace() {
  const [filters, setFilters] = useState({ q: '', category: '', location: '', minPrice: '', maxPrice: '', sort: '-createdAt' });
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState([]);
  const [state, setState] = useState({ loading: true, error: null, data: [], pagination: null });
  const [wishlistIds, setWishlistIds] = useState(new Set());

  useEffect(() => {
    api.get('/produce/categories').then(({ data }) => setCategories(data.data));
  }, []);

  const loadWishlist = useCallback(() => {
    api.get('/users/wishlist').then(({ data }) => setWishlistIds(new Set(data.data.map((p) => p._id)))).catch(() => {});
  }, []);
  useEffect(() => { loadWishlist(); }, [loadWishlist]);

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const params = new URLSearchParams({ page, limit: 12, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) });
      const { data } = await api.get(`/produce?${params}`);
      setState({ loading: false, error: null, data: data.data, pagination: data.pagination });
    } catch (err) {
      setState({ loading: false, error: err.response?.data?.message || 'Failed to load produce', data: [], pagination: null });
    }
  }, [filters, page]);

  useEffect(() => { load(); }, [load]);

  const updateFilter = (key, value) => {
    setPage(1);
    setFilters((f) => ({ ...f, [key]: value }));
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl">Marketplace</h1>

      <div className="mb-6 flex flex-wrap gap-3">
        <input
          className="input max-w-xs"
          placeholder="Search crops, description, location…"
          value={filters.q}
          onChange={(e) => updateFilter('q', e.target.value)}
        />
        <select className="input max-w-[160px]" value={filters.category} onChange={(e) => updateFilter('category', e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input className="input max-w-[160px]" placeholder="Location" value={filters.location} onChange={(e) => updateFilter('location', e.target.value)} />
        <input type="number" className="input max-w-[120px]" placeholder="Min ₹" value={filters.minPrice} onChange={(e) => updateFilter('minPrice', e.target.value)} />
        <input type="number" className="input max-w-[120px]" placeholder="Max ₹" value={filters.maxPrice} onChange={(e) => updateFilter('maxPrice', e.target.value)} />
        <select className="input max-w-[180px]" value={filters.sort} onChange={(e) => updateFilter('sort', e.target.value)}>
          {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {state.loading && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      )}

      {!state.loading && state.error && <ErrorState message={state.error} onRetry={load} />}

      {!state.loading && !state.error && state.data.length === 0 && (
        <EmptyState title="No produce matches your filters" description="Try widening your search or clearing filters." />
      )}

      {!state.loading && !state.error && state.data.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {state.data.map((p) => (
              <ProduceCard key={p._id} produce={p} inWishlist={wishlistIds.has(p._id)} onWishlistChange={loadWishlist} />
            ))}
          </div>
          <Pagination page={state.pagination.page} pages={state.pagination.pages} onChange={setPage} />
        </>
      )}
    </div>
  );
}
