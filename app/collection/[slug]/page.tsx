import { CollectionDetailPage } from "@/components/collection/CollectionDetailPage";

type CollectionPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { slug } = await params;

  return <CollectionDetailPage slug={decodeURIComponent(slug)} />;
}
