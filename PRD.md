# Product Requirements Document (PRD)

## Santafe Restaurant Platform

| Field | Value |
|-------|-------|
| **Product** | Santafe (سانتافى) — Multi-branch restaurant ordering platform |
| **Version** | 0.2.0 |
| **Last updated** | June 19, 2026 |
| **Status** | Live / active development |

---

## 1. Executive Summary

Santafe is a web-based restaurant platform for a fried chicken and burger chain operating across three branches in Egypt: **Mansoura**, **Mit Ghamr**, and **Zagazig**. The product serves three audiences:

1. **Customers** — browse menus, place delivery orders, track order status in real-time (animated timeline), and participate in promotions (spin wheel, coupons, offers).
2. **Branch admins** — manage day-to-day operations for a single branch (menu, orders, coupons, delivery zones, modifiers, offers, spin settings).
3. **Owner** — monitor performance across all branches, set staff targets, review weekly reports.

The platform is a single-page React application backed by Firebase (Auth, Firestore, Cloud Functions) and deployed via Firebase Hosting. Fully bilingual (Arabic/English) with RTL support.

---

## 2. Problem Statement

A multi-location restaurant needs:

- A branded online ordering experience per branch, without mixing inventory or delivery zones.
- Real-time order management for kitchen and delivery staff.
- Centralized visibility for the business owner across branches.
- Promotional tools (coupons, offers, spin wheel) to drive repeat orders.

Existing generic food-delivery aggregators do not provide branch-level control, custom branding, or integrated loyalty mechanics. Santafe addresses this with a purpose-built, Firebase-backed solution.

---

## 3. Goals & Success Metrics

### Business goals

| Goal | Description |
|------|-------------|
| Increase online orders | Fast, mobile-friendly ordering flow with branch-specific menus |
| Reduce order errors | Structured cart, modifiers, size selection, and delivery zone fees |
| Improve retention | Coupons, spin wheel, email subscribers, upsell recommendations |
| Operational efficiency | Real-time admin dashboards with sound notifications for new orders |
| Customer transparency | Live order-status timeline visible to customers in My Orders page |

### Success metrics (KPIs)

| Metric | Target / measurement |
|--------|---------------------|
| Order completion rate | % of checkouts that result in a placed order |
| Average order value (AOV) | Revenue / delivered orders per branch |
| Repeat customer rate | % of orders from returning authenticated clients |
| Order fulfillment time | Time from pending to delivered |
| Coupon redemption rate | Used coupons / issued coupons |
| Spin wheel engagement | Daily unique spins / logged-in users |

---

## 4. User Personas

### 4.1 Customer (عميل)

- Lives in Mansoura, Mit Ghamr, or Zagazig.
- Orders fried chicken, burgers, and sides for delivery.
- Prefers Arabic UI; can toggle to English.
- Uses mobile browser; may pay via cash, Vodafone Cash, or InstaPay.
- Can track their order live through a step-by-step status timeline.

### 4.2 Branch Admin (مدير فرع)

- Manages one assigned branch (mansoura, mit_ghamr, or zagazig).
- Updates menu items with Cloudinary image upload and cropping.
- Handles incoming orders with real-time notifications and audio alerts.
- Configures branch-specific coupons, delivery zones, recommendations, offers, modifiers, and spin wheel prizes.

### 4.3 Owner (مالك)

- Oversees all three branches from a single dashboard.
- Reviews revenue, order counts by status, top/slow-moving products, and payment method breakdowns.
- Sets performance targets for staff and saves/reviews weekly reports.

---

## 5. Product Scope

### 5.1 In scope (current — v0.2.0)

