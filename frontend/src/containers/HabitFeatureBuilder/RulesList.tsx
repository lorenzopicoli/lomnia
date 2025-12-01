import { Accordion } from "@mantine/core";
import { RuleItem } from "./RuleItem";
import type { HabitFeatureRule } from "./types";

export function RulesList(props: {
  rules: HabitFeatureRule[];
  onRuleChanged: (newRule: HabitFeatureRule, index: number) => void;
  onRuleRemoved: (index: number) => void;
}) {
  return (
    <Accordion defaultValue={"rule-0"}>
      {props.rules.map((rule, i) => (
        <RuleItem
          // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
          key={`rule-${i}`}
          rule={rule}
          index={i}
          onRuleChanged={props.onRuleChanged}
          onRuleRemoved={props.onRuleRemoved}
        />
      ))}
    </Accordion>
  );
}
