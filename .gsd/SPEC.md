# Project Specification: Zion Grocery React POS Override

**Status: FINALIZED**

## 1. Objective
Abolish the existing legacy vanilla HTML/JS frontend architecture and replace it completely with a modern **React SPA (Single Page Application)** while upgrading the Node.js backend. This override focuses heavily on achieving a premium aesthetic, seamless client-side routing, and unbreakable Firebase authentication.

## 2. Requirements

### 2.1 Technical Stack
*   **Frontend Framework**: React 18+ powered by Vite.
*   **Routing**: React Router DOM (v6+).
*   **Styling**: Premium CSS (High-end modern design, glassmorphism, dynamic transitions). Use of robust CSS modules or styled architectures.
*   **Backend**: Existing Node.js Express server + PostgreSQL.
*   **State Management**: React Context API for global state (Auth, Notifications, Cart).

### 2.2 Security & Authentication
*   **Hybrid Authentication**: React Login component bridging Firebase Email/Password & Google Sign In.
*   **API Protection**: All `fetch()` or `axios` operations emitted by React must intercept the Firebase JWT and inject it into the `Authorization` header.
*   **Backend Middleware**: Express server verifies the Firebase token via `firebase-admin`.

### 2.3 UI/UX Design Aesthetics
*   **Visual Dominance**: The interface must feature a strikingly modern, premium gradient-based aesthetic with subtle blurs and high contrast readability.
*   **Animation**: React Framer Motion or robust CSS transitions for modal entrances, page routing and data shuffling.

## 3. Scope Exclusions
*   We will not entirely erase the old frontend code immediately. It will be renamed to `frontend-legacy` to ensure complex business logic formulas (e.g., table structure, receipt layouts) can be referenced during the component conversions.
