# 📰 Afternoon News – Frontend

This is the frontend for the **Afternoon News ePaper Management System**. It provides an administrative dashboard for managing digital newspaper editions and a public-facing viewer for readers.

---

## ✨ Features

- **Admin Dashboard**
  - Create, edit, view, and delete ePapers
  - Upload multiple images and a PDF per edition
  - Drag‑and‑drop reordering of pages
  - Manage user accounts (SuperAdmin, Admin, Staff)
  - Role‑based access control

- **Public ePaper Viewer**
  - Browse newspaper by date
  - Flip through pages with thumbnail navigation
  - Full‑screen mode and PDF download
  - Responsive design for mobile and desktop

- **UI/UX**
  - Gradient headers and consistent card styling
  - Toast notifications for user feedback
  - Search, pagination, and filtering
  - Dark mode support (Tailwind CSS)

---

## 🛠️ Tech Stack

- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **State Management:** React hooks (useState, useEffect, useReducer)
- **Routing:** React Router v6
- **HTTP Client:** Axios
- **Date Handling:** date-fns
- **Drag & Drop:** @dnd-kit/core, @dnd-kit/sortable
- **Icons:** Lucide React, custom SVG icons
- **Notifications:** Custom Toast context

---

## 📁 Folder Structure

```
src/
├── api/                 # API service functions (epaper.api.ts, user.api.ts)
├── components/          # Reusable UI components
│   ├── common/          # PageMeta, GridShape, etc.
│   ├── dashboard/       # Dashboard metrics
│   ├── epaper/          # EpaperForm, EpaperList, EpaperView, SortableItem
│   ├── public/          # PublicLandingPage
│   ├── ui/              # Button, Input, Select, Badge, Pagination, etc.
│   └── user/            # UserForm, UserList
├── context/             # ToastContext, AuthContext
├── hooks/               # Custom hooks (usePagination, useSearch)
├── icons/               # SVG icon components
├── layouts/             # App layout with sidebar/header
├── pages/               # Route pages (Admin, Dashboard, Public, 404)
├── routes/              # Route definitions
├── types/               # Global TypeScript types
├── App.tsx              # Main app component
├── main.tsx             # Entry point
└── index.css            # Global styles
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Backend server running (see [backend README](../backend/README.md))

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-org/afternoon-news.git
   cd afternoon-news/frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env` file in the root:

   ```env
   VITE_API_URL=http://localhost:5000
   ```

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

The app will be available at `http://localhost:5173`.

### Build for Production

```bash
npm run build
```

The output will be in the `dist/` folder. You can preview it with `npm run preview`.

---

## 🔗 Environment Variables

| Variable       | Description                 | Default                 |
| -------------- | --------------------------- | ----------------------- |
| `VITE_API_URL` | Base URL of the backend API | `http://localhost:5000` |

---

## 📖 Usage

### Admin Routes

| Path                                | Description         |
| ----------------------------------- | ------------------- |
| `/admin-dashboard`                  | Dashboard overview  |
| `/admin-dashboard/epapers`          | List all ePapers    |
| `/admin-dashboard/epapers/new`      | Create a new ePaper |
| `/admin-dashboard/epapers/edit/:id` | Edit an ePaper      |
| `/admin-dashboard/epapers/view/:id` | View an ePaper      |
| `/admin-dashboard/users`            | Manage users        |
| `/admin-dashboard/users/new`        | Create a new user   |
| `/admin-dashboard/users/edit/:id`   | Edit a user         |

### Public Routes

| Path   | Description                 |
| ------ | --------------------------- |
| `/`    | Public ePaper viewer        |
| `/404` | 404 page (ePaper not found) |

---

## 🤝 Contributing

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'Add some amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

---

## 📄 License

This project is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.

---
