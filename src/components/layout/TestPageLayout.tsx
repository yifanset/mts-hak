"use client";

import Link from "next/link";
import React from "react";

interface TestPageLayoutProps {
  title: string;
  instructionTitle?: string;
  instructions: React.ReactNode; // Can be a string or JSX for more complex instructions
  children: React.ReactNode;
  backLink?: string;
}

const TestPageLayout: React.FC<TestPageLayoutProps> = ({
  title,
  instructionTitle = "Инструкция",
  instructions,
  children,
  backLink = "/",
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 md:p-8 bg-gradient-to-b from-[#f7e5ff] to-[#f0dffb] text-gray-800">
      <div className="w-full max-w-4xl relative pb-16">
        {/* Header with gradient background */}
        <div className="absolute top-0 left-0 right-0 h-40 rounded-t-3xl -z-10 overflow-hidden">
          <div className="w-full h-full bg-gradient-to-r from-[#7e21cd] to-[#b06ae9] opacity-10"></div>
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="w-24 h-24 rounded-full bg-[#7e21cd] opacity-5 absolute -top-12 -left-12"></div>
            <div className="w-16 h-16 rounded-full bg-[#7e21cd] opacity-5 absolute top-20 right-20"></div>
          </div>
        </div>

        <div className="mb-8 pt-2">
          <Link
            href={backLink}
            className="inline-flex items-center text-[#7e21cd] hover:text-[#5f0f9f] font-medium transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            Назад на главную
          </Link>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-center">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7e21cd] to-[#b06ae9]">
            {title}
          </span>
        </h1>

        <div className="mb-8 p-8 rounded-2xl shadow-lg bg-white border border-purple-100" 
             style={{ background: 'linear-gradient(to bottom, white, #fcfaff)' }}>
          <h2 className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-[#7e21cd] to-[#b06ae9]">
            {instructionTitle}
          </h2>
          <div className="text-gray-700 leading-relaxed">
            {typeof instructions === "string" ? (
              <p className="whitespace-pre-line">{instructions}</p>
            ) : (
              instructions
            )}
          </div>
        </div>

        <div className="w-full rounded-2xl shadow-lg overflow-hidden bg-white border border-purple-100">
          {children}
        </div>
        
        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500 bg-white inline-block px-6 py-2 rounded-full shadow-sm">
            МТС Юрент — Безопасность вождения
          </p>
        </div>
      </div>
    </div>
  );
};

export default TestPageLayout; 