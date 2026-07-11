# Farm Flow — Frontend

React + Vite + Redux Toolkit + Tailwind CSS. Connects to the Farm Flow backend API.

## Run it

```bash
cd frontend
npm install
cp .env.example .env   # point VITE_API_URL / VITE_SOCKET_URL at your running backend
npm run dev             # http://localhost:5173
```

Production build: `npm run build` (outputs to `dist/`) — **verified working**, builds cleanly with zero errors, other than a standard "chunk size" advisory (the app ships as a single bundle right now; code-splitting by route is a natural follow-up optimization).

## What's built

- **Full routing** for all 4 roles (farmer, retailer, logistics, admin) with `ProtectedRoute` role-gating
- **Auth**: register (role picker), login, forgot/reset password, email verification landing page, auto session restore, silent access-token refresh on 401 via Axios interceptors
- **Farmer**: dashboard, produce CRUD with multi-image upload, bid inbox (accept/reject/counter), order list, payout summary + history, profile with farm details
- **Retailer**: marketplace with search/filter/sort/pagination, produce detail + bidding, wishlist, cart → address → payment (Stripe/Razorpay selector) checkout flow, order list + detail with shipment timeline, dispute filing
- **Logistics**: available-deliveries feed with the accept-race flow (shows a friendly "someone else got it" toast on HTTP 409 from the backend's atomic assignment), assigned deliveries with status progression (including the On The Way location/ETA form), delivery history
- **Admin**: analytics dashboard (Recharts bar + pie charts, live stat cards), user management (verify/activate/deactivate/remove) for each role, produce moderation, payments table + CSV export, dispute resolution (refund/partial refund/replacement/reject)
- **Real-time**: Socket.IO hook joins the user's room and pushes live notifications into Redux + toast; notification bell with unread badge, mark-read/mark-all-read
- **Design system**: custom Tailwind palette (furrow greens / wheat gold / overcast blue / clay), Fraunces + Inter type pairing — not default Tailwind styling

## What's simplified (noted honestly)

- Stripe/Razorpay checkout calls the real backend endpoints and gets back a real client secret / order id, but the client-side widget (Stripe Elements / Razorpay Checkout popup) isn't wired up — that's a few dozen lines with your actual publishable keys, documented inline in `Cart.jsx`.
- Cart is in-memory (Redux), not persisted across a hard refresh — trivial to add with `redux-persist` if wanted.
- No code-splitting yet (single JS bundle, ~245kb gzipped) — fine for a working demo, worth lazy-loading routes for production.
