# 🏥 DocPilot: Next-Generation AI-Powered Healthcare Ecosystem

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-12.1-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Gemini AI](https://img.shields.io/badge/Google-Gemini_AI-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)

**DocPilot** is a sophisticated, multi-tenant medical platform designed to bridge the gap between clinical intelligence and operational excellence. Built with a focus on eradicating physician burnout, it leverages cutting-edge AI to automate administrative burdens, providing doctors with real-time diagnostic support while ensuring a seamless, secure experience for patients.

---

## ✨ Key Features

### 👨‍⚕️ For Healthcare Providers
- **Smart OPD Manager**: Intelligent queuing and automated triage system to eliminate waiting room chaos.
- **AI Clinical Scribe**: Real-time structured medical note generation powered by Google Gemini AI.
- **Advanced Diagnostics**: AI-driven clinical decision support that flags contraindications and suggests evidence-based pathways.
- **Integrated Analytics**: Deep-dive insights into practice performance and patient outcomes with interactive data visualization.
- **Comprehensive EHR**: A robust document workflow for managing medical records, prescriptions, and lab orders.

### 👤 For Patients
- **Effortless Booking**: Intuitive appointment scheduling with real-time doctor availability.
- **Telehealth & Consultations**: Integrated video calls for remote care, featuring live transcription.
- **Personal Health Archive**: Secure access to medical records, prescriptions, and billing history.
- **Smart Reminders**: Automated follow-up alerts and health notifications.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | [React 19](https://react.dev/) |
| **Build Tool** | [Vite](https://vitejs.dev/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) |
| **Backend & Auth** | [Firebase](https://firebase.google.com/) |
| **Database** | Cloud Firestore |
| **AI Integration** | [Google Gemini API](https://ai.google.dev/) |
| **Animations** | [Motion (Framer Motion)](https://motion.dev/) |
| **Charts** | [Recharts](https://recharts.org/) |
| **Icons** | [Lucide React](https://lucide.dev/) |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0 or higher
- **Firebase Account**: Cloud Firestore and Firebase Auth enabled
- **Gemini API Key**: For AI features

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/docpilot.git
   cd docpilot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory and add your credentials (refer to `.env.example`):
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_GOOGLE_GENAI_KEY=your_gemini_key
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:3000`.

---

## 📋 Available Scripts

- `npm run dev`: Starts the Vite development server.
- `npm run build`: Compiles the application for production.
- `npm run preview`: Previews the production build locally.
- `npm run lint`: Runs TypeScripts checks to ensure code quality.

---

## 🛡️ Security & Privacy

DocPilot is designed with security as a core principle:
- **HIPAA Compliance Readiness**: Built to adhere to strict healthcare data regulations.
- **End-to-End Encryption**: Secure transmission of sensitive patient information.
- **Multi-Tenant Isolation**: Rigorous data separation between different practices and user roles.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Built with ❤️ by <b>Saksham</b> | <i>DocPilot - Reimagining Healthcare for Everyone.</i>
</p>
