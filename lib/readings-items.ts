import { readFile } from 'node:fs/promises';
import path from 'node:path';

import {
  CATEGORY_ORDER,
  GROUP_ORDER,
  createEmptyStageCounts,
  getItemCategory,
  getItemGroup,
  getReadingStage,
  STAGE_META,
  type ReadingDataset,
  type ReadingItemPoint,
  type ReadingItemSummary,
  type ReadingValues,
} from '@/lib/spoilage-index';

const CSV_FILE_NAME = 'READINGS_ITEMS.csv';

const toNumber = (value: string | undefined): number | null => {
  const numberValue = Number(value?.trim());
  return Number.isFinite(numberValue) ? numberValue : null;
};

const createHeaderIndex = (headerLine: string): Map<string, number> => {
  const headers = headerLine
    .replace(/^\uFEFF/, '')
    .split(',')
    .map((header) => header.trim().toLowerCase());

  return headers.reduce((index, header, position) => {
    if (header) {
      index.set(header, position);
    }

    return index;
  }, new Map<string, number>());
};

const cell = (
  row: string[],
  headerIndex: Map<string, number>,
  header: string
): string | undefined => {
  const position = headerIndex.get(header);
  return position === undefined ? undefined : row[position];
};

const buildItemSummaries = (
  readings: ReadingItemPoint[]
): ReadingItemSummary[] => {
  const groupedReadings = readings.reduce((groups, reading) => {
    const group = groups.get(reading.item) ?? [];
    group.push(reading);
    groups.set(reading.item, group);
    return groups;
  }, new Map<string, ReadingItemPoint[]>());

  const summaries = Array.from(groupedReadings.entries()).map(
    ([name, itemReadings]) => {
      const sortedReadings = [...itemReadings].sort((a, b) => a.day - b.day);
      const firstReading = sortedReadings[0];
      const latestReading = sortedReadings[sortedReadings.length - 1];
      const stageCounts = createEmptyStageCounts();

      sortedReadings.forEach((reading) => {
        stageCounts[reading.stage] += 1;
      });

      return {
        name,
        category: firstReading.category,
        group: firstReading.group,
        sampleCount: sortedReadings.length,
        firstDay: firstReading.day,
        latestDay: latestReading.day,
        latestStage: latestReading.stage,
        stageCounts,
      };
    }
  );

  return summaries.sort((a, b) => {
    const groupDifference = GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group);

    if (groupDifference !== 0) {
      return groupDifference;
    }

    const categoryDifference =
      CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category);

    if (categoryDifference !== 0) {
      return categoryDifference;
    }

    const stageDifference =
      STAGE_META[b.latestStage].rank - STAGE_META[a.latestStage].rank;

    if (stageDifference !== 0) {
      return stageDifference;
    }

    return a.name.localeCompare(b.name);
  });
};

export async function loadReadingsDataset(): Promise<ReadingDataset> {
  const csvPath = path.join(process.cwd(), CSV_FILE_NAME);
  const csv = await readFile(csvPath, 'utf8');
  const lines = csv.split(/\r?\n/);
  const headerIndex = createHeaderIndex(lines[0] ?? '');

  const readings = lines.slice(1).reduce<ReadingItemPoint[]>((rows, line) => {
    if (!line.trim()) {
      return rows;
    }

    const row = line.split(',');
    const item = cell(row, headerIndex, 'item')?.trim().replace(/^\uFEFF/, '');
    const day = toNumber(cell(row, headerIndex, 'day'));
    const mq3 = toNumber(cell(row, headerIndex, 'mq3'));
    const mq4 = toNumber(cell(row, headerIndex, 'mq4'));
    const mq5 = toNumber(cell(row, headerIndex, 'mq5'));
    const mq135 = toNumber(cell(row, headerIndex, 'mq135'));
    const turbidity = toNumber(cell(row, headerIndex, 'turbidity'));

    if (!item || day === null || mq3 === null || mq4 === null || mq5 === null || mq135 === null) {
      return rows;
    }

    const category = getItemCategory(item);
    const group = getItemGroup(category);
    const values: ReadingValues = {
      mq3,
      mq4,
      mq5,
      mq135,
      turbidity,
    };

    rows.push({
      id: `${item.toLowerCase()}-${day}`,
      item,
      day,
      category,
      group,
      stage: getReadingStage(values, category),
      ...values,
    });

    return rows;
  }, []);

  readings.sort((a, b) => {
    const itemDifference = a.item.localeCompare(b.item);
    return itemDifference === 0 ? a.day - b.day : itemDifference;
  });

  return {
    source: CSV_FILE_NAME,
    readings,
    items: buildItemSummaries(readings),
  };
}
