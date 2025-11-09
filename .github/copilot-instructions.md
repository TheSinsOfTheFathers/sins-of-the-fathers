# Sins of the Fathers - Copilot Instructions

This document provides guidance for AI coding agents working on the "Sins of the Fathers" project.

## Project Overview

This is a web application that serves as a lore bible for the "Sins of the Fathers" universe.

-   **Frontend**: Static HTML, CSS, and vanilla JavaScript (ES6 Modules) located in the `public` directory.
-   **Backend**: Firebase Functions (TypeScript) located in the `functions` directory.
-   **Database**: Firestore is used for the database.
-   **Authentication**: Firebase Authentication is used for user management.

## Architecture

The project is a monorepo with two main parts: the frontend application (`public`) and the backend services (`functions`).

### Frontend (`public`)

The frontend is a static site that dynamically loads content from Firestore.

1.  **Centralized Initialization (`public/assets/js/main.js`)**: The `main.js` file acts as a router. On `DOMContentLoaded`, it checks for the presence of specific DOM elements to determine which page is currently active.

2.  **On-Demand Module Loading**: Based on the active page, `main.js` calls the appropriate function from a corresponding module in `public/assets/js/modules/`. For example, if `#main-characters-gallery` exists, it calls `displayCharacters()` from `character-loader.js`.

3.  **Data Fetching from Firestore**: Each `*-loader.js` module is responsible for a specific Firestore collection. It imports the `db` instance from `firebase-config.js`, queries a collection (e.g., `characters`, `factions`), and generates the necessary HTML to display the data.

### Backend (`functions`)

The backend consists of Firebase Functions written in TypeScript.

-   **Source Code**: The source code is in `functions/src/index.ts`.
-   **Compilation**: The TypeScript code is compiled into JavaScript in `functions/lib/`.
-   **Example Function**: `verifyRecaptchaToken` is a callable function that verifies a reCAPTCHA token. This is used to protect user-facing endpoints.

## Development Workflow

### Frontend

-   **Running the project**: The frontend is a static site. You can open any `.html` file from the `public` directory in a web browser. For a better experience, use the Firebase emulator suite.
-   **Dependencies**: Frontend dependencies (like the Firebase SDK) are loaded via CDN in the `.html` files. There is no `package.json` for the frontend.

### Backend (Firebase Functions)

The backend has a separate development workflow managed with npm scripts in `functions/package.json`.

-   **Install Dependencies**: `cd functions && npm install`
-   **Build**: `npm run build` (compiles TypeScript to JavaScript)
-   **Run Locally (with Emulators)**: `npm run serve` (builds and starts the Firebase emulators)
-   **Deploy**: `npm run deploy`

### Firebase Emulators

The project is configured to use the Firebase Emulator Suite for local development. To start the emulators for all services (hosting, functions, firestore, auth), run `firebase emulators:start` from the root directory. The `functions/package.json` `serve` script is a convenient way to start the functions emulator.

## Conventions and Patterns

-   **ES6 Modules**: The frontend project is fully based on ES6 modules (`import`/`export`). All scripts are loaded with `type="module"`.
-   **Firebase Services**: Always import Firebase services (like `db`, `auth`, `storage`) from `public/assets/js/modules/firebase-config.js`. Do not initialize them elsewhere.
-   **Page-Specific Logic**: To add functionality to a new or existing page, create a new loader module in `public/assets/js/modules/` and add a check in `public/assets/js/main.js` to trigger it based on a unique element on that page.
-   **Firebase Functions**: Functions are written in TypeScript and use the v2 function syntax. Follow the existing patterns in `functions/src/index.ts` when adding new functions.
-   **Environment Variables**: Secrets like API keys are managed using Google Secret Manager. See the `getRecaptchaSecret` function in `functions/src/index.ts` for an example.

