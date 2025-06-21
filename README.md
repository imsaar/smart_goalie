# SMART Goals Application

This is a web application designed to help users create, track, and manage their SMART (Specific, Motivating, Attainable, Relevant, Trackable) goals. It features an optional AI-powered analysis to provide feedback on your goals using Google's Gemini LLM, based on the Situational Leadership II framework.

## Key Features

*   **Create and Manage SMART Goals**: Define goals with all SMART components.
*   **Goal Hierarchy**: Ability to break down goals into subgoals and link them to higher-level objectives (basic structure in place).
*   **AI-Powered Goal Analysis**: Optional feature to get feedback on your goals from Gemini LLM to help refine them.
*   **Owner Assignment**: Assign an "Owner" to each goal. New owners can be created on the fly.
*   **Progress Tracking (Basic)**: Foundational elements for status updates.
*   **Goal Levels**: Assign levels to goals (e.g., Weekly, Monthly, Quarterly, Annual, Five Year).
*   **Modern UI**: Built with Next.js and Tailwind CSS for a responsive experience.
*   **SQLite Database**: Uses a file-based SQLite database for data persistence.

## Tech Stack

*   **Framework**: [Next.js](https://nextjs.org/) (with App Router)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **Language**: TypeScript
*   **Database**: SQLite (via `sqlite` and `sqlite3` npm packages)
*   **AI Integration**: Google Gemini LLM (via `@google/generative-ai` npm package)

## Prerequisites

*   [Node.js](https://nodejs.org/) (v18.x or later recommended)
*   [npm](https://www.npmjs.com/) (or yarn/pnpm)

## Getting Started

1.  **Clone the repository (if applicable):**
    ```bash
    # git clone <repository-url>
    # cd smart-goals-app
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    # yarn install
    # or
    # pnpm install
    ```

3.  **Set up Environment Variables:**
    For the AI Goal Analysis feature, you need a Gemini API key.
    *   Create a file named `.env.local` in the root of the project (`smart-goals-app/.env.local`).
    *   Add your Gemini API key to this file:
        ```
        GEMINI_API_KEY=your_actual_gemini_api_key_here
        ```
    *   If you don't have an API key or don't want to use this feature, the application will still function, but the "Get AI Feedback" button will result in an error if clicked.

4.  **Run the development server:**
    This project is configured to use Turbopack for development by default.
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## How to Use

*   Navigate to the homepage to see a list of existing goals.
*   Click "Create New Goal" to go to the goal creation form.
*   Fill in the goal details, including the SMART components.
*   Assign an "Owner" by selecting from existing users or creating a new one.
*   Optionally, click "Get AI Feedback" to have the Gemini LLM analyze your goal's title and SMART components. The feedback will appear on the form.
*   Save the goal.
*   From the homepage, you can click on a goal card to "View Details" or "Edit" the goal. The detail page also allows for AI feedback.

## Notes

*   The application uses a local SQLite database file (`smart_goals.db`) stored in the `data/` directory (created automatically). This directory is included in `.gitignore`.
*   The Next.js configuration in `next.config.mjs` is set up to handle `sqlite3` as an external package for server components.

## Future Enhancements (To-Do)

*   Full implementation of sub-goal linking and visualization.
*   Advanced progress tracking and updates UI.
*   User authentication and distinct user accounts.
*   Assigning collaborators to goals.
*   Views for goals by different criteria (time-frame, owner, collaborators).
*   Enhanced organizational hierarchy and cross-organizational goal linking.
*   More robust error handling and user feedback.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a font family for Vercel.
