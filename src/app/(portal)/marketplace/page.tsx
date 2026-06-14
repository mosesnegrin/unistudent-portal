import { createMarketplaceItem } from "@/app/actions";
import { getSessionContext } from "@/lib/auth";
import { EmptyState, Field, PageHeader, Panel, PrimaryButton, TextArea } from "@/components/ui";

export default async function MarketplacePage() {
  const { supabase, profile } = await getSessionContext();
  const { data: items } = await supabase
    .from("marketplace_items")
    .select("id,title,description,price_cents,category")
    .eq("moderation_status", "approved")
    .eq("university_id", profile?.university_id)
    .order("created_at", { ascending: false });

  return (
    <>
      <PageHeader title="Marketplace" description="Buy and sell student items after moderation approval." />
      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <div className="space-y-3">
          {items?.length ? items.map((item) => (
            <Panel key={item.id}>
              <h2 className="font-semibold">{item.title}</h2>
              <p className="mt-1 text-sm text-muted">{item.category}</p>
              <p className="mt-3 text-sm leading-6 text-muted">{item.description}</p>
              <p className="mt-3 text-sm font-medium">{item.price_cents ? `EUR ${(item.price_cents / 100).toFixed(2)}` : "Free"}</p>
            </Panel>
          )) : <EmptyState title="No approved marketplace posts yet" description="Approved buy/sell posts will appear here." />}
        </div>
        <Panel>
          <h2 className="font-semibold">Post item</h2>
          <form action={createMarketplaceItem} className="mt-4 space-y-4">
            <Field label="Title" name="title" required />
            <TextArea label="Description" name="description" required />
            <Field label="Price in cents" name="price_cents" type="number" />
            <Field label="Category" name="category" required />
            <PrimaryButton>Submit for approval</PrimaryButton>
          </form>
        </Panel>
      </div>
    </>
  );
}
