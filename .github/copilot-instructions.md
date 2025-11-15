# Sins of the Fathers AI Coding Agent Instructions

This document provides guidance for AI coding agents to be effective when working on the Sins of the Fathers project.

## Project Overview

The Sins of the Fathers project is a web application that serves as a digital companion to a dark saga. It provides an immersive experience with detailed information about characters, factions, locations, and lore. The project is currently undergoing a strategic migration from Firebase to Sanity.io as its primary data source. This dual data source strategy is a critical aspect of the project, and AI agents should be aware of which data source is being used for each part of the application.

## Dual Data Source Strategy

The project is in the process of migrating its data management from Firebase to Sanity.io. This means that some parts of the application still fetch data from Firebase, while newer or updated sections use Sanity.io.

- **Firebase**: The original data source for the project. Some of the older components may still be using Firebase for data fetching.
- **Sanity.io**: The new, preferred data source. All new features and data models should be built using Sanity.io.

When working on a task, it's important to identify which data source is being used for the relevant part of the application. The goal is to eventually migrate all data fetching to Sanity.io.

## Frontend Architecture

The frontend is structured with a clear separation of concerns, with dedicated loaders for each type of content. These loaders are responsible for fetching data from the appropriate data source and rendering it on the page.

- **Loaders**: Located in `public/assets/js/modules/loaders`, these files handle the logic for fetching data and displaying it. Examples include `character-loader.js`, `faction-loader.js`, and `lore-loader.js`.
- **Sanity Client**: The Sanity client is configured in `lib/sanityClient.js` and is used by the loaders to fetch data from Sanity.io.
- **UI Components**: The UI is built with HTML, CSS, and JavaScript, with a focus on modular and reusable components.

## Developer Workflows

### Running the Project Locally

To run the project locally, you will need to have Node.js installed. The project uses a simple development server to serve the files.

### Builds and Deployments

The project is deployed using Firebase Hosting for the frontend and Firebase Functions for any server-side logic. The deployment process is straightforward:

- To deploy the entire project: `firebase deploy`
- To deploy only the functions: `firebase deploy --only functions`
- To deploy only the hosting: `firebase deploy --only hosting`

### Debugging

When debugging, it's important to check the browser's developer console for any errors. The project includes detailed logging to help identify issues with data fetching, authentication, and other key functions.

## Conventions and Patterns

- **Data Fetching**: All data fetching should be handled by the loaders in `public/assets/js/modules/loaders`.
- **Styling**: The project uses a combination of a custom stylesheet (`public/assets/css/style.css`) and Tailwind CSS for styling.
- **Modularity**: The JavaScript code is organized into modules to ensure a clean and maintainable codebase.

## Integration Points and Dependencies

- **Firebase**: Used for authentication, hosting, and some data storage.
- **Sanity.io**: The primary data source for content.
- **Google Analytics**: Integrated for tracking user engagement.
- **reCAPTCHA**: Used for security on forms.

By following these instructions, AI coding agents can quickly become productive and contribute effectively to the Sins of the Fathers project.
