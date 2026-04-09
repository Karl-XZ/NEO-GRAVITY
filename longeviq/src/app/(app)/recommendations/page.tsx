import RecommendationsClient from './recommendations-client';

export default async function RecommendationsPage({
  searchParams,
}: {
  searchParams: Promise<{ focus?: string }>;
}) {
  const params = await searchParams;
  return <RecommendationsClient focus={params.focus} />;
}
