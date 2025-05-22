import type { Metadata } from "next";
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import "./globals.css";
import { TestResultsProvider } from "@/context/TestResultsContext";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Тест готовности к поездке на самокате",
  description: "Быстрый инструмент для самопроверки перед арендой электросамоката",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="antialiased">
        <header className="sticky top-0 z-50 w-full bg-white shadow-sm py-4 px-4 md:px-8">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <Link href="/" className="flex items-center">
              <Image 
                src="https://urent.ru/images/tild3837-3065-4532-b631-313830646236__logo_black.svg" 
                alt="Юрент" 
                className="h-8"
                width={80} 
                height={32}
              />
            </Link>
            <nav className="hidden md:flex space-x-6">
              <Link 
                href="/tests/scooter-readiness" 
                className="text-gray-700 hover:text-[#7e21cd] transition font-medium"
              >
                Проверка готовности
              </Link>
              <Link 
                href="/results" 
                className="text-gray-700 hover:text-[#7e21cd] transition font-medium"
              >
                {/* Результаты */}
              </Link>
            </nav>
            <Link 
              href="/tests/scooter-readiness" 
              className="bg-[#7e21cd] text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-[#5f0f9f] transition"
            >
              НАЧАТЬ ТЕСТ
            </Link>
          </div>
        </header>
        <TestResultsProvider>
          {children}
        </TestResultsProvider>
      </body>
    </html>
  );
}