import { AspectRatio, Card, Collapse, Container, Group, Stack, Title } from "@mantine/core";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import { IconChevronDown } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { format, startOfDay } from "date-fns";
import { trpc } from "../../api/trpc";
import { cardDarkBackground } from "../../themes/mantineThemes";
import { getWeatherTheme } from "../../utils/formatWeatherCode";
import DailyMapContainer from "../DailyMapContainer";
import DailyWeatherOverviewContainer from "../DailyWeatherOverviewContainer";

export default function ActivityTimelineOverviewContainer(props: { day: Date }) {
  const { day } = props;

  const { data } = useQuery(
    trpc.weather.getByDay.queryOptions({
      day: format(startOfDay(day), "yyyy-MM-dd"),
    }),
  );

  const theme = getWeatherTheme(data?.daily?.weatherCode ?? 1, cardDarkBackground);
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
                <DailyMapContainer day={day} />
              </AspectRatio>
            </Stack>
          </Collapse>
        </Stack>
      </Card>
    </Container>
  );
}
