// Admin nav is grouped into sections (rather than one flat list) so related tools sit together
// and nothing gets lost visually as the panel grows.
export const ADMIN_NAV_GROUPS = [
  {
    label: 'Overview',
    items: [{ label: 'Dashboard', to: '/admin', icon: '📊' }],
  },
  {
    label: 'People',
    items: [
      { label: 'Farmers', to: '/admin/farmers', icon: '🌾' },
      { label: 'Retailers', to: '/admin/retailers', icon: '🏪' },
      { label: 'Logistics', to: '/admin/logistics', icon: '🚚' },
    ],
  },
  {
    label: 'Marketplace',
    items: [
      { label: 'Produce', to: '/admin/produce', icon: '📋' },
      { label: 'Categories', to: '/admin/categories', icon: '🏷️' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { label: 'Payments', to: '/admin/payments', icon: '💳' },
      { label: 'Payouts', to: '/admin/payouts', icon: '💰' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Disputes', to: '/admin/disputes', icon: '⚖️' },
      { label: 'Platform Settings', to: '/admin/settings', icon: '⚙️' },
    ],
  },
];

export const NAV_BY_ROLE = {
  farmer: [
    { label: 'Dashboard', to: '/farmer', icon: '📊' },
    { label: 'My Produce', to: '/farmer/produce', icon: '🌾' },
    { label: 'Bids', to: '/farmer/bids', icon: '🤝' },
    { label: 'Orders', to: '/farmer/orders', icon: '📦' },
    { label: 'Payouts', to: '/farmer/payouts', icon: '💰' },
    { label: 'Profile', to: '/farmer/profile', icon: '👤' },
  ],
  retailer: [
    { label: 'Marketplace', to: '/retailer', icon: '🛒' },
    { label: 'Cart', to: '/retailer/cart', icon: '🧺' },
    { label: 'My Bids', to: '/retailer/bids', icon: '🤝' },
    { label: 'Orders', to: '/retailer/orders', icon: '📦' },
    { label: 'Wishlist', to: '/retailer/wishlist', icon: '❤️' },
    { label: 'Disputes', to: '/retailer/disputes', icon: '⚖️' },
    { label: 'Profile', to: '/retailer/profile', icon: '👤' },
  ],
  logistics: [
    { label: 'Available', to: '/logistics', icon: '📍' },
    { label: 'Assigned', to: '/logistics/assigned', icon: '🚚' },
    { label: 'History', to: '/logistics/history', icon: '🗂️' },
    { label: 'Profile', to: '/logistics/profile', icon: '👤' },
  ],
};
