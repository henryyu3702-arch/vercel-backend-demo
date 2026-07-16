import "./globals.css";

export const metadata = {
  title: "Vercel Backend Demo",
  description: "A tiny login and content save demo for Vercel deployment"
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
