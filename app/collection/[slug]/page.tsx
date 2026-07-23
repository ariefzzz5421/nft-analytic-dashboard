import { CollectionDetailPage } from "@/components/collection/CollectionDetailPage";
import { parseSupportedChain } from "@/lib/chains";

type CollectionPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ chain?: string | string[] }>;
};

export default async function CollectionPage({ params, searchParams }: CollectionPageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const chainValue = Array.isArray(query.chain) ? query.chain[0] : query.chain;

  return (
    <CollectionDetailPage
      chain={parseSupportedChain(chainValue)}
      slug={decodeURIComponent(slug)}
    />
  );
}
