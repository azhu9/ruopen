export default function Footer() {
  return (
    <footer className="px-4 pb-6 pt-16 text-center text-xs text-label-2">
      © {new Date().getFullYear()} RU Open · Made by{" "}
      <a
        href="https://github.com/azhu9"
        target="_blank"
        rel="noopener noreferrer"
        className="underline-offset-4 hover:text-label hover:underline"
      >
        Andy Zhu
      </a>
    </footer>
  );
}
