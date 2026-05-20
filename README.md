# StudySync

A collaborative study platform built with React, Vite, and Supabase.

## Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. Clone the repository (if applicable) or navigate to the project directory.
2. Install the dependencies:
   ```bash
   npm install
   ```

### Environment Setup

Create a `.env` file in the root directory and add your Supabase credentials. These are required for the application to communicate with the backend.

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Running the Application

To start the development server, run:

```bash
npm run dev
```

The application will be available at `http://localhost:8080` (or the port specified in your terminal).

## Scripts

- `npm run dev`: Starts the Vite development server.
- `npm run build`: Builds the application for production.
- `npm run lint`: Runs ESLint to check for code quality issues.
- `npm run preview`: Previews the production build locally.
