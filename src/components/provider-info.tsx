type Provider = {
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  user_roles?: Array<{ roles?: { name?: string } | { name?: string }[] | null }> | null;
} | null;

function hasAdminRole(provider: Provider) {
  return Boolean(
    provider?.user_roles?.some((item) => {
      const role = item.roles;
      const name = Array.isArray(role) ? role[0]?.name : role?.name;
      return name === "university_admin" || name === "super_admin";
    })
  );
}

export function ProviderInfo({
  provider,
  label = "Offered by",
  official = false
}: {
  provider: Provider;
  label?: string;
  official?: boolean;
}) {
  const isOfficial = official || hasAdminRole(provider);
  const name = isOfficial ? "Official / Admin" : provider?.full_name || provider?.email || "Unknown provider";
  const email = provider?.email;
  const phone = provider?.phone;

  return (
    <aside className="rounded-lg bg-surface p-3 text-sm lg:min-w-56">
      <p className="text-xs font-medium uppercase text-muted">{label}</p>
      <p className="mt-2 font-semibold">{name}</p>
      {email ? <p className="mt-1 break-all text-muted">{email}</p> : null}
      {phone ? <p className="mt-1 text-muted">{phone}</p> : null}
    </aside>
  );
}
