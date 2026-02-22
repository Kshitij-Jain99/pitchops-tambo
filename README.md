# PitchOps — Powered by Tambo AI

> An AI-native pitch operations tool built with React, Vite, and the Tambo generative UI SDK.

---

## Overview

**PitchOps** is a React application that leverages [Tambo AI](https://github.com/tambo-ai/tambo) to deliver a generative UI experience for managing pitch workflows. Instead of navigating rigid forms and dashboards, users interact naturally — the AI dynamically renders the right interface based on what they're trying to accomplish.

---

## Features

- **Generative UI** — Tambo selects and renders the appropriate components based on natural language input
- **Conversational Interface** — Chat-driven workflow for pitch management tasks
- **Streaming Props** — UI components update in real-time as the AI generates responses
- **MCP Support** — Connect to external tools and data sources via the Model Context Protocol
- **React + Vite** — Fast, modern development stack with Hot Module Replacement (HMR)
- **TypeScript** — Fully typed codebase for reliability and developer experience

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend Framework | React 18 |
| Build Tool | Vite |
| Language | TypeScript |
| AI / Generative UI | Tambo AI SDK (`@tambo-ai/react`) |
| Styling | CSS |
| Linting | ESLint |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- npm or yarn
- A [Tambo AI](https://tambo.co) API key (free to get started)

### Installation

```bash
# Clone the repository
git clone https://github.com/Kshitij-Jain99/pitchops-tambo.git
cd pitchops-tambo

# Install dependencies
npm install
```

### Environment Setup

Create a `.env` file in the project root:

```env
VITE_TAMBO_API_KEY=your_tambo_api_key_here
```

You can get a free Tambo API key at [tambo.co](https://tambo.co).

### Development

```bash
npm run dev
```

The app will start at `http://localhost:5173` with HMR enabled.

### Build for Production

```bash
npm run build
```

Output goes to the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

---

## Project Structure

```
pitchops-tambo/
├── public/             # Static assets
├── src/
│   ├── components/     # React components registered with Tambo
│   ├── App.tsx         # Root application component
│   └── main.tsx        # Entry point with TamboProvider setup
├── index.html
├── vite.config.js
├── package.json
└── README.md
```

---

## How Tambo Works in This Project

Components are registered with Tambo using Zod schemas that describe their props. The Tambo AI agent reads these schemas and decides which component to render based on the user's message.

```tsx
import { TamboProvider } from "@tambo-ai/react";

const components: TamboComponent[] = [
  {
    name: "PitchCard",
    description: "Displays a pitch summary with status and key details",
    component: PitchCard,
    propsSchema: z.object({
      title: z.string(),
      status: z.enum(["draft", "sent", "accepted", "rejected"]),
      amount: z.number(),
    }),
  },
];

<TamboProvider apiKey={import.meta.env.VITE_TAMBO_API_KEY} components={components}>
  <App />
</TamboProvider>
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## Resources

- [Tambo AI Documentation](https://docs.tambo.co)
- [Tambo GitHub](https://github.com/tambo-ai/tambo)
- [Vite Documentation](https://vitejs.dev)
- [React Documentation](https://react.dev)

---

## License

This project is open source. See the repository for license details.
