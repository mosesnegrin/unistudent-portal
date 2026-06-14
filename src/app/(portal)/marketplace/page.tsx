import { createMarketplaceItem } from "@/app/actions";
import { getSessionContext } from "@/lib/auth";
import { canCreate } from "@/lib/permissions";
import { ProviderInfo } from "@/components/provider-info";
import { SubNav } from "@/components/subnav";
import { EmptyState, Field, PageHeader, Panel, PrimaryButton, TextArea } from "@/components/ui";

export default async function MarketplacePage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab: requestedTab } = await searchParams;
  const { supabase, profile, roles, user } = await getSessionContext();
  const canCreateItem = canCreate(roles, "marketplace");
  const activeTab = requestedTab === "mine" || (requestedTab === "create" && canCreateItem) ? requestedTab : "all";
  const nav = [
    { href: "/marketplace", label: "All items" },
    { href: "/marketplace?tab=mine", label: "My marketplace posts" },
    ...(canCreateItem ? [{ href: "/marketplace?tab=create", label: "Sell item" }] : [])
  ];
  const { data: items } = await supabase
    .from("marketplace_items")
    .select("id,title,description,price_cents,category,profiles(full_name,email,phone)")
    .eq(activeTab === "mine" ? "seller_id" : "moderation_status", activeTab === "mine" ? user.id : "approved")
    .eq("university_id", profile?.university_id)
    .or(activeTab === "mine" ? "id.not.is.null" : `auto_delete_at.is.null,auto_delete_at.gt.${new Date().toISOString()}`)
    .order("created_at", { ascending: false });

  return (
    <>
      <PageHeader title="Marketplace" description="Buy and sell student items after moderation approval." />
      <SubNav items={nav} active={activeTab} />
      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <div className="space-y-3">
          {activeTab !== "create" && items?.length ? items.map((item) => (
            <Panel key={item.id}>
              <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
                <div>
                  <h2 className="font-semibold">{item.title}</h2>
                  <p className="mt-1 text-sm text-muted">{item.category}</p>
                  <p className="mt-3 text-sm leading-6 text-muted">{item.description}</p>
                  <p className="mt-3 text-sm font-medium">{item.price_cents ? `EUR ${(item.price_cents / 100).toFixed(2)}` : "Free"}</p>
                </div>
                <ProviderInfo provider={item.profiles as never} label="Posted by" />
              </div>
              <details className="mt-4 rounded-lg bg-surface p-3 text-sm">
                <summary className="cursor-pointer font-medium">Contact seller</summary>
                <ProviderInfo provider={item.profiles as never} label="Seller contact" />
              </details>
            </Panel>
          )) : activeTab !== "create" ? <EmptyState title="No marketplace posts found" description="Marketplace posts for this view will appear here." /> : null}
        </div>
        {activeTab === "create" && canCreateItem ? (
          <Panel>
            <h2 className="font-semibold">Post item</h2>
            <form action={createMarketplaceItem} className="mt-4 space-y-4">
              <Field label="Title" name="title" required />
              <TextArea label="Description" name="description" required />
              <Field label="Price in cents" name="price_cents" type="number" />
              <Field label="Category" name="category" required />
              <Field label="Auto-delete deadline" name="auto_delete_at" type="datetime-local" />
              <PrimaryButton>Submit for approval</PrimaryButton>
            </form>
          </Panel>
        ) : null}
      </div>
    </>
  );
}
