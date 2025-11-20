import { Flex, Grid } from "@mantine/core";
import {
  IconCloud,
  IconCloudFog,
  IconCloudStorm,
  IconDroplets,
  IconSnowflake,
  IconSun,
  IconSunrise,
  IconSunset,
  IconTemperatureMinus,
  IconTemperaturePlus,
  IconUmbrella,
  IconUvIndex,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns/format";
import { intervalToDuration } from "date-fns/intervalToDuration";
import { startOfDay } from "date-fns/startOfDay";
import { trpc } from "../api/trpc";
import { LoIcon } from "../components/LoIcon";
import { formatDateTime } from "../utils/formatDateTime";
import { getRandomColor } from "../utils/getRandomColor";
import { isNumber } from "../utils/isNumber";

type DailyWeatherOverviewContainerProps = {
  date: Date;
};

const weatherCodeInformation = (code: number) => {
  if (code === 0) {
    return { icon: IconSun, label: "Clear sky" };
  }
  if (code >= 1 && code <= 3) {
    return { icon: IconCloud, label: "Partly cloudy" };
  }
  if (code >= 45 && code <= 48) {
    return { icon: IconCloudFog, label: "Fog" };
  }
  if (code >= 51 && code <= 57) {
    return { icon: IconDroplets, label: "Drizzle" };
  }
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) {
    return { icon: IconUmbrella, label: "Rain" };
  }
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) {
    return { icon: IconSnowflake, label: "Snow" };
  }
  return { icon: IconCloudStorm, label: "Thunderstorm" };
};

export default function DailyWeatherOverviewContainer(props: DailyWeatherOverviewContainerProps) {
  const { data, isLoading } = useQuery(
    trpc.weather.getByDay.queryOptions({
      day: format(startOfDay(props.date), "yyyy-MM-dd"),
    }),
  );

  if (isLoading) {
    return "Loading...";
  }

  if (!data) {
    return null;
  }

  const sunshineInterval = isNumber(data.daily?.sunshineDuration)
    ? intervalToDuration({
        start: 0,
        end: data.daily.sunshineDuration * 1000,
      })
    : null;

  const weatherCode = isNumber(data.daily?.weatherCode) ? weatherCodeInformation(data.daily.weatherCode) : null;
  const zeroPad = (num: number) => String(num).padStart(2, "0");

  return (
    <>
      {!data.daily ? null : (
        <Grid gutter={"md"}>
          {isNumber(data.daily.apparentTemperatureMax) ? (
            <Grid.Col span={6}>
              <Flex gap={"sm"}>
                <LoIcon Icon={IconTemperaturePlus} color="#ab264c" />
                {Math.round(data.daily.apparentTemperatureMax)}°C
              </Flex>
            </Grid.Col>
          ) : null}
          {sunshineInterval ? (
            <Grid.Col span={6}>
              <Flex gap={"sm"}>
                <LoIcon Icon={IconUvIndex} color={getRandomColor()} />
                {`Sunshine: ${zeroPad(sunshineInterval.hours ?? 0)}h${zeroPad(sunshineInterval.minutes ?? 0)}m`}
              </Flex>
            </Grid.Col>
          ) : null}
          {data.daily.sunrise ? (
            <Grid.Col span={6}>
              <Flex gap={"sm"}>
                <LoIcon Icon={IconSunrise} color={getRandomColor()} />
                {`Sunrise: ${formatDateTime(data.daily.sunrise)}`}
              </Flex>
            </Grid.Col>
          ) : null}
          {data.daily.sunset ? (
            <Grid.Col span={6}>
              <Flex gap={"sm"}>
                <LoIcon Icon={IconSunset} color={getRandomColor()} />
                {`Sunset: ${formatDateTime(data.daily.sunset)}`}
              </Flex>
            </Grid.Col>
          ) : null}
          {isNumber(data.daily.apparentTemperatureMin) ? (
            <Grid.Col span={6}>
              <Flex gap={"sm"}>
                <LoIcon Icon={IconTemperatureMinus} color="#328ac9" />
                {Math.round(data.daily.apparentTemperatureMin)}°C
              </Flex>
            </Grid.Col>
          ) : null}
          {weatherCode ? (
            <Grid.Col span={6}>
              <Flex gap={"sm"}>
                <LoIcon Icon={weatherCode.icon} color={getRandomColor()} />
                {weatherCode.label}
              </Flex>
            </Grid.Col>
          ) : null}
        </Grid>
      )}
    </>
  );
}
