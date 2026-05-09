export const READING_SENSOR_KEYS = [
  'mq3',
  'mq4',
  'mq5',
  'mq135',
  'turbidity',
] as const;

export const SPOILAGE_STAGES = ['fresh', 'early', 'spoiled'] as const;

export type ReadingSensorKey = (typeof READING_SENSOR_KEYS)[number];
export type SpoilageStage = (typeof SPOILAGE_STAGES)[number];
export type ItemCategory = 'fruit' | 'vegetable' | 'curd' | 'milk';
export type ItemGroup = 'fruits' | 'vegetables' | 'dairy';

export type StageCounts = Record<SpoilageStage, number>;

export interface ReadingValues {
  mq3: number;
  mq4: number;
  mq5: number;
  mq135: number;
  turbidity: number | null;
}

export interface ReadingItemPoint extends ReadingValues {
  id: string;
  item: string;
  day: number;
  category: ItemCategory;
  group: ItemGroup;
  stage: SpoilageStage;
}

export interface ReadingItemSummary {
  name: string;
  category: ItemCategory;
  group: ItemGroup;
  sampleCount: number;
  firstDay: number;
  latestDay: number;
  latestStage: SpoilageStage;
  stageCounts: StageCounts;
}

export interface ReadingDataset {
  source: string;
  readings: ReadingItemPoint[];
  items: ReadingItemSummary[];
}

export interface SpoilageRange {
  min: number;
  max?: number;
  display: string;
}

export const SENSOR_META: Record<
  ReadingSensorKey,
  {
    label: string;
    shortLabel: string;
    unit: string;
    color: string;
  }
> = {
  mq3: {
    label: 'MQ3',
    shortLabel: 'MQ3',
    unit: 'ppm',
    color: '#22c55e',
  },
  mq4: {
    label: 'MQ4',
    shortLabel: 'MQ4',
    unit: 'ppm',
    color: '#38bdf8',
  },
  mq5: {
    label: 'MQ5',
    shortLabel: 'MQ5',
    unit: 'ppm',
    color: '#a78bfa',
  },
  mq135: {
    label: 'MQ135',
    shortLabel: 'MQ135',
    unit: 'ppm',
    color: '#f97316',
  },
  turbidity: {
    label: 'Turbidity',
    shortLabel: 'Turbidity',
    unit: 'NTU',
    color: '#14b8a6',
  },
};

export const STAGE_META: Record<
  SpoilageStage,
  {
    label: string;
    shortLabel: string;
    rank: number;
  }
> = {
  fresh: {
    label: 'Fresh',
    shortLabel: 'Fresh',
    rank: 0,
  },
  early: {
    label: 'Early Spoilage',
    shortLabel: 'Early',
    rank: 1,
  },
  spoiled: {
    label: 'Spoiled',
    shortLabel: 'Spoiled',
    rank: 2,
  },
};

export const CATEGORY_META: Record<
  ItemCategory,
  {
    label: string;
    shortLabel: string;
    tableTitle: string;
    sensors: ReadingSensorKey[];
  }
> = {
  fruit: {
    label: 'Fruit',
    shortLabel: 'Fruit',
    tableTitle: 'Recorded Values for Fruits',
    sensors: ['mq3', 'mq4', 'mq5', 'mq135'],
  },
  vegetable: {
    label: 'Vegetable',
    shortLabel: 'Vegetable',
    tableTitle: 'Recorded Values for Vegetables',
    sensors: ['mq3', 'mq4', 'mq5', 'mq135'],
  },
  curd: {
    label: 'Curd',
    shortLabel: 'Curd',
    tableTitle: 'Recorded Values for Curd',
    sensors: ['mq3', 'mq4', 'mq5', 'mq135', 'turbidity'],
  },
  milk: {
    label: 'Milk',
    shortLabel: 'Milk',
    tableTitle: 'Recorded Values for Milk',
    sensors: ['mq3', 'mq4', 'mq5', 'mq135', 'turbidity'],
  },
};

export const GROUP_META: Record<
  ItemGroup,
  {
    label: string;
    shortLabel: string;
  }
> = {
  fruits: {
    label: 'Fruits',
    shortLabel: 'Fruits',
  },
  vegetables: {
    label: 'Vegetables',
    shortLabel: 'Vegetables',
  },
  dairy: {
    label: 'Dairy',
    shortLabel: 'Dairy',
  },
};

export const GROUP_ORDER: ItemGroup[] = ['fruits', 'vegetables', 'dairy'];
export const CATEGORY_ORDER: ItemCategory[] = ['fruit', 'vegetable', 'milk', 'curd'];

const PRODUCE_SPOILAGE_INDEX: Record<
  SpoilageStage,
  Partial<Record<ReadingSensorKey, SpoilageRange>>
> = {
  fresh: {
    mq3: { min: 10, max: 50, display: '10 - 50' },
    mq4: { min: 20, max: 80, display: '20 - 80' },
    mq5: { min: 30, max: 100, display: '30 - 100' },
    mq135: { min: 50, max: 150, display: '50 - 150' },
  },
  early: {
    mq3: { min: 50, max: 150, display: '50 - 150' },
    mq4: { min: 80, max: 250, display: '80 - 250' },
    mq5: { min: 100, max: 250, display: '100 - 250' },
    mq135: { min: 150, max: 350, display: '150 - 350' },
  },
  spoiled: {
    mq3: { min: 150, max: 400, display: '150 - 400+' },
    mq4: { min: 250, max: 400, display: '250 - 400+' },
    mq5: { min: 250, max: 500, display: '250 - 500+' },
    mq135: { min: 350, max: 800, display: '350 - 800+' },
  },
};

