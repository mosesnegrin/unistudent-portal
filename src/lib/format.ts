export function formatCategoryLabel(value?: string | null) {
  if (!value) return "General";
  return value
    .replace(/[-_]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function firstName(fullName?: string | null, email?: string | null) {
  const name = fullName?.trim().split(/\s+/)[0];
  if (name) return name;
  return email?.split("@")[0] || "there";
}
