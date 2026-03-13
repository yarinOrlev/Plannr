# Plannr - Product Management Platform

**Plannr** is a premium, feature-rich web application designed for Product Managers and Department Heads to align strategy, prioritize features, and manage roadmaps across multiple products.

---

## 🚀 Key Features

### 🏢 Department Leadership
- **Department Overview**: Real-time stats on OKR progress, feature counts, and recent reviews across all department products.
- **Unified Department Timeline**: A "birds-eye" view of all product roadmaps on a single quarterly grid, allowing leadership to see the entire portfolio's progress.
- **Direct Feedback**: Department heads can leave reviews and feedback directly on roadmap items.

### 🎯 Product Strategy
- **Product Strategy (3Ps)**: Framework to define the **Problem**, **People** (Audience), and **Product** (Solution).
- **Editable Product Vision**: Auto-generated vision statements based on the 3Ps, with the ability for PMs to override with their own custom vision.
- **KPIs & OKRs**: Integrated goal tracking at both the product and department levels.

### ⚖️ Prioritization & Roadmaps
- **Enhanced RICE Scoring**: Quantitative prioritization using Reach, Impact, Confidence, and Effort with explainable tooltips and a visual "heat-map" scoring system.
- **Flexible Roadmaps**: Support for both **Kanban** (Now/Next/Later) and **Timeline** (Monthly/Quarterly) views.

### 🛠️ Productivity Tools
- **Floating Note Bubble**: A persistent, bottom-left pencil icon that allows users to capture quick notes from ANY page, saving them instantly to the central Notes page.
- **Customer CRM**: Lightweight management of customer tiers, status, and associated product notes.
- **Documentation Hub**: Central repository for product documentation and strategic frameworks.

---

## 💻 Tech Stack

- **Core**: React 18 + Vite
- **Icons**: Lucide React
- **Styling**: Vanilla CSS with a modern **Glassmorphism** design language.
- **Persistence**: LocalStorage (Zero backend configuration required for demo).

---

## 🛠️ Getting Started

### Prerequisites
- Node.js (Latest LTS recommended)
- npm or yarn

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

### Resetting Data
If you need to clear all local data and start fresh, use the **"איפוס נתונים" (Reset Data)** button in the sidebar.

---

## 🎨 Design System
The app follows a sleek, dark-themed (with light mode support) glassmorphism aesthetic:
- **Glass Panels**: Using `backdrop-filter` for a premium feel.
- **Color-Coded Statuses**: Clear visual indicators for priority, status, and scores.
- **Micro-Animations**: Smooth fade-ins and slide-ups for a responsive UX.
