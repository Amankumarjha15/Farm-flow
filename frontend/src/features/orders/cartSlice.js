import { createSlice } from '@reduxjs/toolkit';

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [], // { produceId, cropName, image, unit, price, quantity, availableQuantity, farmerName }
  },
  reducers: {
    addToCart: (state, action) => {
      const item = action.payload;
      const existing = state.items.find((i) => i.produceId === item.produceId);
      if (existing) {
        existing.quantity = Math.min(existing.quantity + item.quantity, item.availableQuantity);
      } else {
        state.items.push(item);
      }
    },
    updateCartQuantity: (state, action) => {
      const { produceId, quantity } = action.payload;
      const item = state.items.find((i) => i.produceId === produceId);
      if (item) item.quantity = Math.max(1, Math.min(quantity, item.availableQuantity));
    },
    removeFromCart: (state, action) => {
      state.items = state.items.filter((i) => i.produceId !== action.payload);
    },
    clearCart: (state) => {
      state.items = [];
    },
  },
});

export const { addToCart, updateCartQuantity, removeFromCart, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
