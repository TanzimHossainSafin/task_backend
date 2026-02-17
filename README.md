# Mini E-Commerce API

A REST API for a mini e-commerce platform built with **Node.js**, **Express**, **PostgreSQL**, and **Prisma ORM**. Supports user authentication, role-based access control, product management, shopping cart, and transactional order processing.

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express 5
- **Database**: PostgreSQL
- **ORM**: Prisma 6
- **Auth**: JWT (jsonwebtoken) + bcryptjs
- **Validation**: express-validator

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- [PostgreSQL](https://www.postgresql.org/) running locally or remotely

### 1. Install dependencies

```bash
cd mini-ecommerce-api
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and set the following:

| Variable       | Description                          | Example                                                              |
|----------------|--------------------------------------|----------------------------------------------------------------------|
| `DATABASE_URL` | PostgreSQL connection string         | `postgresql://user:password@localhost:5432/mini_ecommerce?schema=public` |
| `JWT_SECRET`   | Secret key for signing JWTs          | `my-super-secret-key`                                                |
| `PORT`         | Port the server listens on           | `3000`                                                               |

### 3. Set up the database

```bash
npx prisma migrate dev --name init
```

This creates all tables and generates the Prisma client.

### 4. Start the server

```bash
npm start          # production
npm run dev        # development (auto-restart on file changes)
```

The API will be available at `http://localhost:3000`.

### 5. Verify

```bash
curl http://localhost:3000/api/health
# => { "status": "ok" }
```

---

## Project Structure

```
mini-ecommerce-api/
├── prisma/
│   └── schema.prisma              # Database models & enums
├── src/
│   ├── server.js                  # Express app entry point
│   ├── config/
│   │   └── db.js                  # Prisma client singleton
│   ├── middleware/
│   │   ├── auth.js                # JWT verification
│   │   └── role.js                # Role-based access guard
│   ├── routes/
│   │   ├── auth.routes.js         # /api/auth
│   │   ├── product.routes.js      # /api/products
│   │   ├── cart.routes.js         # /api/cart
│   │   └── order.routes.js        # /api/orders
│   ├── controllers/
│   │   ├── auth.controller.js     # Register & login logic
│   │   ├── product.controller.js  # Product CRUD
│   │   ├── cart.controller.js     # Cart operations
│   │   └── order.controller.js    # Order & checkout logic
│   └── utils/
│       └── validators.js          # express-validator rules
├── .env.example
├── .gitignore
└── package.json
```

---

## Database Schema

```
User ──< Order ──< OrderItem >── Product
  │                                  │
  └── Cart (1:1) ──< CartItem >─────┘
```

| Model       | Key Fields                                                         |
|-------------|--------------------------------------------------------------------|
| **User**      | id, name, email (unique), password (hashed), role, cancellationCount |
| **Product**   | id, name, description, price, stock, timestamps                    |
| **Cart**      | id, userId (unique 1:1 with User), timestamps                     |
| **CartItem**  | id, cartId, productId, quantity — unique on (cartId, productId)    |
| **Order**     | id, userId, totalAmount, status, createdAt                         |
| **OrderItem** | id, orderId, productId, quantity, priceAtPurchase                  |

**Enums**:
- `Role`: `ADMIN`, `CUSTOMER`
- `OrderStatus`: `PENDING`, `SHIPPED`, `DELIVERED`, `CANCELLED`

---

## API Reference

All endpoints are prefixed with `/api`. Protected routes require a `Bearer` token in the `Authorization` header.

### Authentication

| Method | Endpoint             | Body                                      | Auth | Description              |
|--------|----------------------|-------------------------------------------|------|--------------------------|
| POST   | `/api/auth/register` | `{ name, email, password, role? }`        | No   | Register a new user      |
| POST   | `/api/auth/login`    | `{ email, password }`                     | No   | Login and receive a JWT  |

**Register** defaults to `CUSTOMER` role. Pass `"role": "ADMIN"` to create an admin account.

**Login** returns:
```json
{
  "message": "Login successful.",
  "token": "eyJhbGciOi...",
  "user": { "id": 1, "name": "John", "email": "john@example.com", "role": "CUSTOMER" }
}
```

### Products

| Method | Endpoint            | Body                                    | Auth       | Description        |
|--------|---------------------|-----------------------------------------|------------|--------------------|
| GET    | `/api/products`     | —                                       | No         | List all products  |
| GET    | `/api/products/:id` | —                                       | No         | Get single product |
| POST   | `/api/products`     | `{ name, price, stock, description? }`  | Admin only | Create product     |
| PUT    | `/api/products/:id` | `{ name?, price?, stock?, description?}`| Admin only | Update product     |
| DELETE | `/api/products/:id` | —                                       | Admin only | Delete product     |

### Cart

All cart routes require authentication as a `CUSTOMER`.

| Method | Endpoint                   | Body                      | Description              |
|--------|----------------------------|---------------------------|--------------------------|
| GET    | `/api/cart`                | —                         | Get current user's cart  |
| POST   | `/api/cart/items`          | `{ productId, quantity }` | Add item to cart         |
| PUT    | `/api/cart/items/:itemId`  | `{ quantity }`            | Update item quantity     |
| DELETE | `/api/cart/items/:itemId`  | —                         | Remove item from cart    |

- Adding an item that already exists in the cart increments its quantity.
- Stock is validated when adding/updating items.

### Orders

All order routes require authentication as a `CUSTOMER`.

| Method | Endpoint                   | Body | Description                |
|--------|----------------------------|------|----------------------------|
| POST   | `/api/orders`              | —    | Place order (checkout cart)|
| GET    | `/api/orders`              | —    | List user's orders         |
| GET    | `/api/orders/:id`          | —    | Get order details          |
| PATCH  | `/api/orders/:id/cancel`   | —    | Cancel a pending order     |

---

## Example Usage

### Register and login

```bash
# Register a customer
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{ "name": "Alice", "email": "alice@example.com", "password": "secret123" }'

# Register an admin
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{ "name": "Admin", "email": "admin@example.com", "password": "admin123", "role": "ADMIN" }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{ "email": "alice@example.com", "password": "secret123" }'
```

### Create a product (admin)

```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -d '{ "name": "Wireless Mouse", "description": "Ergonomic wireless mouse", "price": 29.99, "stock": 50 }'
```

### Add to cart and place order (customer)

```bash
# Add to cart
curl -X POST http://localhost:3000/api/cart/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <CUSTOMER_TOKEN>" \
  -d '{ "productId": 1, "quantity": 2 }'

# Place order
curl -X POST http://localhost:3000/api/orders \
  -H "Authorization: Bearer <CUSTOMER_TOKEN>"
```

---

## Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Transactional checkout** | `prisma.$transaction` atomically validates stock, creates the order + order items, deducts inventory, and clears the cart. If any step fails, everything rolls back. |
| **Server-side totals** | Order totals are computed from `product.price * quantity` on the backend to prevent client-side price manipulation. |
| **Price snapshots** | `priceAtPurchase` on `OrderItem` captures the product price at the time of purchase, so historical orders remain accurate even if prices change. |
| **Double stock validation** | Stock is checked when adding to cart (fast feedback) and again inside the checkout transaction (consistency guarantee). |
| **Cancellation fraud prevention** | A `cancellationCount` field on `User` blocks ordering after 5 cancellations to prevent abuse. |
| **Cart auto-creation** | A cart is lazily created on first access rather than at registration, keeping the database lean. |

---

## Available Scripts

| Script               | Command                      | Description                        |
|----------------------|------------------------------|------------------------------------|
| `npm start`          | `node src/server.js`         | Start the server                   |
| `npm run dev`        | `node --watch src/server.js` | Start with auto-restart            |
| `npm run prisma:generate` | `npx prisma generate`  | Regenerate the Prisma client       |
| `npm run prisma:migrate`  | `npx prisma migrate dev`| Run database migrations            |
| `npm run prisma:studio`   | `npx prisma studio`    | Open Prisma Studio (DB browser)    |

---

## Error Responses

All errors follow a consistent format:

```json
{ "error": "Description of what went wrong." }
```

Validation errors return an array:

```json
{
  "errors": [
    { "type": "field", "msg": "Valid email is required.", "path": "email", "location": "body" }
  ]
}
```

| Status Code | Meaning                          |
|-------------|----------------------------------|
| 400         | Bad request / validation failure |
| 401         | Missing or invalid JWT           |
| 403         | Insufficient permissions         |
| 404         | Resource not found               |
| 409         | Conflict (e.g. duplicate email)  |
| 500         | Internal server error            |
# task_backend
