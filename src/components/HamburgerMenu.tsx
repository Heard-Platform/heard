import { motion } from "motion/react";
import { Menu, X } from "lucide-react";
import { useState } from "react";

interface MenuItem {
  label: string;
  href: string;
}

const menuItems: MenuItem[] = [
  { label: "About Heard", href: "https://www.heardapp.org" },
  { label: "About the Team", href: "https://www.heardapp.org/team" },
  { label: "Read the Heardifesto", href: "https://www.heardapp.org/heardifesto" },
  { label: "Help & Support", href: "https://www.heardapp.org/support" },
];

export function HamburgerMenu() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <motion.button
        onClick={() => setMenuOpen(!menuOpen)}
        className="absolute top-6 right-6 z-50 p-3 bg-white/20 backdrop-blur-md hover:bg-white/30 rounded-full transition-colors shadow-lg"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        {menuOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <Menu className="w-6 h-6 text-white" />
        )}
      </motion.button>

      {menuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="absolute top-20 right-6 z-40 bg-white rounded-2xl shadow-2xl border-2 border-white/50 py-3 min-w-[220px] overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 opacity-50" />
          {menuItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="relative block px-5 py-3 text-slate-800 hover:bg-purple-100 transition-colors font-medium"
            >
              {item.label}
            </a>
          ))}
        </motion.div>
      )}
    </>
  );
}