export const SPOILAGE_INDEX: Record<
  ItemCategory,
  Record<SpoilageStage, Partial<Record<ReadingSensorKey, SpoilageRange>>>
> = {
  fruit: PRODUCE_SPOILAGE_INDEX,
  vegetable: PRODUCE_SPOILAGE_INDEX,
  curd: {
    fresh: {
      mq3: { min: 10, max: 60, display: '10 - 60' },
      mq4: { min: 20, max: 80, display: '20 - 80' },
      mq5: { min: 30, max: 100, display: '30 - 100' },
      mq135: { min: 80, max: 200, display: '80 - 200' },
      turbidity: { min: 2, max: 10, display: '2 - 10' },
    },
    early: {
      mq3: { min: 60, max: 180, display: '60 - 180' },
      mq4: { min: 80, max: 200, display: '80 - 200' },
      mq5: { min: 100, max: 250, display: '100 - 250' },
      mq135: { min: 200, max: 400, display: '200 - 400' },
      turbidity: { min: 10, max: 40, display: '10 - 40' },
    },
    spoiled: {
      mq3: { min: 180, max: 500, display: '180 - 500+' },
      mq4: { min: 200, max: 400, display: '200 - 400+' },
      mq5: { min: 250, max: 500, display: '250 - 500+' },
      mq135: { min: 400, max: 900, display: '400 - 900+' },
      turbidity: { min: 40, max: 120, display: '40 - 120+' },
    },
  },
  milk: {
    fresh: {
      mq3: { min: 5, max: 40, display: '5 - 40' },
      mq4: { min: 10, max: 60, display: '10 - 60' },
      mq5: { min: 20, max: 80, display: '20 - 80' },
      mq135: { min: 50, max: 120, display: '50 - 120' },
      turbidity: { min: 0, max: 5, display: '0 - 5' },
    },
    early: {
      mq3: { min: 40, max: 120, display: '40 - 120' },
      mq4: { min: 60, max: 150, display: '60 - 150' },
      mq5: { min: 80, max: 200, display: '80 - 200' },
      mq135: { min: 120, max: 300, display: '120 - 300' },
      turbidity: { min: 5, max: 25, display: '5 - 25' },
    },
    spoiled: {
      mq3: { min: 120, max: 300, display: '120 - 300+' },
      mq4: { min: 150, max: 350, display: '150 - 350+' },
      mq5: { min: 200, max: 400, display: '200 - 400+' },
      mq135: { min: 300, max: 700, display: '300 - 700+' },
      turbidity: { min: 25, max: 100, display: '25 - 100+' },
    },
  },
};

export const createEmptyStageCounts = (): StageCounts => ({
  fresh: 0,
  early: 0,
  spoiled: 0,
});

const FRUIT_ITEMS = new Set(['apple', 'guava', 'orange', 'papaya', 'pomegranate']);
const VEGETABLE_ITEMS = new Set(['brinjal', 'capsicum', 'cauliflower', 'potato', 'tomato']);

export const getItemCategory = (item: string): ItemCategory => {
  const normalizedItem = item.trim().toLowerCase();

  if (normalizedItem === 'curd') {
    return 'curd';
  }

  if (normalizedItem === 'milk') {
    return 'milk';
  }

  if (FRUIT_ITEMS.has(normalizedItem)) {
    return 'fruit';
  }

  if (VEGETABLE_ITEMS.has(normalizedItem)) {
    return 'vegetable';
  }

  return 'fruit';
};

export const getItemGroup = (category: ItemCategory): ItemGroup => {
  if (category === 'fruit') {
    return 'fruits';
  }

  if (category === 'vegetable') {
    return 'vegetables';
  }

  return 'dairy';
};

export const getRangeForSensor = (
  category: ItemCategory,
  stage: SpoilageStage,
  sensor: ReadingSensorKey
): SpoilageRange | null => SPOILAGE_INDEX[category][stage][sensor] ?? null;

export const getRangeLabel = (
  category: ItemCategory,
  stage: SpoilageStage,
  sensor: ReadingSensorKey
): string => getRangeForSensor(category, stage, sensor)?.display ?? '-';

export const getSensorStage = (
  category: ItemCategory,
  sensor: ReadingSensorKey,
  value: number | null
): SpoilageStage | null => {
  if (value === null || !getRangeForSensor(category, 'fresh', sensor)) {
    return null;
  }

  const spoiledStart = getRangeForSensor(category, 'spoiled', sensor)?.min;
  const earlyStart = getRangeForSensor(category, 'early', sensor)?.min;

  if (spoiledStart !== undefined && value >= spoiledStart) {
    return 'spoiled';
  }

  if (earlyStart !== undefined && value >= earlyStart) {
    return 'early';
  }

  return 'fresh';
};

export const getReadingStage = (
  readings: ReadingValues,
  category: ItemCategory
): SpoilageStage => {
  const stages = CATEGORY_META[category].sensors
    .map((sensor) => getSensorStage(category, sensor, readings[sensor]))
    .filter((stage): stage is SpoilageStage => stage !== null);

  if (stages.some((stage) => stage === 'spoiled')) {
    return 'spoiled';
  }

  if (stages.some((stage) => stage === 'early')) {
    return 'early';
  }

  return 'fresh';
};
