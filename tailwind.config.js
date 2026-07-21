/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // 카카오페이 파트너센터 톤
        kakao: {
          yellow: "#FEE500", // 카카오 옐로우 (primary)
          yellowD: "#F7DE00",
          ink: "#191919", // 텍스트/다크 버튼
        },
        ink: {
          900: "#191919",
          700: "#3B3B3B",
          500: "#6B7280",
          400: "#9CA3AF",
        },
        line: "#ECEEF1",
        canvas: "#F7F8FA",
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)",
        pop: "0 10px 30px rgba(16,24,40,0.12)",
      },
      borderRadius: {
        xl: "14px",
        "2xl": "18px",
      },
    },
  },
  plugins: [],
};
