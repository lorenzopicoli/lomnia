import { Card, Text } from "@mantine/core";
import { type AllChartsProps, ChartId } from "../../charts/types";
import { CountCard } from "../../containers/Charts/CountCard";
import { HeartRateMinMaxAvg } from "../../containers/Charts/HeartRateMinMaxAvg";
import { NumberHabitCalendarHeatmap } from "../../containers/Charts/NumberHabitCalendarHeatmap";
import { PrecipitationExperienced } from "../../containers/Charts/PrecipitationExperienced";
import { RainHeatmap } from "../../containers/Charts/RainHeatmap";
import { TemperatureExperienced } from "../../containers/Charts/TemperatureExperienced";
import { cardDarkBackground } from "../../themes/mantineThemes";
import { ChartPlaceholder } from "../ChartPlaceholder/ChartPlaceholder";

interface ChartDisplayerProps extends AllChartsProps {
  chartId: ChartId;
}

export function ChartDisplayer(props: ChartDisplayerProps) {
  return (
    <Card
      bg={cardDarkBackground}
      // bg={"transparent"}
      // withBorder
      radius="md"
      w={"100%"}
      h={"100%"}
    >
      <Card.Section style={{ textAlign: "center" }} w={"100%"} pl={"md"} pt={"md"}>
        {props.title ? (
          <Text fw={"bolder"} size="sm">
            {props.title}
          </Text>
        ) : null}
      </Card.Section>
      <Card.Section flex={1} pl={"md"} pr={"md"} pb={"md"}>
        <ChartSwitcher {...props} />
      </Card.Section>
    </Card>
  );
}

function ChartSwitcher(props: ChartDisplayerProps) {
  switch (props.chartId) {
    case ChartId.HeartRateMinMaxAvg:
      return <HeartRateMinMaxAvg {...props} />;
    case ChartId.PrecipitationExperienced:
      return <PrecipitationExperienced {...props} />;
    case ChartId.TemperatureExperienced:
      return <TemperatureExperienced {...props} />;
    case ChartId.RainHeatmap:
      return <RainHeatmap {...props} />;
    case ChartId.NumberHabitCalendarHeatmap: {
      const habitKey = props.habitKey;
      if (!habitKey) {
        return <ChartPlaceholder text="Select a habit key to see data in here" />;
      }
      return <NumberHabitCalendarHeatmap {...props} habitKey={habitKey} />;
    }
    case ChartId.Count: {
      const countKey = props.countKey;
      if (!countKey) {
        return <ChartPlaceholder text="Select a count key to see data in here" />;
      }
      return <CountCard {...props} countKey={countKey} />;
    }
  }
}
