import { integer, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { habitsTable } from "./Habit";

// Zod schemas for JSONB validation
export const habitFeatureConditionSchema = z.object({
  /**
   * The field that the condition is referring to.
   * Example: source (key='breakfast', text_value=['eggs', 'bacon'], source='hares')
   */
  field: z.enum(["key", "text_value", "source"]),
  /**
   * The value to compare against the field. Since all support fields are string, right now I compare against string only
   */
  value: z.array(z.string()),
});

export type HabitFeatureCondition = z.infer<typeof habitFeatureConditionSchema>;

export const habitFeatureExtractionSchema = z.object({
  /**
   * Defines the type of extraction that is done if the condition is a match
   *
   * array_values: expand the array value. Eg. ['a', 'b', 'c'] become three entries
   * for each array value
   *
   * constant: set a constant value
   *
   * map_values: map values to a different one. Eg. ['a', 'b', 'c'] can be mapped to
   * (is_vowel):
   * {
   *   'a': true,
   *   'b': false,
   *   'c': false
   * }
   *
   * entry_value: grab whatever value is in the entry value
   */
  type: z.enum(["array_values", "constant", "map_values", "entry_value"]),
  /**
   * Depending on the evaluation type, it might require a mapping (usually to categorize text entries).
   */
  mapping: z.record(z.string(), z.string().or(z.number())).optional(),
  /**
   * If couldn't map a value using the mapping dictionary, fall back to a value
   */
  mappingFallbackTo: z.string().or(z.number()).optional(),
  /**
   * Constant value to set instead of extracting anything
   */
  constantValue: z.union([z.number(), z.string(), z.boolean()]).optional(),
});
export type HabitFeatureExtraction = z.infer<typeof habitFeatureExtractionSchema>;

export const habitFeatureRuleSchema = z.object({
  /**
   * The name of the rule. Only used to display to the user
   */
  name: z.string(),
  /**
   * A list of conditions that should all match to match the
   */
  conditions: z.array(habitFeatureConditionSchema),
  /**
   * What do extract from the habit if all conditions are true
   */
  extraction: habitFeatureExtractionSchema,
});

export const habitFeatureSchema = z.object({
  /**
   * The name of the feature that is being evaluated
   */
  name: z.string(),
  /**
   * A list of rules that compose this feature. Each rule has conditions that must all be true to extract the value
   * Having a list of rules effectivelly gives the ability to do "OR" conditions
   */
  rules: z.array(habitFeatureRuleSchema),
});

// Drizzle table definitions
export const habitFeaturesTable = pgTable("habit_features", {
  id: serial("id").primaryKey(),
  /**
   * The name of the feature that is being evaluated
   */
  name: text("name"),
  /**
   * A list of rules that compose this feature. Each rule has conditions that must all be true to extract the value
   * Having a list of rules effectivelly gives the ability to do "OR" conditions
   */
  rules: jsonb("rules").$type<z.infer<typeof habitFeatureRuleSchema>[]>().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const extractedHabitFeaturesTable = pgTable("extracted_habit_features", {
  id: serial("id").primaryKey(),
  habitFeatureId: integer("habit_feature_id")
    .references(() => habitFeaturesTable.id)
    .notNull(),
  habitId: integer("habit_id")
    .references(() => habitsTable.id)
    .notNull(),
  value: jsonb("value").$type<string | number | boolean | string[]>().notNull(),
  originalValue: jsonb("original_value").$type<string | number | boolean | string[]>().notNull(),
  /**
   * The date at which the habit started, inclusive and in UTC
   */
  startDate: timestamp("start_date").notNull(),
  /**
   * The date at which the habit ended, inclusive and in UTC
   */
  endDate: timestamp("end_date").notNull(),

  /**
   * Timezone where the habit was recorded
   */
  timezone: text("timezone").notNull(),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

// Create Zod schemas for insert/select with JSONB validation
export const insertHabitFeatureSchema = createInsertSchema(habitFeaturesTable, {
  rules: z.array(habitFeatureRuleSchema),
});

export const selectHabitFeatureSchema = createSelectSchema(habitFeaturesTable, {
  rules: z.array(habitFeatureRuleSchema),
});

export const insertExtractedHabitFeatureSchema = createInsertSchema(extractedHabitFeaturesTable, {
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
  originalValue: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
});

export const selectExtractedHabitFeatureSchema = createSelectSchema(extractedHabitFeaturesTable, {
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
  originalValue: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
});

// Type exports
export type HabitFeature = typeof habitFeaturesTable.$inferSelect;
export type NewHabitFeature = typeof habitFeaturesTable.$inferInsert;

export type ExtractedHabitFeature = typeof extractedHabitFeaturesTable.$inferSelect;
export type NewExtractedHabitFeature = typeof extractedHabitFeaturesTable.$inferInsert;

// Zod-validated types
export type ValidatedHabitFeature = z.infer<typeof selectHabitFeatureSchema>;
export type ValidatedNewHabitFeature = z.infer<typeof insertHabitFeatureSchema>;

export type ValidatedExtractedHabitFeature = z.infer<typeof selectExtractedHabitFeatureSchema>;
export type ValidatedNewExtractedHabitFeature = z.infer<typeof insertExtractedHabitFeatureSchema>;

// Validation helper functions
export function validateHabitFeature(data: unknown): ValidatedHabitFeature {
  return selectHabitFeatureSchema.parse(data);
}

export function validateNewHabitFeature(data: unknown): ValidatedNewHabitFeature {
  return insertHabitFeatureSchema.parse(data);
}

export function validateExtractedHabitFeature(data: unknown): ValidatedExtractedHabitFeature {
  return selectExtractedHabitFeatureSchema.parse(data);
}

export function validateNewExtractedHabitFeature(data: unknown): ValidatedNewExtractedHabitFeature {
  return insertExtractedHabitFeatureSchema.parse(data);
}
