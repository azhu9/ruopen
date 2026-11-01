export default function Footer() {
  return (
    <footer className="px-4 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-16 text-center text-xs text-label-3">
      © {new Date().getFullYear()} RU Open · Made by{" "}
      <a
        href="https://github.com/azhu9"
        target="_blank"
        rel="noopener noreferrer"
        className="text-label-2 underline-offset-4 hover:underline"
      >
        Andy Zhu
      </a>
    </footer>
  );
}
