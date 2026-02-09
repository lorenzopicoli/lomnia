import { AspectRatio, Card, Container, Stack } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { endOfDay, format, startOfDay } from "date-fns";
import { trpc } from "../../api/trpc";
import { cardDarkBackground } from "../../themes/mantineThemes";
import DailyWeatherOverviewContainer from "../DailyWeatherOverviewContainer";
import HeatmapContainer from "../HeatmapContainer";

export default function ActivityTimelineOverviewContainer(props: { day: Date }) {
  const { day } = props;
  const { data, isLoading } = useQuery(
    trpc.weather.getByDay.queryOptions({
      day: format(startOfDay(day), "yyyy-MM-dd"),
    }),
  );

  const theme = getWeatherTheme(data?.daily?.weatherCode ?? 1);

  return (
    <Container flex={0} fluid p={0}>
      <Card
        p="md"
        radius="lg"
        style={{
          background: theme.background,
          boxShadow: theme.glow ? `0 0 30px ${theme.glow}` : "0 10px 30px rgba(0,0,0,0.35)",
          transition: "background 300ms ease, box-shadow 300ms ease",
        }}
      >
        <Stack>
          <DailyWeatherOverviewContainer date={day} />
          <Container p={0} w={500} h={500}>
            <AspectRatio
              style={{
                borderRadius: 10,
                overflow: "clip",
              }}
            >
              <HeatmapContainer startDate={startOfDay(day)} endDate={endOfDay(day)} />
            </AspectRatio>
          </Container>
        </Stack>
      </Card>
    </Container>
  );
}

type WeatherTheme = {
  background: string;
  glow?: string;
};

function getWeatherTheme(code: number): WeatherTheme {
  // Clear
  if (code === 0) {
    return {
      background: `
      radial-gradient(
        1000px 1000px at 30% 20%,
        rgba(255, 210, 120, 0.12),
        transparent 70%
      ),
      ${cardDarkBackground}
    `,
    };
  }
  // Cloudy
  if ([1, 2, 3].includes(code)) {
    return {
      background: "linear-gradient(135deg, #2a2e35, #3a3f47)",
    };
  }

  // Fog
  if ([45, 48].includes(code)) {
    return {
      background: "linear-gradient(135deg, #2b2b2b, #3b3b3b)",
    };
  }

  // Drizzle / Rain
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) {
    return {
      background: "linear-gradient(135deg, #1f2933, #0f1720)",
      glow: "rgba(80, 160, 255, 0.25)",
    };
  }

  // Snow
  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return {
      background: "linear-gradient(135deg, #1e2936, #3b4c5c)",
    };
  }

  // Thunderstorm
  if ([95, 96, 99].includes(code)) {
    return {
      background: "linear-gradient(135deg, #120018, #2b0033)",
      glow: "rgba(180, 90, 255, 0.35)",
    };
  }

  // Fallback
  return {
    background: cardDarkBackground,
  };
}
