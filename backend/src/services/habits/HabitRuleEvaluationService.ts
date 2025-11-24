import type { Habit } from "../../models";

interface HabitEvaluationCondition {
  field: "key" | "text_value" | "source";
  // operator: 'in'
  value: string[];
}

interface HabitEvaluationExtraction {
  /**
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
  type: "array_values" | "constant" | "map_values" | "entry_value";
  mapping?: Record<string, string>;
  constantValue?: number | string | boolean;
}

interface HabitCategoryRule {
  name: string;
  conditions: HabitEvaluationCondition[];
  extraction: HabitEvaluationExtraction;
}

interface HabitCategory {
  name: string;
  rules: HabitCategoryRule[];
}

const mockCategories: HabitCategory[] = [
  // {
  //   name: "meal-components",
  //   rules: [
  //     {
  //       name: "Extract meal components",
  //       conditions: [
  //         {
  //           field: "key",
  //           value: ["Breakfast", "Lunch", "Dinner", "Snack"],
  //         },
  //       ],
  //       extraction: {
  //         type: "array_values",
  //       },
  //     },
  //   ],
  // },
  // {
  //   name: "mood-positive-negative",
  //   rules: [
  //     {
  //       name: "Extract moods",
  //       conditions: [
  //         {
  //           field: "key",
  //           value: ["Mood"],
  //         },
  //       ],
  //       extraction: {
  //         type: "map_values",
  //         mapping: {
  //           Happy: "positive",
  //           Anxious: "negative",
  //         },
  //       },
  //     },
  //   ],
  // },
  {
    name: "felt_anxious",
    rules: [
      {
        name: "Extract moods",
        conditions: [
          {
            field: "key",
            value: ["Mood"],
          },
          {
            field: "text_value",
            value: ["Anxious"],
          },
        ],
        extraction: {
          type: "constant",
          constantValue: true,
        },
      },
    ],
  },
];

export namespace HabitEvaluationService {
  export function evaluateEntry(habit: Habit) {
    const categories = mockCategories;

    for (const category of categories) {
      for (const rule of category.rules) {
        let meetsConditions = true;
        for (const condition of rule.conditions) {
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
                break;
              }
              meetsConditions = condition.value.some((v) => habitValues.includes(v));
              break;
            }
          }
          if (!meetsConditions) {
            break;
          }
        }
        if (meetsConditions) {
          console.log("Habit", habit);
          switch (rule.extraction.type) {
            case "array_values": {
              const habitValues = Array.isArray(habit.value) ? habit.value : [habit.value];
              // console.log("Extracting (array values)", habit.value);
              for (const v of habitValues) {
                console.log(`Category name: ${category.name}, Extracted Value: ${v}, metadata: {}`);
              }
              break;
            }
            case "constant":
              // console.log("Extracting (constant)", rule.extraction.constantValue);
              console.log(
                `Category name: ${category.name}, Extracted Value: ${rule.extraction.constantValue}, metadata: {}`,
              );
              break;
            case "map_values": {
              const habitValues = Array.isArray(habit.value) ? habit.value : [habit.value];
              for (const habitValue of habitValues) {
                if (rule.extraction.mapping?.[habitValue]) {
                  // console.log("Extracting (mapped values)", rule.extraction.mapping?.[habitValue]);
                  console.log(
                    `Category name: ${category.name}, Extracted Value: ${rule.extraction.mapping?.[habitValue]}, metadata: {}`,
                  );
                }
              }
              break;
            }
            case "entry_value": {
              // console.log("Extracting (entry value)", habit.value);
              console.log(`Category name: ${category.name}, Extracted Value: ${habit.value}, metadata: {}`);
              break;
            }

            default:
              break;
          }
        }
      }
    }
  }
}
