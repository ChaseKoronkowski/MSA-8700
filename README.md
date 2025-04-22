# MSA-8700: AI Travel Planner

Project Group for Gen AI Solutions Group 1 AKA Strawberry Shortcakes V2

A full-stack web application that helps users plan their perfect trip using AI-powered recommendations based on their preferences.

## Features

- **Home Page**: Introduction to the AI Travel Planner
- **Recommendation Page**: Multi-step form to gather user travel preferences with visual options
- **AI-Powered Recommendations**: Integration with OpenAI to generate personalized travel suggestions
- **Route Planner**: Simple tool to organize destinations in your preferred order

## Technologies Used

- **Next.js**: React framework for server-rendered applications
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **OpenAI API**: AI-powered recommendation engine
- **Material UI**: Component library for a consistent design system
- **Supabase**: Backend database and authentication

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone https://github.com/ChaseKoronkowski/MSA-8700.git
cd MSA-8700
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Create a `.env.local` file in the root directory with your OpenAI API key:

```
OPENAI_API_KEY=your-openai-api-key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. Start the development server:

```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Project Structure

- `src/app`: Next.js app router pages
- `src/components`: Reusable React components
- `src/context`: React context for state management
- `src/types`: TypeScript type definitions
- `src/utils`: Utility functions
- `src/lib`: External service configurations

## API Routes

- `POST /api/openai`: Sends user preferences to OpenAI for generating recommendations
- `GET /api/recommendations`: Retrieves saved travel recommendations
- `GET /api/unsplash`: Fetches destination images

## Deployment

This application can be easily deployed on Vercel:

```bash
npm run build
# or
yarn build
```

## License

MIT
