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

Products, registered users, password hashes, sessions, guest/user carts, coupons, and orders are stored in MongoDB. Sample products are inserted only when the product collection is empty; the `PHONE10` coupon is created if it does not already exist. Orders validate stock and prices on the backend and update stock when submitted.

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
