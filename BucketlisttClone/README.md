# 🌟 BucketListt
A modern, responsive web application built with cutting-edge technologies for seamless data management and visualization.

## ✨ Features

- 🎨 **Modern UI/UX** - Built with shadcn/ui components and Tailwind CSS
- 🔐 **Authentication** - Secure user authentication with Supabase
- 📊 **Data Visualization** - Interactive charts and graphs with Recharts
- 🌙 **Dark Mode** - Toggle between light and dark themes
- 📱 **Responsive Design** - Optimized for all device sizes
- ⚡ **Fast Performance** - Powered by Vite for lightning-fast developments

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **React 18** | Frontend framework |
| **TypeScript** | Type-safe development |
| **Vite** | Build tool and dev server |
| **Tailwind CSS** | Utility-first CSS framework |
| **shadcn/ui** | Modern component library |
| **Supabase** | Backend as a Service |
| **React Query** | Data fetching and caching |
| **React Router** | Client-side routing |
| **Recharts** | Data visualization |

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd <project-folder>
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Update the `.env` file with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## 📝 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run build:dev` | Build for development |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
├── hooks/              # Custom React hooks
├── integrations/       # Third-party integrations
│   └── supabase/      # Supabase configuration
├── lib/               # Utility functions
├── pages/             # Application pages
├── App.tsx            # Main application component
└── main.tsx           # Application entry point
```

## 🎨 UI Components

This project uses **shadcn/ui** components, providing:

- 🎯 Accessible components following WAI-ARIA guidelines
- 🎨 Customizable design system
- 📦 Tree-shakeable component library
- 🔧 Built on Radix UI primitives

## 🔧 Configuration

### Tailwind CSS
The project uses a custom Tailwind configuration with:
- Custom color palette
- Typography plugin
- Animation utilities
- Responsive breakpoints

### TypeScript
Strict TypeScript configuration for:
- Type safety
- Better developer experience
- Enhanced IDE support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful component library
- [Supabase](https://supabase.com/) for the backend infrastructure
- [Vite](https://vitejs.dev/) for the amazing build tool
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework

---

<div align="center">
  <p>Built with ❤️ using modern web technologies</p>
</div>
