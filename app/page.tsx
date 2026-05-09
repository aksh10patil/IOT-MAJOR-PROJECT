import DashboardClient from '@/app/dashboard-client';
import { loadReadingsDataset } from '@/lib/readings-items';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const dataset = await loadReadingsDataset();

  return <DashboardClient dataset={dataset} />;
}
