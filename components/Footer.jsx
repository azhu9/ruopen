export default function Footer() {
  return (
    <footer className="border-t border-dashed border-gray-300 dark:border-gray-500 bg-white dark:bg-[#1b1b1b]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 py-6 sm:flex-row">
          {/* Copyright Notice */}
          <p className="text-sm text-gray-600 dark:text-gray-400">
            © {new Date().getFullYear()} RU Open
          </p>

          {/* Social & Project Links */}
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 hidden sm:block">
              Created by{" "}
              <a
                href="https://github.com/azhu9"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-gray-800 dark:text-gray-200 underline-offset-4 hover:underline"
              >
                Andy Zhu
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