- Multi-branch client experience with branch persistence via localStorage.
- Full menu browsing with categories, product details, sizes (single/double/triple), and modifier groups.
- Shopping cart sidebar with quantity controls.
- Multi-step checkout: delivery info, payment method, confirm.
- Delivery zone selection with per-zone fees and configurable free-delivery threshold.
- Client authentication: email/password and Google Sign-In.
- Coupon system: validation (min order, expiry, usage limit), atomic usageCount increment, auto-apply for spin wheel coupons.
- Extended order status lifecycle with real-time customer-side tracking timeline.
- pending_payment status placeholder for future payment gateway integration.
- Admin dashboard per branch with 11 functional tabs.
- Owner dashboard: cross-branch stats, top/slow products, payment breakdown, staff targets, weekly reports.
- Dedicated My Orders page with animated step-by-step status timeline.
- Profile page with tabs: profile info editing and order history with live updates.
- Spin wheel promotion (ClientSpinWheel) — server-enforced one-spin-per-day; winning creates SPIN-XXXXXX coupon.
- Bilingual UI (Arabic default / English toggle) with RTL support.
- Email newsletter signup on homepage into subscribers collection.
- Cookie consent banner and Privacy Policy page.
- SEO: react-helmet-async, sitemap, robots.txt, prerender plugin.
- Firestore security rules with role-based access control.
- CI/CD via GitHub Actions.

### 5.2 Out of scope (current release)

- Native mobile apps (iOS / Android).
- In-app card/wallet payments via Paymob (env vars exist; client integration not implemented).
- Automated SMS / push notifications.
- Driver tracking / live GPS.
- Inventory stock management.
- POS integration.
- Full English translations beyond navigation, hero, and key UI strings.

### 5.3 Planned / future

- Paymob payment gateway (card + wallet) — configuration placeholders in .env.example; pending_payment order status already in place.
- Automated weekly report generation (currently manual entry on owner dashboard).
- Expanded English translations across all pages.
- Push/SMS notifications to customers on status change.

---

## 6. User Journeys

### 6.1 Customer order flow

`
Branch Selector -> Home / Menu -> Product Details -> Add to Cart
    -> Checkout (delivery info -> payment method -> confirm)
    -> Order created in {branchId}/orders/data + all_orders
    -> My Orders (live status timeline) / Profile (order history tab)
`

Preconditions: User must select a branch before accessing client routes. Authenticated users get profile pre-fill and order history.

### 6.2 Customer order tracking (new in v0.2.0)

`
My Orders -> Select order -> Live timeline
    pending -> confirmed -> preparing -> out_for_delivery -> delivered
`

Real-time Firestore onSnapshot listener shows animated timeline steps. Terminal states (rejected, cancelled) shown with distinct red styling.

### 6.3 Admin order handling

`
Admin Login -> Branch Dashboard -> Orders tab (real-time + sound alert)
    -> Update status (pending -> preparing -> out_for_delivery -> delivered / rejected)
    -> Optional: print order -> Archive when complete
`

Preconditions: Firebase Auth user with admins/{uid} document where role = admin and branchId matches route.

### 6.4 Owner oversight

`
Admin Login (owner role) -> Owner Dashboard
    -> View branch stats, top/slow products, payment breakdown
    -> Set staff targets -> Generate / save weekly reports
    -> /owner/reports -> Review historical weekly reports
`

---

## 7. Functional Requirements

### 7.1 Client — Branch selection

| ID | Requirement | Priority |
|----|-------------|----------|
| C-01 | User selects one of three branches before browsing | P0 |
| C-02 | Selected branch persists across sessions (localStorage) | P0 |
| C-03 | User can change branch from navigation | P1 |
| C-04 | Branch info shown: name, area, phone, hours | P2 |

Branches: mansoura, mit_ghamr, zagazig

---

### 7.2 Client — Menu & products

| ID | Requirement | Priority |
|----|-------------|----------|
| C-10 | Display products grouped by category | P0 |
| C-11 | Product detail page with images, description, sizes (single/double/triple) | P0 |
| C-12 | Support product-level discounts (percent / fixed) via discountActive, discountType, discountValue | P1 |
| C-13 | Modifier groups (global modifierGroups collection) selectable on products | P1 |
| C-14 | Highlight new products on homepage (isNew flag) | P2 |
| C-15 | Product recommendations popup at checkout | P1 |
| C-16 | Latest products section on homepage (last 4 added, reversed) | P2 |

