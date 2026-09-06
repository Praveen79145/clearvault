import { useEffect, useState } from "react";
import Icon from "../icons.jsx";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem("cv-theme");
    const start = saved ? saved === "dark" : false;
    setDark(start);
    document.documentElement.classList.toggle("dark", start);
  }, []);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("cv-theme", next ? "dark" : "light");
  };
  return (
    <button onClick={toggle} title={dark ? "Switch to paper theme" : "Switch to ink theme"}
      className="btn btn-outline btn-sm !px-2.5" aria-label="Toggle theme">
      <Icon name={dark ? "sun" : "moon"} size={15} />
    </button>
  );
}
