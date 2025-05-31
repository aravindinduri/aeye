# AEYE 👁️✨ - Intelligent Vision for a Safer Tomorrow (Next.js & Firebase Edition)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
<!-- Optional: Add other badges -->

**AEYE is a cutting-edge AI-powered public safety monitoring system built with Next.js and Firebase. It leverages Google's Gemini Pro Vision to intelligently analyze video frames, detect potential safety incidents, and provide timely, descriptive alerts to help create safer communities.**

---

## 🚀 The Vision: Beyond Surveillance, Towards Proactive Safety

Traditional surveillance often means sifting through hours of footage *after* an event. AEYE aims to change that by providing proactive insights. We believe in using advanced AI to:

*   **See with Context:** Understand scenes based on user-defined context, not just generic object detection.
*   **Alert with Clarity:** Deliver AI-generated narratives of incidents for immediate understanding.
*   **Empower Swift Action:** Provide timely information to enable faster, more informed responses.

**AEYE is about transforming video data into a tool for anticipation and mitigation.**

---

## ✨ Key Features & Capabilities

*   **Advanced AI Core:** Powered by **Google's Gemini Pro Vision API** for sophisticated multimodal understanding.
*   **Context-Aware Analysis:** Users define "Scene Context" to tailor AEYE's analysis for higher relevance.
*   **Incident Detection (Prototype Focus):**
    *   🚶 **Trespassing / Unauthorized Access**
    *   👜 **Abandoned Objects**
    *   ❓ **Suspicious Loitering/Behavior**
    *   👥 **Unusual Crowd Activity/Disturbances**
*   **Descriptive Alerts:** AI-generated textual descriptions of incidents, providing rich context alongside visual evidence (screenshots).
*   **Serverless Architecture:**
    *   Video uploads handled via **Firebase Storage**.
    *   Video processing and Gemini API interaction managed by **Firebase Functions** (or a similar backend service triggered by Firebase events).
*   **Modern Web Interface:** Built with **Next.js** and **Tailwind CSS** for a responsive and intuitive user experience to upload videos, define context, and view real-time alerts.

---

## 🛠️ Technology Stack

AEYE leverages a modern, serverless-friendly technology stack:

*   **Frontend & Backend Logic:**
    *   ![Next.js](https://img.shields.io/badge/Next.js-13+-000000?logo=nextdotjs&logoColor=white) (Full-stack React Framework - UI, API Routes)
    *   ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3+-06B6D4?logo=tailwindcss&logoColor=white)
*   **Backend Services & Infrastructure:**
    *   ![Firebase](https://img.shields.io/badge/Firebase-Full_Suite-FFCA28?logo=firebase&logoColor=black)
        *   **Firebase Storage:** For video uploads and potentially storing extracted frames.
        *   **Firebase Functions:** For server-side logic, video processing orchestration, and secure Gemini API calls.
        *   **Firestore / Realtime Database:** For storing incident metadata and enabling real-time UI updates.
*   **AI Engine:**
    *   ![Google Cloud](https://img.shields.io/badge/Google_Gemini_Pro_Vision-API-4285F4?logo=googlecloud&logoColor=white)
*   **Video Processing (within Firebase Functions or called service):**
    *   **[Specify how frames are extracted, e.g., "Google Cloud Transcoder API," "FFmpeg via custom Function layer," or "Third-party video API"]**
    *   *(If using FFmpeg in Functions, mention potential complexities or if a pre-built layer is used).*

---

## ⚙️ Getting Started (Prototype - Local Setup with Firebase Emulators)

This prototype utilizes Firebase services. For local development, using the **Firebase Emulator Suite** is highly recommended.

**Prerequisites:**

*   Node.js (LTS version recommended, includes npm/yarn)
*   Firebase CLI installed and configured: `npm install -g firebase-tools`
*   A Google Cloud Project with the Gemini API enabled and an **API Key**.
*   A Firebase Project created and configured for this application (Storage, Functions, Firestore/Realtime DB).
*   **[If your video processing in Firebase Functions relies on external tools like FFmpeg not bundled by default, specify any local setup needed for emulation, e.g., local FFmpeg installation.]**

**Setup & Run Instructions:**

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/aravindinduri/aeye.git
    ```

2.  **Configure Firebase:**
    *   Link your local project to your Firebase project: `firebase use YOUR_PROJECT_ID`
    *   Ensure your `firebase.json` is configured for Functions, Storage, and Firestore/Realtime DB.

3.  **Environment Variables (Frontend - Next.js):**
    *   Create a `.env.local` file in your Next.js project root (usually the main project root or a `frontend/` subfolder).
    *   Add your Firebase client-side configuration variables:
        ```env
        NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_FIREBASE_WEB_API_KEY
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=YOUR_PROJECT_ID.firebaseapp.com
        NEXT_PUBLIC_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=YOUR_PROJECT_ID.appspot.com
        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER_ID
        NEXT_PUBLIC_FIREBASE_APP_ID=YOUR_APP_ID
        ```

4.  **Environment Variables (Backend - Firebase Functions):**
    *   Set your `GOOGLE_API_KEY` for Gemini securely for your Firebase Functions. This is typically done via:
        ```bash
        firebase functions:config:set gemini.key="YOUR_GEMINI_API_KEY_HERE"
        # You might have other config for service accounts if calling other Google Cloud services
        ```
    *   In your Function code, you'll access this via `functions.config().gemini.key`.

5.  **Install Dependencies:**
    *   For the Next.Alt texjs app (if it's the root or in a `frontend/` folder):
        ```bash
        npm install
        # or
        # yarn install
        ```
    *   For Firebase Functions (usually in a `functions/` folder):
        ```bash
        cd functions
        npm install
        # or
        # yarn install
        cd ..
        ```

6.  **Run with Firebase Emulators (Recommended):**
    *   Start the Firebase emulators:
        ```bash
        firebase emulators:start
        ```
    *   This will typically start emulators for Auth, Functions, Firestore, Storage, etc. Note the ports they are running on.
    *   Your Next.js app will connect to these emulated services.

7.  **Run the Next.js Development Server:**
    *   In a new terminal, start the Next.js app:
        ```bash
        npm run dev
        # or
        # yarn dev
        ```
    *   The frontend app will typically run on `http://localhost:3000`.

8.  **Access the Application:**
    *   Open `http://localhost:3000` in your browser.

9.  **Using AEYE:**
    *   Upload a video file (it will go to the emulated Firebase Storage).
    *   This should trigger your Firebase Function (running in the emulator).
    *   The Function processes the video, calls Gemini, and stores results in emulated Firestore/Realtime DB.
    *   The Next.js frontend should update with the analysis results.

---

## 🗺️ Project Roadmap (High-Level)

*   **Phase 1 (Current - Prototype):** Core functionality with Next.js, Firebase (Storage, Functions, Firestore), Gemini integration for offline video file analysis.
*   **Phase 2 (Enhancements):**
    *   Optimize video processing within Firebase Functions (or integrate robust cloud video service).
    *   Refine Gemini prompt engineering.
    *   Improve UI/UX for alert management and real-time updates.
*   **Phase 3 (Future Scope):**
    *   Investigate cost-effective strategies for video processing at scale.
    *   User authentication via Firebase Auth.

---
### Demo 
[Project Demo](https://drive.google.com/file/d/1ZZXs7rJ8kM3KWij-fRgev1A_ELZFkKPG/view)
#### Screenshots
![AEYE Incident Detection UI](https://i.ibb.co/cjnM4fJ/Screenshot-from-2025-05-31-07-53-23.png)
---