Data source: {branchId}/products/data/*, {branchId}/categories/data/*, modifierGroups/*

---

### 7.3 Client — Cart & checkout

| ID | Requirement | Priority |
|----|-------------|----------|
| C-20 | Persistent cart sidebar with quantity controls | P0 |
| C-21 | Multi-step checkout: delivery info -> payment -> confirm | P0 |
| C-22 | Delivery zone selection with per-zone fees | P0 |
| C-23 | Free delivery when cart subtotal >= VITE_FREE_DELIVERY_THRESHOLD | P1 |
| C-24 | Coupon code entry with validation (min order, expiry, usage limit) | P0 |
| C-25 | Auto-apply spin wheel coupon from localStorage (pendingWheelCoupon) | P1 |
| C-26 | Payment methods: cash on delivery, Vodafone Cash, InstaPay (manual transfer) | P0 |
| C-27 | Order written to {branchId}/orders/data/{orderId} and all_orders/{orderId} via Firestore transaction | P0 |
| C-28 | Coupon usageCount incremented atomically on order placement | P1 |
| C-29 | Form pre-fill from authenticated client profile (name, phone, address) | P1 |

---

### 7.4 Client — Authentication & profile

| ID | Requirement | Priority |
|----|-------------|----------|
| C-30 | Register and login with email/password | P0 |
| C-31 | Login with Google | P1 |
| C-32 | Client profile stored in clients/{uid} | P0 |
| C-33 | My Orders page — dedicated route /my-orders with live order tracking timeline | P0 |
| C-34 | Profile page — tabbed: profile info editing + order history with live updates | P1 |
| C-35 | Profile fields: name, phone, address | P1 |

---

### 7.5 Client — Order status & tracking

| ID | Requirement | Priority |
|----|-------------|----------|
| C-36 | My Orders page shows all customer orders from all_orders filtered by clientUid | P0 |
| C-37 | Each order shows animated step-by-step timeline with 5 steps | P0 |
| C-38 | Terminal states (rejected, cancelled) shown with distinct red styling | P0 |
| C-39 | pending_payment status displayed with payment-lock icon | P1 |
| C-40 | Orders list updates in real-time via onSnapshot | P0 |

Status lifecycle (full set):

| Status | Step | Label (AR) |
|--------|------|-----------|
| pending | 0 | استلمنا طلبك |
| confirmed | 1 | تم التأكيد |
| preparing | 2 | بيتجهز |
| out_for_delivery | 3 | في الطريق |
| delivered / done | 4 | وصلك! |
| rejected / cancelled | -1 | مرفوض/ملغي |
| pending_payment | 0 | في انتظار الدفع |

---

### 7.6 Client — Promotions

| ID | Requirement | Priority |
|----|-------------|----------|
| P-01 | Dedicated Offers page per branch | P1 |
| P-02 | Spin wheel (ClientSpinWheel) with weighted prizes | P1 |
| P-03 | One spin per user per day (enforced client + server via Cloud Function) | P1 |
| P-04 | Winning spin creates coupon code (e.g. SPIN-XXXXXX) for checkout | P1 |
| P-05 | Spin config managed in spinConfig; logs in spinLogs, spinUsers | P2 |

Cloud Function: spinWheel (europe-west1) — server-side prize selection and coupon creation.

---

### 7.7 Client — Marketing & compliance

| ID | Requirement | Priority |
|----|-------------|----------|
| M-01 | Homepage hero, featured/new products, latest products, newsletter signup | P1 |
| M-02 | Email captured to subscribers collection (with source and createdAt) | P2 |
| M-03 | About and Contact pages | P2 |
| M-04 | Privacy Policy page at /privacy-policy | P1 |
| M-05 | Cookie consent banner | P1 |
| M-06 | Arabic (default) and English language toggle | P1 |

---

### 7.8 Admin — Dashboard (per branch)

| ID | Requirement | Priority |
|----|-------------|----------|
| A-01 | Access via /admin/dashboard/{branchId} with role + branch guard | P0 |
| A-02 | Products tab: CRUD products, Cloudinary image upload + crop, sizes, discounts, emoji picker | P0 |
| A-03 | Categories tab: CRUD categories | P0 |
| A-04 | Orders tab: Real-time order list, status updates, audio notification on new orders | P0 |
| A-05 | Archive tab: View/manage archived orders | P1 |
| A-06 | Coupons tab: Create/edit discount coupons per branch | P1 |
| A-07 | Delivery zones tab: Configure zones and fees | P0 |
| A-08 | Recommendations tab: Configure upsell items shown at checkout popup | P1 |
| A-09 | Modifiers tab: Manage global modifier groups and options | P1 |
| A-10 | Offers tab: Branch offers, offer items, and offers page config | P1 |
| A-11 | Spin settings tab: Configure wheel prizes and weights | P2 |
| A-12 | Order print view for kitchen/receipt | P1 |
| A-13 | Image cropper modal for product photo uploads (Cloudinary) | P2 |
| A-14 | Audio alert (Web Audio API oscillator) plays on new pending order | P0 |

Cloudinary config: Cloud name dkgiwnpfi, preset santafi_products.
Order statuses admin can set: pending, confirmed, preparing, out_for_delivery, delivered/done, rejected.

---

### 7.9 Owner — Dashboard

| ID | Requirement | Priority |
|----|-------------|----------|
| O-01 | Access via /owner with role = owner guard | P0 |
| O-02 | Real-time stats per branch: revenue, order counts by status | P0 |
| O-03 | Top and slow-moving products across branches | P1 |
| O-04 | Payment method breakdown (cash, Vodafone Cash, InstaPay) | P1 |
| O-05 | Staff targets CRUD (ownerTargets/main/data) — assignee, branch, type, target value, reward | P2 |
| O-06 | Manual weekly report entry and save | P2 |
| O-07 | Weekly reports history at /owner/reports | P2 |
| O-08 | Revenue counts only delivered/done orders; filters out archived: true | P0 |

---

## 8. Data Model

### 8.1 Global collections

| Collection | Purpose | Access |
|------------|---------|--------|
| admins/{uid} | { role, branchId } — admin or owner | Read own doc only |
| clients/{uid} | Customer profile fields | Read/write own doc |
| all_orders/{orderId} | Cross-branch order index for client history and owner | Create (client), read (owner or order client), update (admin/owner) |
| subscribers/{id} | Newsletter emails with source and createdAt | Public create; admin/owner read/update/delete |
| modifierGroups/{id}/options/{id} | Shared product modifiers | Public read; admin/owner write |
| offers/{id}, offerItems/{id} | Global offer definitions | Public read; admin/owner write |
| configs/{id} | App-wide config | Public read; admin/owner write |
| spinConfig/{id} | Spin wheel configuration | Public read; admin/owner write |
| wheelSettings/{id} | Wheel visual/behaviour settings | Public read; admin/owner write |
| spinLogs/{dateId} | Daily spin analytics | Signed-in users read/write; admin/owner delete |
| spinUsers/{userId} | User spin history — create-once, no updates | Own user or admin/owner |
| weeklyReports/data/reports/{id} | Saved weekly reports | Owner only |
| ownerTargets/main/data/{id} | Staff performance targets | Owner only |

### 8.2 Branch-scoped data

Pattern: {branchId}/{section}/data/{docId} or {branchId}/{section}

| Section | Purpose |
|---------|---------|
| products | Menu items (public read; admin/owner write) |
| categories | Menu categories (public read; admin/owner write) |
| orders | Active orders (client create; admin/owner read/update/delete) |
| archived_orders | Completed/archived orders (admin/owner only) |
| discountCoupons | Branch coupons (public read; client can only increment usageCount; admin/owner full write) |
| deliveryZones | Delivery areas and fees (public read; admin/owner write) |
| deliveryConfig | Branch delivery settings (public read; admin/owner write) |
| recommendations | Checkout upsell config (public read; admin/owner write) |
| offers, offerItems, offersPageConfig | Branch-specific offers (public read; admin/owner write) |

Branch IDs: mansoura, mit_ghamr, zagazig

### 8.3 Order document (key fields)

`	ext
{
  clientUid, branchId, status, items[],
  total / totalPrice,
  paymentMethod,
  deliveryZone, deliveryFee,
  couponCode,
  customer: { name, phone, address, notes },
  createdAt,
  archived?
}
`

Status values (full set): pending, confirmed, preparing, out_for_delivery, delivered, done, rejected, cancelled, pending_payment

### 8.4 Pricing model

Implemented in src/utils/pricing.js:

| Function | Description |
|----------|-------------|
| getProductBasePrice(product, sizeKey) | Returns price by size: price_single, price_double, price_triple |
| applyProductDiscount(basePrice, product) | Applies discountActive -> discountType (percent/fixed) -> discountValue |
| applyCouponDiscount(subtotal, coupon) | Validates expiry, minOrder; applies percent or fixed amount; supports free_delivery type |
| calculateCartSubtotal(cart) | Sums price_single x qty for all cart items |
| calculateFinalTotals({cart, coupon, deliveryFee}) | Returns subtotal, couponDiscount, deliveryFee, deliveryDiscount, total |

---

## 9. Technical Architecture

### 9.1 Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React | ^19.2.4 |
| Build tool | Vite | ^7.2.1 |
| Routing | React Router DOM | ^7.13.1 |
| Styling | Tailwind CSS | ^3.4.17 |
| Animations | Framer Motion | ^12.38.0 |
| SEO | react-helmet-async | ^3.0.0 |
| Backend | Firebase (Auth, Firestore, Cloud Functions) | ^12.15.0 |
| Media | Cloudinary | cloud: dkgiwnpfi, preset: santafi_products |
| Hosting | Firebase Hosting (dist/) | — |
| CI | GitHub Actions (.github/workflows/) | — |
| Node | >= 20.19.0 | — |

### 9.2 Application structure

`	ext
src/
  pages/
    Home.jsx, Menu.jsx, ProductDetails.jsx
    Checkout.jsx
    MyOrders.jsx           <- dedicated order tracking with live timeline
    Profile.jsx            <- tabbed: profile info + order history
    Offers.jsx, BranchSelector.jsx
    Login.jsx, AdminLogin.jsx
    AdminDashboard.jsx, OwnerDashboard.jsx, WeeklyReports.jsx
    About.jsx, Contact.jsx, PrivacyPolicy.jsx, NotFound.jsx
  components/
    Navbar.jsx, CartSidebar.jsx, CategorySection.jsx
    ClientSpinWheel.jsx, RecommendationsPopup.jsx
    OrderPrintView.jsx, CookieConsent.jsx, ProtectedRoute.jsx
    admin/
      ProductsTab, CategoriesTab, OrdersTab, ArchiveTab
      CouponsTab, DeliveryZonesTab, RecommendationsTab
      ModifiersTab, OffersTab, SpinSettingsTab
      ImageCropperModal, OrderCard
  context/
    ClientBranchContext.jsx   # selected branch (localStorage)
    CartContext.jsx            # in-memory cart
    ClientAuthContext.jsx      # Firebase Auth for customers
    authContext.js             # re-export alias
    BranchContext.jsx          # admin branch from URL + auth
    LanguageContext.jsx        # ar/en with localStorage
  hooks/
    useBranchProducts.jsx     # fetches branch products with optional fallback
  utils/
    pricing.js                # full pricing engine
    spin.js                   # spin wheel utilities
  animations/
    motionVariants.js
  layouts/
    ClientLayout.jsx
functions/
  src/wheelSpin.ts            # Callable Cloud Function (europe-west1)
`

### 9.3 Routing

| Route | Access |
|-------|--------|
| /branches | Public |
| /login | Public |
| /admin | Public (admin login page) |
| /, /home, /menu, /offers | Requires selected branch |
| /about, /contact, /privacy-policy | Requires selected branch |
| /product/:id | Requires selected branch |
| /profile | Requires selected branch |
| /my-orders | Requires selected branch |
| /checkout, /cart (redirects to /checkout) | Requires selected branch |
| /admin/dashboard/mansoura | Admin for mansoura branch |
| /admin/dashboard/mit_ghamr | Admin for mit_ghamr branch |
| /admin/dashboard/zagazig | Admin for zagazig branch |
| /owner | Owner only |
| /owner/reports | Owner only |
| /404, * | Public (NotFound page) |

### 9.4 State management

- **ClientBranchContext** — selected branch (localStorage persistence).
- **CartContext** — in-memory cart with addToCart / clearCart.
- **ClientAuthContext** — Firebase Auth for customers (email/password + Google).
- **BranchContext** — admin branch ID resolved from URL + auth.
- **LanguageContext** — ar (default) / en with localStorage.

### 9.5 Lazy loading

Admin and owner routes are code-split via React.lazy:
- AdminDashboard — loaded on /admin/dashboard/*
- OwnerDashboard — loaded on /owner
- WeeklyReports — loaded on /owner/reports

### 9.6 Audio notifications (admin)

New pending orders trigger a Web Audio API oscillator sequence (3 x 880 Hz pulses at 0ms, 150ms, 300ms) via playNotificationSound() in AdminDashboard — no audio file assets required.

---

## 10. Security & Access Control

### 10.1 Roles

| Role | Capabilities |
|------|--------------|
| Unauthenticated | Public read of menus, categories, coupons, offers, spin config |
| Client | Own profile CRUD, place orders, spin wheel, read own order history |
| Admin | Full branch management for assigned branchId |
| Owner | All branches read/write + admin capabilities + targets + weekly reports |

### 10.2 Firestore rules (summary)

| Rule | Detail |
|------|--------|
| admins/{uid} | Read own doc only; no client writes (admin docs provisioned server-side) |
| clients/{uid} | Read/write own doc only |
| all_orders | Client create (must match clientUid + branchId); client read own orders; admin/owner read/update all |
| Coupons | Public read; client may only increment usageCount + updatedAt (validated diff); admin/owner full CRUD |
| spinUsers/{userId} | Create once per user (userId must match); no updates from client; admin/owner can delete |
| spinLogs | Signed-in users read/create/update; admin/owner delete |
| Branch products/categories | Public read; admin/owner write |
| Branch orders | Client create; admin/owner read/update/delete |
| weeklyReports, ownerTargets | Owner only |
| Subscriber creation | Validated: email format, source == homepage, createdAt timestamp |

Rules file: firestore.rules

### 10.3 Environment variables

See .env.example for: Firebase config, Paymob integration IDs, manual payment phone, free delivery threshold, and dev admin fallbacks.

---

## 11. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| Performance | Lazy-load admin/owner dashboards; real-time Firestore listeners for orders; Cloudinary CDN for images |
| Mobile | Responsive Tailwind layouts; touch-friendly cart sidebar and checkout |
| Accessibility | Semantic sections, aria-label on key homepage regions (hero) |
| i18n | Arabic default (RTL); English for nav/hero/key UI; expand over time |
| SEO | react-helmet-async, sitemap, robots.txt, vite-plugin-prerender in build |
| Availability | Firebase SLA; SPA rewrites in firebase.json |
| Browser support | Modern evergreen browsers per browserslist (>0.2%, not dead) |
| Animation | Framer Motion for page transitions, order timeline, cart, modals |

---

## 12. Integrations

| Integration | Status | Notes |
|-------------|--------|-------|
| Firebase Auth | Active | Email/password + Google Sign-In |
| Firestore | Active | Primary database; real-time listeners |
| Cloudinary | Active | Product image uploads + CDN; cloud dkgiwnpfi, preset santafi_products |
| Cloud Functions | Active | spinWheel callable (europe-west1) |
| Paymob | Planned | Env vars in .env.example; pending_payment status ready; no client UI yet |
| Vodafone Cash / InstaPay | Manual | Display phone number; customer transfers offline |
| Google Sign-In | Active | Client login via Firebase Auth |
| vite-plugin-prerender | Active | SEO prerendering for select routes |

---

## 13. Deployment & Operations

`ash
npm install
cp .env.example .env      # fill Firebase, payment values
npm run dev               # local development (Vite dev server)
npm run build             # production bundle to dist/
npm run deploy            # build + firebase deploy --only hosting,firestore
`

- **Firestore rules** deployed with: firebase deploy --only firestore
- **Cloud Functions** in functions/ (Node >=20): firebase deploy --only functions
- **CI** runs on GitHub push/PR via .github/workflows/
- **Netlify** config (netlify.toml) present as an alternative hosting option

---

## 14. Open Questions & Risks

| Item | Notes |
|------|-------|
| Paymob integration | Env prepared and pending_payment status added; no client UI — cash/manual only today |
| Payment verification | Manual transfer methods rely on customer honesty; no auto-confirmation |
| Branch product parity | Each branch maintains its own product catalog — no cross-branch sync |
| Spin wheel abuse | Mitigated by daily limit + server-side Cloud Function; monitor spinLogs |
| Admin doc provisioning | admins/{uid} must be created server-side; email fallbacks in env for dev only |
| out_for_delivery status | Defined in client-side status config but not exposed as an admin action yet — needs alignment |
| confirmed status | Defined client-side; admin dashboard transitions should be reviewed for consistency |
| cancelled status | Defined client-side; no admin action path defined yet |

---

## 15. Appendix

### A. Order status lifecycle (full)

`mermaid
stateDiagram-v2
    [*] --> pending: Customer places order
    pending --> confirmed: Admin confirms
    pending --> rejected: Admin rejects
    confirmed --> preparing: Admin starts prep
    preparing --> out_for_delivery: Admin dispatches
    out_for_delivery --> delivered: Order completed
    preparing --> done: Order completed (alias)
    delivered --> archived: Admin archives
    done --> archived: Admin archives
    rejected --> archived: Admin archives
    cancelled --> archived: Admin archives
    [*] --> pending_payment: Future: awaiting payment gateway
    pending_payment --> pending: Payment confirmed
    pending_payment --> cancelled: Payment failed
`

### B. Key files reference

| Area | Path |
|------|------|
| Routes | src/App.jsx |
| Firestore rules | firestore.rules |
| Pricing engine | src/utils/pricing.js |
| Checkout | src/pages/Checkout.jsx |
| My Orders (tracking) | src/pages/MyOrders.jsx |
| Profile | src/pages/Profile.jsx |
| Admin dashboard | src/pages/AdminDashboard.jsx |
| Owner dashboard | src/pages/OwnerDashboard.jsx |
| Spin wheel (client) | src/components/ClientSpinWheel.jsx |
| Spin function | functions/src/wheelSpin.ts |
| Translations | src/context/LanguageContext.jsx |

### C. Revision history

| Date | Version | Changes |
|------|---------|---------|
| 2026-06-18 | 1.0 | Initial PRD created from codebase analysis |
| 2026-06-19 | 0.2.0 | Full update: expanded order status lifecycle (confirmed, out_for_delivery, cancelled, pending_payment), dedicated My Orders page with live animated timeline, Profile tabbed view, admin audio notifications (Web Audio API), full route table, complete security rules summary, pricing engine documentation, updated stack versions (React 19.2.4 / Vite 7.2.1 / Firebase 12.15.0), Cloudinary config details, useBranchProducts hook, open questions updated |
