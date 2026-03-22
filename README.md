# NeuroPlan - Team Threshold

NeuroPlan is a modern React + TypeScript frontend app (Vite) with Supabase integration for dataset management and threshold-based visual simulation. It provides a clean UI and architecture for developing neuroscience planning dashboards, experimental data insights, and statistical analysis workflows.

## 🚀 Features

- Vite + React + TypeScript app scaffold
- Tailwind CSS and component-driven UI (`src/components/ui`)
- Threshold analysis views in `src/components/threshold`
- Chart grid and dataset filtering panels
- Supabase data access (`src/integrations/supabase/client.ts`)
- API helpers in `src/lib/api/datasets.ts`
- Local simulation utilities: `src/lib/simulation.ts`

## 🗂️ Project structure

- `src/` - application source code
  - `App.tsx` - root app layout and route wiring
  - `pages/` - route pages (Index, NotFound)
  - `components/` - reusable components
  - `hooks/` - custom hooks
  - `integrations/supabase/` - database connection and types
  - `lib/` - business logic and helpers
- `public/` - static assets
- `supabase/function/fetch-datasets` - serverless dataset fetch function

## ⚙️ Requirements

- Node.js 18+ (or LTS of your choice)
- npm or yarn
- Supabase project (optional for local dev with mock data)

## 📦 Setup

1. Clone the repository:

```bash
git clone https://github.com/<user>/NeuroPlan.git
cd NeuroPlan
```

2. Install dependencies:

```bash
npm install
# or yarn
# yarn install
```

3. Add environment variables from Supabase (.env or .env.local):

```ini
VITE_SUPABASE_URL=https://your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

4. Run the development server:

```bash
npm run dev
# or yarn dev
```

5. Open `http://localhost:5173`

## 🧪 Testing

```bash
npm run test
# or yarn test
```

## 🧹 Lint + Format

```bash
npm run lint
npm run format
```

## 🔧 Deployment

Build for production:

```bash
npm run build
```

Serve locally:

```bash
npm run preview
```

> For cloud hosting, deploy to Netlify/Vercel or any static hosting provider supporting Vite.

## 🧠 How to extend

- Add new API endpoints in `src/lib/api`
- Extend threshold panels under `src/components/threshold`
- Add custom hooks in `src/hooks`
- Use Supabase Edge Functions in `supabase/functions`

## 📚 Resources

- Vite: https://vitejs.dev
- React: https://reactjs.org
- Tailwind CSS: https://tailwindcss.com
- Supabase: https://supabase.com

## 🧾 License

MIT
