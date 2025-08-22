import { Search, List, CalendarDays } from "lucide-react"; // Import some icons

export default function HowTo() {

  return (
    <main className="flex flex-col bg-gray-50">
        <div className="max-w-4xl mx-auto mt-12 mb-20 px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800">
              Find a Space in 3 Easy Steps
            </h2>
            <p className="mt-2 text-md text-gray-500">
              Your next study session is just a few clicks away.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center p-6 bg-white rounded-lg border border-gray-200 shadow-lg">
              <div className="flex items-center justify-center h-16 w-16 mb-4 bg-gray-100 text-gray-400 rounded-full">
                <Search className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                1. Search a Building
              </h3>
              <p className="text-gray-600">
                Enter a building code or name. Our smart search will help you find it.
              </p>
            </div>
            <div className="flex flex-col items-center p-6 bg-white rounded-lg border border-gray-200 shadow-lg">
              <div className="flex items-center justify-center h-16 w-16 mb-4 bg-gray-100 text-gray-400 rounded-full">
                <List className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                2. Select a Room
              </h3>
              <p className="text-gray-600">
                We'll show you a list of all available rooms in that building.
              </p>
            </div>
            <div className="flex flex-col items-center p-6 bg-white rounded-lg border border-gray-200 shadow-lg">
              <div className="flex items-center justify-center h-16 w-16 mb-4 bg-gray-100 text-gray-400 rounded-full">
                <CalendarDays className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                3. View the Schedule
              </h3>
              <p className="text-gray-600">
                See the room's daily schedule to find the perfect open time slot.
              </p>
            </div>
          </div>
        </div>

    </main>
  );
}