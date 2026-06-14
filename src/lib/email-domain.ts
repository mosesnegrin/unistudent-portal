import type { University } from "@/lib/types";

export function getEmailDomain(email: string) {
  const normalized = email.trim().toLowerCase();
  const atIndex = normalized.lastIndexOf("@");
  return atIndex >= 0 ? normalized.slice(atIndex + 1) : "";
}

export function isEmailAllowedForUniversity(email: string, university: Pick<University, "allowed_email_domain">) {
  if (isCompanyEmail(email)) return true;
  const emailDomain = getEmailDomain(email);
  const universityDomain = university.allowed_email_domain.trim().toLowerCase();
  return emailDomain === universityDomain || emailDomain === `admin.${universityDomain}`;
}

export function isCompanyEmail(email: string) {
  return getEmailDomain(email).startsWith("unistudents");
}

export function allowedDomainMessage(university: Pick<University, "allowed_email_domain">) {
  const domain = university.allowed_email_domain.trim().toLowerCase();
  return `Use an email ending in ${domain} or admin.${domain}.`;
}
