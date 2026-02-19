import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import { CategoriesProvider } from "@/hooks/useCategories";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "서교공 커뮤니티",
  description: "서울교통공사 커뮤니티",
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
            <Header />
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              {children}
            </main>
          </CategoriesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
