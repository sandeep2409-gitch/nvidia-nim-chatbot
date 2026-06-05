# Day 13: NVIDIA NIM AI Chat Workspace 🟢

Welcome to Day 13 of the 30-Days Web Apps Challenge! Today's application is a state-of-the-art, glassmorphic **AI Chat Workspace** built with React and integrated directly with the **NVIDIA NIM (Inference Microservices) API Catalog**. 

This client-side workspace allows you to run high-performance LLM models (like Llama 3.1 Nemotron 51B, Llama 70B, Gemma 2, and Mixtral) using your personal NVIDIA API key.

## 🚀 Key Features

*   **NVIDIA NIM Cloud API Integration**: Direct client-side calls to the official NVIDIA integrate endpoint (`https://integrate.api.nvidia.com/v1`).
*   **Multiple Conversation Rooms**: Create, rename, clear, and delete chat rooms. State is persistent via `localStorage`.
*   **Curated Model Selection**: Select between popular open-weights models running at peak speeds on NVIDIA hardware (e.g. `meta/llama-3.1-70b-instruct`, `nvidia/llama-3.1-nemotron-51b-instruct`, `google/gemma-2-27b-it`, etc.).
*   **Advanced Parameter Configuration**: Adjust temperature settings, select system instruction presets (Helpful Assistant, Code Wizard, Sarcastic Bot, Creative Writer), or write custom instructions.
*   **Rich Text Bubble Styling**: Distinct bubbles for user (neon gradient border) and AI responses (clean dark glassmorphism).
*   **Interactive TTS (Text-to-Speech)**: Read assistant messages out loud with a button or toggle Auto-TTS to speak responses as they complete.
*   **Custom Markdown Renderer**: Custom, lightweight Markdown parser supporting headings, inline code, tables, bullets, bold/italics, and code blocks with a functional **Copy Code** button.
*   **Export Logs**: Download full chat transcripts formatted as Markdown files.
*   **Fluid Animations**: Slide-ins, neon glowing borders, active state indicator pulses, and custom animated loading dots for AI typing states.

---

## 🛠️ Tech Stack

*   **Framework**: [React](https://react.dev/) + [Vite](https://vite.dev/)
*   **Styling**: Pure CSS (using custom HSL tokens, backdrop blurs, and keyframe animations)
*   **Icons**: [Lucide React](https://lucide.dev/)
*   **API Protocol**: OpenAI-compatible REST API

---

## 🏃 Getting Started

### Prerequisites

1.  **Node.js**: Make sure you have Node.js (version 20 or higher recommended) installed.
2.  **NVIDIA API Key**: Obtain a free API key (includes 1,000 free credits) at [build.nvidia.com](https://build.nvidia.com).

### Installation and Run

1.  Navigate into the project directory:
    ```bash
    cd "DAY 13 -- CHATBOT"
    ```
2.  Install all required dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```
4.  Open the link shown in your terminal (usually `http://localhost:5173`) in your browser.
5.  On your first visit, a settings modal will appear. Paste your **NVIDIA API Key** (`nvapi-...`) into the input field to authenticate.

---

## 🔒 Security Notice

This application is completely **frontend-only**. Your NVIDIA API key is saved locally in your browser's `localStorage` and is only transmitted directly to the secure NVIDIA API endpoint (`https://integrate.api.nvidia.com/v1`). No third-party servers are involved.
# nvidia-nim-chatbot
