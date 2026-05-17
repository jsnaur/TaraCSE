import GenerateClient from "./GenerateClient";
import { fetchStyles, fetchGenerationStats, fetchReviewQueue } from "./actions";

export default async function AdminGeneratePage() {
  const [styles, stats, reviewQueue] = await Promise.all([
    fetchStyles(),
    fetchGenerationStats(),
    fetchReviewQueue(),
  ]);

  return <GenerateClient styles={styles} stats={stats} reviewQueue={reviewQueue} />;
}
