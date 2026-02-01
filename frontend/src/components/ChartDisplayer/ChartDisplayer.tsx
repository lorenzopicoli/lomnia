import { Card, Text } from "@mantine/core";
import { type AllChartsProps, ChartId, chartDisplayerOptions } from "../../charts/types";
import { CitiesVisitedBar } from "../../containers/Charts/CitiesVisitedBar";
import { CitiesVisitedPie } from "../../containers/Charts/CitiesVisitedPie";
import { CountCard } from "../../containers/Charts/CountCard";
import { CountriesVisitedBar } from "../../containers/Charts/CountriesVisitedBar";
import { CountriesVisitedMap } from "../../containers/Charts/CountriesVisitedMap";
import { CountriesVisitedPie } from "../../containers/Charts/CountriesVisitedPie";
import { HeartRateMinMaxAvg } from "../../containers/Charts/HeartRateMinMaxAvg";
import { MostVisitedHostsPie } from "../../containers/Charts/MostVisitedHostsPie";
import { MostVisitedWebPagesBar } from "../../containers/Charts/MostVisitedWebPagesBar";
import { MostVisitedWebPagesPie } from "../../containers/Charts/MostVisitedWebPagesPie";
import { NumberHabitCalendarHeatmap } from "../../containers/Charts/NumberHabitCalendarHeatmap";
import { PlacesVisitCountBar } from "../../containers/Charts/PlacesVisitCountBar";
import { PrecipitationExperienced } from "../../containers/Charts/PrecipitationExperienced";
import { RainHeatmap } from "../../containers/Charts/RainHeatmap";
import { TemperatureExperienced } from "../../containers/Charts/TemperatureExperienced";
import { TextHabitBar } from "../../containers/Charts/TextHabitBar";
import { TextHabitCoocurrencesChord } from "../../containers/Charts/TextHabitCoocurrencesChord";
import { WebsiteNavigationFlowChord } from "../../containers/Charts/WebsitesNavigationFlowChord";
import { WebsitesVisitsCalendarHeatmap } from "../../containers/Charts/WebsitesVisitsCalendarHeatmap";
import { cardDarkBackground } from "../../themes/mantineThemes";
import { ChartPlaceholder } from "../ChartPlaceholder/ChartPlaceholder";

interface ChartDisplayerProps extends AllChartsProps {
  chartId: ChartId;
}

export function ChartDisplayer(props: ChartDisplayerProps) {
  if (!chartDisplayerOptions[props.chartId]) {
    return <ChartPlaceholder noBg text={`Couldn't find the chart for "${props.chartId}"`} />;
  }
  const { componentHandlesTitle } = chartDisplayerOptions[props.chartId];
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
        {props.title && !componentHandlesTitle ? (
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
        return <ChartPlaceholder noBg text="Select a habit key to see data in here" />;
      }
      return <NumberHabitCalendarHeatmap {...props} habitKey={habitKey} />;
    }
    case ChartId.TextHabitCoocurrencesChord: {
      const habitKey = props.habitKey;
      if (!habitKey) {
        return <ChartPlaceholder noBg text="Select a habit key to see data in here" />;
      }
      return <TextHabitCoocurrencesChord {...props} habitKey={habitKey} />;
    }
    case ChartId.Count: {
      const countKey = props.countKey;
      if (!countKey) {
        return <ChartPlaceholder noBg text="Select a key" />;
      }
      return <CountCard {...props} countKey={countKey} />;
    }
    case ChartId.CountriesVisitedMap: {
      return <CountriesVisitedMap {...props} />;
    }
    case ChartId.CountriesVisitedBar: {
      return <CountriesVisitedBar {...props} />;
    }
    case ChartId.CitiesVisitedBar: {
      return <CitiesVisitedBar {...props} />;
    }
    case ChartId.CountriesVisitedPie: {
      return <CountriesVisitedPie {...props} />;
    }
    case ChartId.CitiesVisitedPie: {
      return <CitiesVisitedPie {...props} />;
    }
    case ChartId.PlacesVisitCountBar: {
      return <PlacesVisitCountBar {...props} />;
    }
    case ChartId.MostVisitedWebPagesBar: {
      return <MostVisitedWebPagesBar {...props} />;
    }
    case ChartId.MostVisitedWebPagesPie: {
      return <MostVisitedWebPagesPie {...props} />;
    }
    case ChartId.MostVisitedHostsPie: {
      return <MostVisitedHostsPie {...props} />;
    }
    case ChartId.WebsitesVisitsCalendarHeatmap: {
      return <WebsitesVisitsCalendarHeatmap {...props} />;
    }
    case ChartId.NavigationFlowChord: {
      return <WebsiteNavigationFlowChord {...props} />;
    }
    case ChartId.TextHabitBar: {
      const habitKey = props.habitKey;
      if (!habitKey) {
        return <ChartPlaceholder noBg text="Select a habit key to see data in here" />;
      }
      return <TextHabitBar {...props} habitKey={habitKey} />;
    }
  }
}
