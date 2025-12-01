export type HabitFeatureCondition = {
  field: "key" | "text_value" | "source";
  value: string;
};

export type HabitFeatureExtraction = {
  type: "array_values" | "constant" | "map_values" | "entry_value";
  mapping?: Record<string, string | number | boolean>;
  mappingFallbackTo?: string | number | boolean;
  constantValue?: number | string | boolean;
};

export type HabitFeatureRule = {
  name: string;
  conditions: HabitFeatureCondition[];
  extraction: HabitFeatureExtraction;
};

export type HabitFeature = {
  name: string;
  rules: HabitFeatureRule[];
};
