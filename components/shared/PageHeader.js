import { motion } from "framer-motion";

/**
 * Reusable page header with gradient background.
 * @param {string} title - Main heading text
 * @param {string} subtitle - Secondary description
 * @param {string} gradient - Tailwind gradient classes (e.g. "from-purple-600 to-pink-600")
 * @param {string} icon - Emoji or icon string
 */
export default function PageHeader({
  title,
  subtitle,
  gradient = "from-green-600 to-emerald-600",
  icon,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-r ${gradient} rounded-xl p-6 text-white shadow-lg`}
    >
      <div className="flex items-center gap-3">
        {icon && <span className="text-3xl">{icon}</span>}
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle && (
            <p className="text-sm mt-1 opacity-90">{subtitle}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
