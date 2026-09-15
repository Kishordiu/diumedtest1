# 🩺 DiuMed - Your Personal Health Companion

**Observe. Interpret. Act. All from the palm of your hand.**

Welcome to **DiuMed**! We built this app because we believe everyone should have access to fundamental health insights without needing expensive hardware. DiuMed is a mobile-first, privacy-conscious health companion that uses just your phone's camera to estimate optical vital signs. 

We are incredibly transparent about what DiuMed is—and what it isn't. It's a tool to help you interpret your symptoms and guide your next steps, but it's not a replacement for a doctor.

---

## ✨ What Can DiuMed Do?

| Feature | How It Works | A Quick Note |
|---|---|---|
| **❤️ Heart Rate & Pulse** | Uses your camera to optically estimate your pulse (rPPG). | *Experimental! Lighting and movement matter.* |
| **🤖 Symptom Triage** | Chat with our AI or use our offline rule engine to check symptoms. | *We clearly separate AI advice from offline rules.* |
| **🚨 Emergency Help** | Instantly opens your phone's dialer or SMS to contact loved ones. | *It hands off to your phone—it doesn't fake dispatch.* |
| **📁 Private Records** | Securely saves your health history to the cloud (Supabase). | *Fully private. Only YOU can see your data.* |
| **📶 Works Offline** | The app shell and offline triage still work even if you lose signal. | *Powered by our advanced Service Worker.* |
| **🎨 Beautiful UI** | Switch between a glowing *Warm Pearl* or sleek *Dark Mineral* theme! | *Built with modern 3D Glassmorphism.* |

---

## ⚠️ What DiuMed CANNOT Do

We want to be completely upfront to ensure your safety:
- ❌ We **cannot diagnose illnesses**.
- ❌ We **cannot replace a medical examination** or professional advice.
- ❌ We **cannot accurately measure SpO₂** (Blood Oxygen) with a standard phone camera.
- ❌ We **cannot automatically dispatch 911 or emergency services** for you.

---

## 🛠️ The Tech Stack (For the Geeks!)

DiuMed is built on a modern, lightning-fast stack:
- **Frontend**: React + TypeScript + Vite
- **Design System**: Tailwind CSS + Framer Motion (for those buttery smooth animations) + Lucide React
- **Backend**: Supabase (PostgreSQL, Auth, and Edge Functions for AI triage)
- **Offline Mode**: Workbox PWA

Want to dive deeper? Check out our [Architecture Guide](docs/ARCHITECTURE.md).

---

## 🚀 Getting Started

Want to run DiuMed locally? It's easy!

### 1. What You Need
- Node.js 18+ and npm 9+
- A [Supabase](https://supabase.com/) project

### 2. Clone & Install
```bash
git clone https://github.com/Kishordiu/diumedtest1.git
cd diumed12
npm install
```

### 3. Setup Your Environment
Create a `.env.local` file in the root folder:
```bash
cp .env.example .env.local
```
Then, pop in your Supabase details:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```
*(Psst! Never share or commit your `.env.local` file!)*

### 4. Database Setup
You can easily apply our database schema using the Supabase CLI:
```bash
supabase db push
```
Or, you can manually run the SQL files found in `supabase/migrations/` in your Supabase SQL editor.
Curious about the tables? Read the [Database Docs](docs/DATABASE.md).

### 5. Fire Up the AI Edge Function
To make the AI Triage work, you need a Gemini API key:
```bash
# Add your secret to Supabase
supabase secrets set GEMINI_API_KEY=your-gemini-api-key

# Deploy the function
supabase functions deploy triage
```

### 6. Run It!
```bash
npm run dev
```
Open `http://localhost:5173` and enjoy!

---

## 📚 Documentation

Looking for more details? We've got you covered:
- 🏗️ [**Architecture**](docs/ARCHITECTURE.md) - How everything connects.
- 💾 [**Database**](docs/DATABASE.md) - Schema, Migrations, and Security Rules.
- 🫀 [**rPPG Engine**](docs/RPPG.md) - How we measure heart rates using a camera.
- 🛡️ [**Security**](docs/SECURITY.md) - How we protect your data.
- 🧪 [**Testing**](docs/TESTING.md) - Test coverage and our Android testing checklist.
- 🚀 [**Deployment**](docs/DEPLOYMENT.md) - How to ship this to production.

---

### ❤️ Thank you for checking out DiuMed! Stay healthy!
