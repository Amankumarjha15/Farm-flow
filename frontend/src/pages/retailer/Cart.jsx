import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { updateCartQuantity, removeFromCart, clearCart } from '../../features/orders/cartSlice';
import { EmptyState } from '../../components/Feedback';

export default function Cart() {
  const { items } = useSelector((state) => state.cart);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [step, setStep] = useState('cart'); // cart | address | payment
  const [placing, setPlacing] = useState(false);
  const [provider, setProvider] = useState('razorpay');
  const [createdOrder, setCreatedOrder] = useState(null);

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const placeOrder = async (address) => {
    setPlacing(true);
    try {
      const { data } = await api.post('/orders', {
        items: items.map((i) => ({ produceId: i.produceId, quantity: i.quantity })),
        shippingAddress: address,
      });
      setCreatedOrder(data.data);
      setStep('payment');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  const payWithRazorpay = async () => {
    try {
      const { data } = await api.post('/payments/razorpay/initiate', { orderId: createdOrder._id });
      // In production, this opens the Razorpay Checkout widget using data.data.razorpayOrderId.
      // Simulated here since no live keys are configured in this environment.
      toast.success('Razorpay checkout initiated — complete payment in the popup.');
      console.log('Razorpay order created:', data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment initiation failed');
    }
  };

  const payWithStripe = async () => {
    try {
      const { data } = await api.post('/payments/stripe/initiate', { orderId: createdOrder._id });
      // In production, use data.data.clientSecret with Stripe Elements / Checkout.
      toast.success('Stripe payment initiated — complete payment in the form.');
      console.log('Stripe client secret:', data.data.clientSecret);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment initiation failed');
    }
  };

  const payWithMock = async () => {
    try {
      await api.post('/payments/mock/complete', { orderId: createdOrder._id });
      toast.success('Payment simulated — order is now ready for shipment.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Mock payment failed');
      throw err;
    }
  };

  if (items.length === 0 && step === 'cart') {
    return <EmptyState title="Your cart is empty" description="Browse the marketplace to add produce." />;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl">
        {step === 'cart' && 'Your Cart'}
        {step === 'address' && 'Shipping Address'}
        {step === 'payment' && 'Payment'}
      </h1>

      {step === 'cart' && (
        <>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.produceId} className="card flex items-center gap-4 p-4">
                <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-DEFAULT bg-furrow-100">
                  {item.image ? <img src={item.image} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center">🌾</div>}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{item.cropName}</p>
                  <p className="text-xs text-soil/40">{item.farmerName} · ₹{item.price}/{item.unit}</p>
                </div>
                <input
                  type="number"
                  min={1}
                  max={item.availableQuantity}
                  value={item.quantity}
                  onChange={(e) => dispatch(updateCartQuantity({ produceId: item.produceId, quantity: Number(e.target.value) }))}
                  className="input w-20 py-1.5 text-center text-sm"
                />
                <p className="w-24 text-right font-semibold">₹{(item.price * item.quantity).toLocaleString()}</p>
                <button onClick={() => dispatch(removeFromCart(item.produceId))} className="text-clay">✕</button>
              </div>
            ))}
          </div>
          <div className="card mt-6 flex items-center justify-between p-4">
            <p className="font-semibold">Total</p>
            <p className="font-display text-xl font-semibold text-wheat-600">₹{total.toLocaleString()}</p>
          </div>
          <button onClick={() => setStep('address')} className="btn-primary mt-4 w-full">Proceed to checkout</button>
        </>
      )}

      {step === 'address' && (
        <form onSubmit={handleSubmit(placeOrder)} className="card space-y-4 p-6">
          <div>
            <label className="label">Address line</label>
            <input className="input" {...register('line1', { required: true })} />
            {errors.line1 && <p className="mt-1 text-xs text-clay">Required</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input className="input" placeholder="City" {...register('city', { required: true })} />
            <input className="input" placeholder="State" {...register('state')} />
          </div>
          <input className="input" placeholder="Pincode" {...register('pincode', { required: true })} />
          <div className="flex gap-3">
            <button type="button" onClick={() => setStep('cart')} className="btn-outline">Back</button>
            <button type="submit" disabled={placing} className="btn-primary flex-1">
              {placing ? 'Placing order…' : 'Place order'}
            </button>
          </div>
        </form>
      )}

      {step === 'payment' && createdOrder && (
        <div className="card space-y-5 p-6">
          <div className="flex items-center justify-between border-b border-furrow-100 pb-4">
            <p className="text-sm text-soil/50">Order {createdOrder.orderNumber}</p>
            <p className="font-display text-xl font-semibold text-wheat-600">₹{createdOrder.totalAmount.toLocaleString()}</p>
          </div>
          <div className="flex gap-3">
            <label className={`flex-1 cursor-pointer rounded-DEFAULT border p-3 text-center text-sm font-medium ${provider === 'razorpay' ? 'border-furrow-700 bg-furrow-100' : 'border-furrow-100'}`}>
              <input type="radio" className="hidden" checked={provider === 'razorpay'} onChange={() => setProvider('razorpay')} />
              Razorpay
            </label>
            <label className={`flex-1 cursor-pointer rounded-DEFAULT border p-3 text-center text-sm font-medium ${provider === 'stripe' ? 'border-furrow-700 bg-furrow-100' : 'border-furrow-100'}`}>
              <input type="radio" className="hidden" checked={provider === 'stripe'} onChange={() => setProvider('stripe')} />
              Stripe
            </label>
          </div>
          <button
            onClick={async () => {
              provider === 'razorpay' ? await payWithRazorpay() : await payWithStripe();
              dispatch(clearCart());
              navigate('/retailer/orders');
            }}
            className="btn-accent w-full"
          >
            Pay ₹{createdOrder.totalAmount.toLocaleString()}
          </button>

          <div className="border-t border-furrow-100 pt-4">
            <p className="mb-2 text-xs text-soil/40">
              No payment provider keys configured yet? Skip straight to testing the rest of the flow
              (logistics, delivery, payouts) with a simulated payment — this runs the real order
              fulfillment logic, it just skips the actual charge.
            </p>
            <button
              onClick={async () => {
                await payWithMock();
                dispatch(clearCart());
                navigate('/retailer/orders');
              }}
              className="btn-outline w-full text-xs"
            >
              🧪 Simulate payment (test mode)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
