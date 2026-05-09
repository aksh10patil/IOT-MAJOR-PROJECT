import { NextResponse } from 'next/server';

import { loadReadingsDataset } from '@/lib/readings-items';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const item = searchParams.get('item')?.trim().toLowerCase();
    const dataset = await loadReadingsDataset();
    const data = item
      ? dataset.readings.filter((reading) => reading.item.toLowerCase() === item)
      : dataset.readings;

    return NextResponse.json({
      source: dataset.source,
      data,
      items: dataset.items,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to load CSV readings.';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
