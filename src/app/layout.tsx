import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import { CategoriesProvider } from "@/hooks/useCategories";

export const metadata: Metadata = {
  title: "DiaCalendar",
  description: "근무·휴가·일정을 한 눈에 관리하는 스마트 달력",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased min-h-screen">
        <AuthProvider>
          <CategoriesProvider>
            {children}
          </CategoriesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
