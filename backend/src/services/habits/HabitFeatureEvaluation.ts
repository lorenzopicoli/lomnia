import { isNil } from "lodash";
import type { Habit } from "../../models";
import type { HabitFeature, HabitFeatureCondition, HabitFeatureExtraction } from "../../models/HabitFeature";

type HabitFeatureInput = Omit<HabitFeature, "createdAt" | "updatedAt">;

export class HabitFeatureEvaluation {
  constructor(private features: HabitFeatureInput[]) {}

  public extractHabitFeatures(habit: Habit) {
    const values: {
      value: unknown;
      originalValue: unknown;
      habitFeatureId: number;
    }[] = [];
    for (const feature of this.features) {
      for (const rule of feature.rules) {
        const meetsConditions = this.evaluateConditions(habit, rule.conditions);
        if (meetsConditions) {
          values.push(...this.extractValue(habit, rule.extraction).map((v) => ({ ...v, habitFeatureId: feature.id })));
        }
      }
    }
    return values;
  }

  private evaluateConditions(habit: Habit, conditions: HabitFeatureCondition[]) {
    let meetsConditions = true;
    for (const condition of conditions) {
      switch (condition.field) {
        case "key":
          meetsConditions = condition.value.includes(habit.key);
          break;
        case "source":
          meetsConditions = condition.value.includes(habit.source);
          break;
        case "text_value": {
          const habitValues = habit.value;
          if (!Array.isArray(habitValues)) {
            meetsConditions = false;
            break;
          }
          meetsConditions = habitValues.includes(condition.value);
          break;
        }
      }
      if (!meetsConditions) {
        break;
      }
    }

    return meetsConditions;
  }

  private extractValue(habit: Habit, extraction: HabitFeatureExtraction): { value: unknown; originalValue: unknown }[] {
    switch (extraction.type) {
      case "array_values": {
        const habitValues = Array.isArray(habit.value) ? habit.value : [habit.value];
        return habitValues.map((value) => ({ value, originalValue: habitValues }));
      }
      case "constant":
        return [{ value: extraction.constantValue, originalValue: habit.value }];
      case "map_values": {
        const habitValues = Array.isArray(habit.value) ? habit.value : [habit.value];
        const mapping = extraction.mapping;
        if (!mapping) {
          return [];
        }
        return habitValues
          .map((value) => ({
            value: mapping[value] ?? (!isNil(extraction.mappingFallbackTo) ? extraction.mappingFallbackTo : null),
            originalValue: value,
          }))
          .filter((v) => !isNil(v.value));
      }
      case "entry_value": {
        return [{ value: habit.value, originalValue: habit.value }];
      }
    }
  }
}
