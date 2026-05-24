# dealflow 🤝

> The all-in-one brand deal management platform for content creators.

Stop managing brand deals in DMs and spreadsheets. dealflow gives you a full pipeline, AI-powered tools, contracts, invoices, and analytics — built specifically for creators.

---

## ✨ Features

### Core
- **Deal Pipeline** — Kanban board across 6 stages: Inbound → Negotiating → Contract Sent → Content Live → Invoiced → Paid
- **Contracts** — Generate professional contracts from templates, mark as sent/signed
- **Invoices** — Create invoices, track payments, mark as paid
- **Analytics** — Revenue trend, pipeline funnel, platform breakdown, 6 key metrics
- **Nudge Queue** — Automatically surfaces deals that have gone silent for 5+ days
- **Rate Card + Media Kit** — Set your rates and share a public media kit link with brands

### AI Features (powered by Groq — free)
- 🔍 **Deal Analyzer** — Paste a brand DM → AI extracts deal details, flags red flags, suggests negotiation tips
- ⚖️ **Contract Reviewer** — Paste any contract → AI gives a risk score and flags dangerous clauses
- ✍️ **Nudge Writer** — Select a silent deal → AI writes 3 personalized follow-up messages
- 🎯 **Pitch Generator** — Enter a brand → AI writes cold outreach pitches in 3 formats
- 💰 **Rate Suggester** — Enter your stats → AI tells you exactly what to charge

### Auth & Security
- JWT authentication with token refresh
- Rate limiting on all auth routes
- Input sanitization (XSS protection)
- Password reset via email
- Strong JWT secret validation at startup

### UX
- Animated counters, spring modals, page transitions
- Floating particle login screen
- Confetti when a deal hits Paid 🎉
- Toast notifications
- Skeleton loading on every screen
- Error boundaries on every screen
- Mobile responsive layout with bottom tab bar
- Empty states for new users
- Free plan deal limit with upgrade prompt

### Admin Panel
- See all users with usage stats
- One-click plan upgrades (Free → Pro → Studio)
- Quick upgrade by email
- Platform-wide stats

---

## 🛠 Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React + Vite |
| Styling | Inline styles + CSS animations |
| State | useState + useCallback + Context API |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| Auth | JWT + bcryptjs |
| AI | Groq API (Llama 3.1 70B — free tier) |
| Email | Resend |
| Deployment | Railway (backend) + Vercel (frontend) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- Groq API key (free at [console.groq.com](https://console.groq.com))

### Backend Setup

```bash
cd dealflow-backend
npm install
cp .env.example .env
# Fill in your .env values
npm run db:migrate
npm run db:seed
npm run dev
```

Backend runs on `http://localhost:4000`

### Frontend Setup

```bash
cd dealflow
npm install
cp .env.example .env
# Fill in your .env values
npm run dev
```

Frontend runs on `http://localhost:5173`

---

## ⚙️ Environment Variables

### Backend (`dealflow-backend/.env`)

```env
PORT=4000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@localhost:5432/dealflow
JWT_SECRET=your_super_strong_secret_min_32_chars
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
ADMIN_EMAILS=your@email.com
RESEND_API_KEY=re_xxxx
FROM_EMAIL=hello@dealflow.app
GROQ_API_KEY=gsk_xxxx
```

### Frontend (`dealflow/.env`)

```env
VITE_API_URL=http://localhost:4000/api
VITE_GROQ_API_KEY=gsk_xxxx
VITE_ADMIN_EMAILS=your@email.com
```

---

## 📁 Project Structure

```
dealflow-backend/
├── src/
│   ├── db/
│   │   ├── migrate.js       # DB schema
│   │   ├── migrate-v2.js    # v2 additions
│   │   ├── seed.js          # Demo data
│   │   └── pool.js          # PG connection
│   ├── middleware/
│   │   ├── auth.js          # JWT guard
│   │   ├── admin.js         # Admin guard
│   │   ├── rateLimit.js     # Rate limiting
│   │   └── sanitize.js      # XSS protection
│   ├── routes/
│   │   ├── auth.js          # Login, register, reset
│   │   ├── deals.js         # Deal CRUD + nudges
│   │   ├── contracts.js     # Contract management
│   │   ├── invoices.js      # Invoice management
│   │   ├── rateCard.js      # Rate card CRUD
│   │   ├── analytics.js     # Dashboard metrics
│   │   ├── mediaKit.js      # Public media kit
│   │   └── admin.js         # Admin panel
│   ├── services/
│   │   └── emailService.js  # Resend emails
│   └── index.js             # Express app

dealflow/
├── src/
│   ├── components/
│   │   ├── Animations.jsx   # All animation components
│   │   ├── ErrorBoundary.jsx
│   │   ├── FreePlanBanner.jsx
│   │   ├── MobileNav.jsx
│   │   ├── MobilePipeline.jsx
│   │   └── Skeletons.jsx
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── hooks/
│   │   ├── useAsync.js
│   │   ├── useDeals.js
│   │   ├── useAnalytics.js
│   │   ├── useInvoices.js
│   │   └── useIsMobile.js
│   ├── screens/
│   │   ├── AnalyticsScreen.jsx
│   │   ├── ContractsScreen.jsx
│   │   ├── InvoicesScreen.jsx
│   │   ├── NudgesScreen.jsx
│   │   ├── RateCardScreen.jsx
│   │   ├── AdminScreen.jsx
│   │   ├── AIDealAnalyzerScreen.jsx
│   │   ├── AIContractReviewerScreen.jsx
│   │   ├── AINudgeWriterScreen.jsx
│   │   ├── AIPitchGeneratorScreen.jsx
│   │   ├── AIRateSuggesterScreen.jsx
│   │   ├── PasswordResetScreens.jsx
│   │   └── PublicMediaKitScreen.jsx
│   ├── services/
│   │   ├── api.js
│   │   ├── authService.js
│   │   ├── dealService.js
│   │   ├── analyticsService.js
│   │   ├── invoiceService.js
│   │   └── groqService.js
│   └── App.jsx
```

---

## 🌐 Deployment

### Railway (Backend)

1. Push `dealflow-backend` to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Add PostgreSQL plugin
4. Set environment variables
5. Run migrations via Railway terminal:
   ```bash
   node src/db/migrate.js
   node src/db/migrate-v2.js
   node src/db/seed.js
   ```

### Vercel (Frontend)

1. Push `dealflow` to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import repo
3. Set environment variables
4. Deploy

---

## 🔑 Demo Account

```
Email:    demo@dealflow.app
Password: demo1234
```

---

## 📸 Screenshots

> Pipeline, Analytics, AI Features, Mobile Layout

---

## 📄 License

MIT — feel free to use, modify, and deploy.

---

Built with ❤️ by [Rohit Kumar](https://github.com/rohit756567kumar)
