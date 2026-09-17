/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        command: {
          bg: "#0B111E",
          card: "#131C2E",
          border: "#202E48",
          accent: "#00E5FF",
          warning: "#F59E0B",
          danger: "#EF4444",
          critical: "#DC2626",
          success: "#10B981"
        }
      }
    },
  },
  plugins: [],
}
