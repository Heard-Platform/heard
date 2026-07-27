import { motion } from "motion/react";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export function HamburgerMenu() {
  const { t } = useTranslation("menu");
  const [menuOpen, setMenuOpen] = useState(false);

  const menuItems = [
    { label: t("aboutHeard"), href: "https://www.heardapp.org" },
    { label: t("aboutTeam"), href: "https://www.heardapp.org/team" },
    { label: t("heardifesto"), href: "https://www.heardapp.org/heardifesto" },
    { label: t("helpSupport"), href: "https://www.heardapp.org/support" },
  ];

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
              key={item.href}
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
