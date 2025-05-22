import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Когнитивные тесты",
  description: "Набор тестов для измерения когнитивных функций",
};

export default function TestsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
} 