import { useEffect, useState, useCallback } from 'react';
import api from '../../utils/api';
import ProduceCard from '../../components/ProduceCard';
import { EmptyState, CardSkeleton } from '../../components/Feedback';

export default function RetailerWishlist() {
  const [items, setItems] = useState(null);

  const load = useCallback(() => {
    api.get('/users/wishlist').then(({ data }) => setItems(data.data));
  }, []);

  useEffect(() => { load(); }, [load]);

  if (!items) {
    return <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}</div>;
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl">Wishlist</h1>
      {items.length === 0 ? (
        <EmptyState title="Your wishlist is empty" description="Tap the heart icon on any listing to save it here." />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((p) => <ProduceCard key={p._id} produce={p} inWishlist onWishlistChange={load} />)}
        </div>
      )}
    </div>
  );
}
