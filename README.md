# The Sins of the Fathers - Website

This is the official website for the upcoming novel, "The Sins of the Fathers." It serves as a landing page to create anticipation and gather a mailing list of interested readers.

## Overview

The website is a static page with a countdown timer to the book's release and an email subscription form. It is built with modern web technologies and hosted on Firebase.

## Features

*   **Countdown Timer:** A dynamic countdown timer to the book's release date.
*   **Email Subscription:** A form to collect email addresses of interested readers, integrated with a backend service.
*   **Responsive Design:** The website is designed to be fully responsive and accessible on all devices.
*   **Animated Background:** A subtle, animated background to create an immersive experience.

## Technologies Used

*   **Hosting:** Firebase Hosting
*   **Backend:** Firebase Functions (for email subscription)
*   **Database:** Firestore (for storing email addresses)
*   **Styling:** Tailwind CSS with a custom configuration.
*   **JavaScript Libraries:**
    *   **tsparticles:** For the animated particle background.
    *   **Sanity.io client:** For potential future integration with the Sanity.io headless CMS.
*   **Analytics:** Google Tag Manager, Google Analytics, Microsoft Clarity

## Project Structure

The project is organized as follows:

```
.
├── firebase-import/      # Scripts for importing data into Firebase
├── functions/            # Firebase Functions for backend logic
├── lib/                  # Shared libraries and utilities
├── public/               # The public-facing website files
│   ├── assets/           # Images, CSS, and JavaScript files
│   ├── pages/            # Additional HTML pages
│   ├── 404.html          # Custom 404 page
│   ├── index.html        # The main landing page
│   └── ...
├── .firebaserc           # Firebase project configuration
├── firebase.json         # Firebase hosting and functions configuration
├── package.json          # Project dependencies and scripts
└── ...
```

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

*   Node.js and npm installed.
*   Firebase CLI installed and configured.

### Installation

1.  Clone the repo
    ```sh
    git clone https://github.com/your_username_/your_project_name.git
    ```
2.  Install NPM packages
    ```sh
    npm install
    ```
3.  (Optional) Set up a local Firebase environment using the Firebase Emulator Suite.

### Running Locally

To run the website locally, you can use the Firebase Emulator Suite:

```sh
firebase emulators:start
```

This will start a local server, and you can view the website at `http://localhost:5000`.

## Deployment

The website is automatically deployed to Firebase Hosting when changes are pushed to the `main` branch, using GitHub Actions.

To deploy manually, use the Firebase CLI:

```sh
firebase deploy
```

## Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".

Don't forget to give the project a star! Thanks again!
