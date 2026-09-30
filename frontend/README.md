# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
 ## Database Schema: Notifications & Reviews

### Notifications Table
- `id`: Integer, Primary Key, Autoincrement
- `user_id`: Integer, Foreign Key (`users.id`), Cascading Delete
- `type`: String(50), Notification category (e.g., `ORDER_UPDATE`, `PROMOTION`)
- `message`: String(500), Notification message body
- `is_read`: Boolean, Default `False`
- `created_at`: DateTime, Auto timestamp

### Reviews Table
- `id`: Integer, Primary Key, Autoincrement
- `product_id`: Integer, Foreign Key (`products.id`), Cascading Delete
- `user_id`: Integer, Foreign Key (`users.id`), Cascading Delete
- `order_id`: Integer, Foreign Key (`orders.id`), Cascading Delete
- `rating`: Integer, Check Constraint (`rating >= 1 AND rating <= 5`)
- `title`: String(150), Review summary
- `comment`: Text, Detailed customer review
- `status`: String(20), Moderation workflow enum (`Approved`, `Hidden`), Default `Approved`
- `created_at`: DateTime, Auto timestamp

### Seed & Migration Execution
- Alembic migration script located in `backend/alembic/versions/0001_create_notifications_and_reviews.py`
- Executed and verified via `backend/seed_supabase.py`