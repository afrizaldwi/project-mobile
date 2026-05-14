/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#2563eb",
        secondary: "#eff6ff",
        accent: "#1e40af",
        light: "#f9fafb",
        dark: "#1f2938",
        success: "#16a34a",
        warning: "#f59e0b",
        danger: "#dc2626",
      },
      elevation: {
        sm: "2",
        md: "4",
        lg: "6",
        xl: "8",
      },
    },
  },
  plugins: [],
};
