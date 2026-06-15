import { createMarketplaceItem } from "@/app/actions";
import { getSessionContext } from "@/lib/auth";
import { formatEuro, moneyInputPattern } from "@/lib/money";
import { canCreate } from "@/lib/permissions";
import { ActionForm } from "@/components/action-form";
import { CategoryLabel } from "@/components/category-icon";
import { ProviderInfo } from "@/components/provider-info";
import { CategoryFilter, SubNav } from "@/components/subnav";
import { EmptyState, Field, PageHeader, Panel, PrimaryButton, TextArea } from "@/components/ui";

export default async function MarketplacePage({ searchParams }: { searchParams: Promise<{ tab?: string; category?: string }> }) {
  const { tab: requestedTab, category: activeCategory } = await searchParams;
  const { supabase, effectiveUniversityId, roles, user } = await getSessionContext();
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
    .eq("university_id", effectiveUniversityId)
    .or(activeTab === "mine" ? "id.not.is.null" : `auto_delete_at.is.null,auto_delete_at.gt.${new Date().toISOString()}`)
    .order("created_at", { ascending: false });
  const categories = (items ?? []).map((item) => item.category).filter(Boolean);
  const filteredItems = activeCategory ? (items ?? []).filter((item) => item.category === activeCategory) : (items ?? []);

  return (
    <>
      <PageHeader
        title="Marketplace"
        description="Marketplace posts are not organized by UniStudents or the university. UniStudents and the university are not responsible for items sold, bought, exchanged, or communicated about here."
      />
      <SubNav items={nav} active={activeTab} />
      {activeTab !== "create" ? <CategoryFilter basePath="/marketplace" categories={categories} activeCategory={activeCategory} activeTab={activeTab} /> : null}
      <div className={activeTab === "create" ? "mx-auto max-w-2xl" : "grid gap-4 lg:grid-cols-[1fr_380px]"}>
        <div className="space-y-3">
          {activeTab !== "create" && filteredItems?.length ? filteredItems.map((item) => (
            <Panel key={item.id}>
              <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
                <div>
                  <h2 className="text-base font-semibold">{item.title}</h2>
                  <div className="mt-2"><CategoryLabel category={item.category} /></div>
                  <p className="mt-3 text-sm leading-6 text-muted">{item.description}</p>
                  <p className="mt-3 text-sm font-medium">{formatEuro(item.price_cents)}</p>
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
            <ActionForm action={createMarketplaceItem} successMessage="Marketplace item published successfully." resetOnSuccess className="mt-4 space-y-4">
              <Field label="Title" name="title" required />
              <TextArea label="Description" name="description" required />
              <Field label="Price" name="price_cents" placeholder="5 or 5,30" pattern={moneyInputPattern} inputMode="decimal" title="Use whole euros like 5 or euros and cents like 5,30." />
              <Field label="Category" name="category" required />
              <Field label="Auto-delete deadline" name="auto_delete_at" type="datetime-local" />
              <PrimaryButton>Publish item</PrimaryButton>
            </ActionForm>
          </Panel>
        ) : null}
      </div>
    </>
  );
}
