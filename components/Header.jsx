import { LuBuilding2 } from "react-icons/lu";

export default function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200 m-8 max-w-5xl lg:mx-auto rounded-full ">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <LuBuilding2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">RU Open</h1>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
