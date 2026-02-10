import { AspectRatio, Card, Collapse, Container, Group, Stack, Title } from "@mantine/core";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import { IconChevronDown } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { endOfDay, format, startOfDay } from "date-fns";
import { trpc } from "../../api/trpc";
import { cardDarkBackground } from "../../themes/mantineThemes";
import DailyWeatherOverviewContainer from "../DailyWeatherOverviewContainer";
import HeatmapContainer from "../HeatmapContainer";

export default function ActivityTimelineOverviewContainer(props: { day: Date }) {
  const { day } = props;

  const { data } = useQuery(
    trpc.weather.getByDay.queryOptions({
      day: format(startOfDay(day), "yyyy-MM-dd"),
    }),
  );

  const theme = getWeatherTheme(data?.daily?.weatherCode ?? 1);
  const isSmallScreen = useMediaQuery("(max-width: 768px)");
  const [opened, { toggle }] = useDisclosure(!isSmallScreen);

  return (
    <Container maw={800} w={"100%"} fluid p={0}>
      <Card
        p="md"
        radius="md"
        mih={50}
        miw={50}
        style={{
          background: theme.background,
          boxShadow: theme.glow ? `0 0 30px ${theme.glow}` : "0 10px 30px rgba(0,0,0,0.35)",
          transition: "background 300ms ease, box-shadow 300ms ease",
        }}
      >
        <Stack>
          {isSmallScreen ? (
            <Group
              p={0}
              align="center"
              justify="space-between"
              onClick={toggle}
              style={{
                cursor: "pointer",
              }}
            >
              <Title size={"xl"}>Overview</Title>
              <IconChevronDown />
            </Group>
          ) : null}

          <Collapse in={!isSmallScreen || opened}>
            <Stack>
              <DailyWeatherOverviewContainer date={day} />
              <AspectRatio
                style={{
                  borderRadius: 10,
                  overflow: "clip",
                }}
              >
                <Container p={0} h="100%" mah={500}>
                  <HeatmapContainer startDate={startOfDay(day)} endDate={endOfDay(day)} />
                </Container>
              </AspectRatio>
            </Stack>
          </Collapse>
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
