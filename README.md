<div align="center">

<img src="public/logo.png" alt="Onikuma Nepal" width="180" />

# 🎮 Onikuma Nepal — Official E-Commerce Store

**The official online storefront for Onikuma gaming peripherals in Nepal.**
Buy headsets, keyboards, mice, and more — built with a custom Node.js + MongoDB backend and a pixel-perfect storefront.

[![GitHub Stars](https://img.shields.io/github/stars/AniketH13/onikuma-website?style=flat-square)](https://github.com/AniketH13/onikuma-website/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)
[![Vercel Deploy](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=flat-square&logo=vercel)](https://vercel.com)
[![MongoDB Atlas](https://img.shields.io/badge/Database-MongoDB%20Atlas-47A248?style=flat-square&logo=mongodb)](https://www.mongodb.com/atlas)

</div>

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Admin Panel](#-admin-panel)
- [Deployment (Vercel)](#-deployment-vercel)
- [Contributing](#-contributing)

---

## ✨ Features

### Customer Storefront
- 🛍️ **Full product catalog** with category, price, and stock filtering
- 🔍 **Live search** across products and categories
- 🛒 **Persistent shopping cart** with drawer UI and real-time totals
- 📦 **Individual product detail pages** with specifications, images, and variants
- 💳 **Checkout flow** with order summary
- 📢 **Promotional banners**, sale badges, and countdown timers
- 📱 **Fully responsive** design — mobile, tablet, and desktop

### Admin Dashboard (`/admin`)
- 🔐 **JWT-protected login** — no unauthorised access
- 📦 **Product management** — add, edit, delete, and manage stock
- 🗂️ **Category management** — create and organise product categories with icons
- 📋 **Order management** — view and update order statuses
- 🖼️ **Image uploads** — upload product photos directly from the panel (no external URL required)
- ✍️ **Rich spec editor** — add any number of key–value specifications per product
- ⚙️ **Store settings** — manage hotline number, announcements, and contact details
- 📊 **Dashboard overview** — live stats for products, categories, and orders

### Backend & Database
- 🍃 **MongoDB Atlas** for cloud production with in-memory fallback for local development
- 🔁 **Graceful reconnect logic** with `bufferCommands: false` for safe serverless use
- 🌐 **REST API** with full CRUD for products, categories, orders, settings, and auth
- ☁️ **Vercel serverless** compatible with `api/index.js` adapter

---

## 🛠️ Tech Stack

| Layer         | Technology                              |
|---------------|-----------------------------------------|
| Frontend      | Vanilla HTML5, CSS3, JavaScript (ESM)   |
| Backend       | Node.js, Express.js                     |
| Database      | MongoDB Atlas (cloud) / Local MongoDB   |
| ODM           | Mongoose                                |
| Auth          | JWT (JSON Web Tokens)                   |
| File Uploads  | Multer (local disk storage)             |
| Deployment    | Vercel (serverless) / VPS (standalone)  |
| Version Ctrl  | Git + GitHub                            |

---

## 📁 Project Structure

```
onikuma-nepal/
├── api/
│   └── index.js              # Vercel serverless function entry point
├── public/
│   ├── index.html            # Customer homepage
│   ├── products.html         # Product catalog page
│   ├── product.html          # Single product detail page
│   ├── admin.html            # Admin dashboard (JWT protected)
│   ├── css/                  # All stylesheets
│   ├── js/
│   │   ├── app.js            # Homepage storefront controller
│   │   ├── products-page.js  # Catalog page controller
│   │   ├── product-detail.js # Product detail page controller
│   │   ├── admin.js          # Admin panel logic
│   │   ├── cart.js           # Shopping cart module
│   │   ├── checkout.js       # Checkout flow
│   │   ├── api.js            # Frontend API client
│   │   ├── search.js         # Search module
│   │   └── quickview.js      # Quick-view overlay
│   ├── uploads/              # Uploaded product images
│   └── logo.png
├── server/
│   ├── server.js             # Express app + route setup
│   ├── db/
│   │   └── connect.js        # MongoDB connect & in-memory fallback
│   ├── models/
│   │   ├── Product.js
│   │   ├── Category.js
│   │   ├── Order.js
│   │   └── Setting.js
│   └── routes/
│       ├── products.js
│       ├── categories.js
│       ├── orders.js
│       ├── settings.js
│       ├── auth.js
│       └── upload.js
├── .env.example              # Template for environment variables
├── vercel.json               # Vercel routing configuration
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+
- **npm** v9+
- A running **MongoDB** instance (local or [MongoDB Atlas](https://www.mongodb.com/atlas))

### 1. Clone the repository

```bash
git clone https://github.com/AniketH13/onikuma-website.git
cd onikuma-website
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` with your values (see [Environment Variables](#-environment-variables) below).

### 4. Start the development server

```bash
npm run dev
```

The server will start on **http://localhost:5000** by default.

| URL | Description |
|-----|-------------|
| `http://localhost:5000` | Customer storefront homepage |
| `http://localhost:5000/products` | Product catalog |
| `http://localhost:5000/product?id=<slug>` | Single product detail page |
| `http://localhost:5000/admin` | Admin dashboard |
| `http://localhost:5000/api/health` | API health check |

---

## 🔧 Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```env
# Server
PORT=5000

# MongoDB
# - Local development: use your local MongoDB URI
# - Production: use your MongoDB Atlas connection string
MONGODB_URI=mongodb://127.0.0.1:27017/onikuma_nepal

# Admin credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password

# JWT Secret (change this to a strong random string in production)
JWT_SECRET=your_jwt_secret_key

# Store contact info
HOTLINE_NUMBER=9864006883
```

> **Note for Vercel deployment:** Set all environment variables in your Vercel project settings under **Settings → Environment Variables**. Replace `MONGODB_URI` with your Atlas connection string.

---

## 📡 API Reference

All API endpoints are prefixed with `/api`.

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | Admin login — returns a JWT token |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/products` | Get all active products (supports `?category=` and `?search=`) |
| `GET` | `/api/products/:id` | Get a single product by ID or slug |
| `POST` | `/api/products` | Create a new product *(Admin only)* |
| `PUT` | `/api/products/:id` | Update an existing product *(Admin only)* |
| `DELETE` | `/api/products/:id` | Delete a product *(Admin only)* |

### Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/categories` | Get all categories |
| `POST` | `/api/categories` | Create a category *(Admin only)* |
| `PUT` | `/api/categories/:id` | Update a category *(Admin only)* |
| `DELETE` | `/api/categories/:id` | Delete a category *(Admin only)* |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/orders` | Get all orders *(Admin only)* |
| `POST` | `/api/orders` | Place a new order |
| `PUT` | `/api/orders/:id` | Update order status *(Admin only)* |

### Settings
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/settings` | Get store settings |
| `PUT` | `/api/settings` | Update store settings *(Admin only)* |

### File Upload
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/upload` | Upload product images *(Admin only)* |

---

## 🔐 Admin Panel

The admin dashboard is accessible at `/admin`.

**Default credentials** (change before going live!):
- **Username:** `admin`
- **Password:** `onikuma2026`

Features available in the admin panel:
- **Products:** Add new products with images uploaded directly from your computer, set prices, stock, specs, and badges.
- **Categories:** Create categories with custom emoji icons.
- **Orders:** View all customer orders and update their status.
- **Settings:** Update the store hotline number and announcement banner.

> ⚠️ **Security Notice:** Always change the default admin credentials via environment variables before deploying to production.

---

## ☁️ Deployment (Vercel)

This project is configured for zero-config deployment on Vercel.

### Steps

1. **Push your code** to GitHub.

2. **Import the project** on [vercel.com](https://vercel.com):
   - Go to **New Project** → Import from GitHub → Select `onikuma-website`.

3. **Add Environment Variables** in your Vercel project settings:

   | Variable | Value |
   |----------|-------|
   | `MONGODB_URI` | `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/onikuma_nepal?retryWrites=true&w=majority` |
   | `ADMIN_USERNAME` | `admin` |
   | `ADMIN_PASSWORD` | `your_strong_password` |
   | `JWT_SECRET` | `your_jwt_secret` |

4. Click **Deploy**. Vercel will automatically detect `vercel.json` and use `api/index.js` as the serverless handler.

### URL Routing (`vercel.json`)

```
/api/*     →  api/index.js   (serverless backend)
/products  →  products.html
/product   →  product.html
/admin     →  admin.html
```

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m "Add my feature"`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📞 Contact & Support

- **Customer Hotline:** +977 9864006883
- **GitHub:** [AniketH13/onikuma-website](https://github.com/AniketH13/onikuma-website)

---

<div align="center">
  Made with ❤️ for the Nepalese gaming community
</div>