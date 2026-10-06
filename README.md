# PHONE KH

PHONE KH is a Khmer-language phone and accessories storefront backed by the existing Express and MongoDB service.

## Configure MongoDB and the first administrator

The API reads `backend/.env`. If that file already contains your database connection, keep it and add the administrator settings below. Otherwise, start from [`backend/.env.example`](./backend/.env.example), copy it to `backend/.env`, and set:

- `MONGO_URI` to the connection string for your existing MongoDB database.
- `ADMIN_EMAIL` and a unique `ADMIN_PASSWORD` of at least 12 characters. The API creates this administrator on startup if the email is unused. If the email already belongs to a customer, the API refuses to promote it automatically; assign the role directly in MongoDB or use another unused admin email.
- `CLIENT_ORIGIN` to the frontend origin(s) allowed to call the API.

Never commit `backend/.env` or share its database credentials.

## Run the app

In one terminal:

```sh
cd backend
npm install
npm run dev
```

In another terminal:

```sh
npm install
npm run dev
```

The frontend calls `http://localhost:5000/api` by default. Set `VITE_API_URL` if the API is hosted elsewhere.

## Add the 50-phone starter catalog

After configuring MongoDB, run the following from the `backend/` directory:

```sh
npm run seed:phones
```

This inserts 50 smartphone listings with unique SKUs and a different Unsplash phone photograph for every listing. Names describe only visible photo details; exact brands/models and storage/RAM are not verified. The photos are representative and are not guaranteed to be official manufacturer images. It is safe to rerun: existing records are matched by their SKU or previous model name, renamed, and cleared of unverified brand/model/storage/RAM claims. Existing prices and stock are preserved; confirm the actual device details and current supplier pricing before selling.

## MongoDB data

Products, registered users, password hashes, sessions, guest/account carts, coupons, and orders are stored in MongoDB. Each signed-in account has its own persistent cart; registering a new account starts with an empty cart, and signing out does not delete the account's cart. Guest carts remain separate and expire after 30 days. Orders are linked to the signed-in user when available and remain in that user's order history after checkout.

The administrator dashboard refreshes orders every 15 seconds while open and shows notices for new orders and newly recorded payments. KHQR/COD are currently recorded as payment methods only; payment is not verified automatically. An administrator must verify payment outside the app and mark it as paid in the order dashboard. Revenue totals include only orders marked paid.

The browser stores only opaque authentication and cart-session tokens; it no longer treats browser storage as the source of product, cart, profile, or order data. Data previously created only in browser storage by the demo version is not automatically imported into MongoDB. Passwords are hashed with Node's `scrypt`. Only authenticated administrators can create, edit, and delete products, update order status, view users, and change user roles.

The KHQR/COD choices are recorded with the order; actual payment processing is not connected yet.

## Checks

```sh
npm run build
npm run lint
```

For backend syntax checks:

```sh
node --check backend/server.js
```
