import Link from "next/link";
import { TEST_BANK } from "@/types";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="purple-gradient text-white py-16 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-10 md:mb-0 md:w-1/2">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Проверка готовности<br />
                к поездке
              </h1>
              <p className="text-lg mb-8">
                Пройдите быстрый тест для оценки внимательности перед арендой самоката
              </p>
              <Link 
                href="/tests/scooter-readiness" 
                className="inline-block bg-black text-white px-6 py-3 rounded-md font-semibold hover:bg-gray-800 transition"
              >
                НАЧАТЬ ПРОВЕРКУ
              </Link>
            </div>
            <div className="md:w-1/2 relative" style={{minHeight: "300px"}}>
              <div 
                className="absolute inset-0 bg-contain bg-no-repeat bg-center" 
                style={{backgroundImage: "url('https://urent.ru/images/tild3136-3061-4139-b039-613632346663__samokat_01.png')"}}
              ></div>
            </div>
          </div>
        </div>
      </section>


      {/* Tests Section */}
      <main className="flex flex-col items-center py-16 px-8 bg-[#f7e5ff]">
        <h2 className="text-3xl md:text-4xl font-bold mb-8 text-[#7e21cd]">Доступные тесты</h2>
        <p className="text-lg mb-10 text-center max-w-2xl">
          Выберите один из наших когнитивных тестов для проверки вашей готовности к поездке
        </p>
        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-2 max-w-5xl">
          {TEST_BANK.map((test) => (
            <Link 
              key={test.id}
              href={test.path} 
              className="p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow flex flex-col h-full"
            >
              <h3 className="text-xl font-semibold mb-3 text-[#7e21cd]">{test.name}</h3>
              <p className="text-gray-700 mb-4 flex-grow">
                {test.description}
              </p>
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">Время: {test.duration}</p>
                <span className="text-[#7e21cd] font-medium">Пройти тест →</span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
