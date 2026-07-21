import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { addToCart } from '../features/orders/cartSlice';

export default function ProduceCard({ produce, onWishlistChange, inWishlist }) {
  const dispatch = useDispatch();

  const handleAddToCart = (e) => {
    e.preventDefault();
    dispatch(
      addToCart({
        produceId: produce._id,
        cropName: produce.cropName,
        image: produce.images?.[0]?.url,
        unit: produce.unit,
        price: produce.price,
        quantity: 1,
        availableQuantity: produce.availableQuantity,
        farmerName: produce.farmer?.name,
      })
    );
    toast.success(`${produce.cropName} added to cart`);
  };

  const toggleWishlist = async (e) => {
    e.preventDefault();
    try {
      if (inWishlist) {
        await api.delete(`/users/wishlist/${produce._id}`);
      } else {
        await api.post('/users/wishlist', { produceId: produce._id });
      }
      onWishlistChange?.();
    } catch {
      toast.error('Could not update wishlist');
    }
  };

  return (
    <Link to={`/retailer/produce/${produce._id}`} className="card group overflow-hidden transition-shadow hover:shadow-md">
      <div className="relative h-40 bg-furrow-100">
        {produce.images?.[0]?.url ? (
          <img src={produce.images[0].url} alt={produce.cropName} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-3xl">🌾</div>
        )}
        <button
          onClick={toggleWishlist}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-sm shadow-sm"
        >
          {inWishlist ? '❤️' : '🤍'}
        </button>
        {produce.isOrganic && (
          <span className="badge absolute left-2 top-2 bg-furrow-800 text-white">Organic</span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-display text-base font-semibold">{produce.cropName}</h3>
        <p className="text-xs text-soil/40">{produce.farmer?.name} · {produce.location}</p>
        <div className="mt-2 flex items-center justify-between">
          <p className="font-display text-lg font-semibold text-wheat-600">
            ₹{produce.price}<span className="text-xs font-body text-soil/40">/{produce.unit}</span>
          </p>
          <span className="badge bg-furrow-100 text-furrow-800">Grade {produce.qualityGrade}</span>
        </div>
        <button onClick={handleAddToCart} className="btn-primary mt-3 w-full py-1.5 text-xs">
          Add to cart
        </button>
      </div>
    </Link>
  );
}
