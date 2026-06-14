"use client";

import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";

export function CompanyUniversitySwitcher({
  universities,
  selectedUniversityId
}: {
  universities: Array<{ id: string; name: string }>;
  selectedUniversityId?: string | null;
}) {
  const router = useRouter();

  function selectUniversity(value: string) {
    document.cookie = `unistudents_university_id=${value}; path=/; max-age=31536000; SameSite=Lax`;
    router.refresh();
  }

  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">Select university context</span>
      <select
        value={selectedUniversityId ?? ""}
        onChange={(event) => selectUniversity(event.target.value)}
        className="focus-ring min-h-9 appearance-none rounded-lg border border-line bg-white py-1 pl-3 pr-8 text-xs font-medium text-ink shadow-sm"
      >
        <option value="">All Universities</option>
        {universities.map((university) => (
          <option key={university.id} value={university.id}>{university.name}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 text-muted" size={14} />
    </label>
  );
}
