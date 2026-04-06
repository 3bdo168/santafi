# santafe

Restaurant web app (client + admin/owner dashboards) built with **React (CRA)** + **Firebase (Auth + Firestore)** + **Framer Motion**.

## ✅ What’s included

- **Client**: branch selection, menu, product details, cart, checkout, profile (order history from `all_orders`)
- **Admin** (per-branch): products, categories, orders, archive, coupons, delivery zones, recommendations
- **Owner**: cross-branch overview + weekly reports + targets

## 🧱 Tech stack

- React + react-scripts (CRA)
- React Router
- Firebase (Auth, Firestore)
- Framer Motion

## 🚀 Run locally

1. Install deps:

```bash
npm install
```

2. Create `.env` from `.env.example` and fill values.

3. Start dev server:

```bash
npm start
```

## 🔐 Firebase / Firestore

- Firestore security rules live in `firestore.rules`.
- Data model (high level):
  - `admins/{uid}` holds `{ role, branchId }`
  - `clients/{uid}` holds profile fields
  - `{branchId}/products/data/*`, `{branchId}/orders/data/*`, etc.
  - `all_orders/{orderId}` for client order history across branches
