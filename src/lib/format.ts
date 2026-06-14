export function formatCategoryLabel(value?: string | null) {
  if (!value) return "General";
  return value
    .replace(/[-_]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
