import { Flex, Grid, Skeleton } from "@mantine/core";
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

export default function DailyWeatherOverviewContainer(props: DailyWeatherOverviewContainerProps) {
  const { data, isLoading } = useQuery(
    trpc.weather.getByDay.queryOptions({
      day: format(startOfDay(props.date), "yyyy-MM-dd"),
    }),
  );

  if (isLoading) {
    return <Loading />;
  }

  if (!data) {
    return <Loading />;
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
              <Flex align={"center"} gap={"sm"}>
                <LoIcon Icon={IconTemperaturePlus} color="#ab264c" />
                {Math.round(data.daily.apparentTemperatureMax)}°C
              </Flex>
            </Grid.Col>
          ) : null}
          {isNumber(data.daily.apparentTemperatureMin) ? (
            <Grid.Col span={6}>
              <Flex align={"center"} gap={"sm"}>
                <LoIcon Icon={IconTemperatureMinus} color="#328ac9" />
                {Math.round(data.daily.apparentTemperatureMin)}°C
              </Flex>
            </Grid.Col>
          ) : null}
          {weatherCode ? (
            <Grid.Col span={6}>
              <Flex align={"center"} gap={"sm"}>
                <LoIcon Icon={weatherCode.icon} color={getRandomColor()} />
                {weatherCode.label}
              </Flex>
            </Grid.Col>
          ) : null}
          {sunshineInterval ? (
            <Grid.Col span={6}>
              <Flex align={"center"} gap={"sm"}>
                <LoIcon Icon={IconUvIndex} color={getRandomColor()} />
                {`Sunshine: ${zeroPad(sunshineInterval.hours ?? 0)}h${zeroPad(sunshineInterval.minutes ?? 0)}m`}
              </Flex>
            </Grid.Col>
          ) : null}
          {data.daily.sunrise ? (
            <Grid.Col span={6}>
              <Flex align={"center"} gap={"sm"}>
                <LoIcon Icon={IconSunrise} color={getRandomColor()} />
                {`Sunrise: ${formatDateTime(data.daily.sunrise)}`}
              </Flex>
            </Grid.Col>
          ) : null}
          {data.daily.sunset ? (
            <Grid.Col span={6}>
              <Flex align={"center"} gap={"sm"}>
                <LoIcon Icon={IconSunset} color={getRandomColor()} />
                {`Sunset: ${formatDateTime(data.daily.sunset)}`}
              </Flex>
            </Grid.Col>
          ) : null}
        </Grid>
      )}
    </>
  );
}

function Loading() {
  return (
    <Grid gutter="md">
      {Array.from({ length: 6 }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
        <Grid.Col span={6} key={i}>
          <Flex gap="sm">
            <Skeleton h={30} w={30} bdrs={20} />
            <Skeleton h={30} w={100} />
          </Flex>
        </Grid.Col>
      ))}
    </Grid>
  );
}

function weatherCodeToText(code: number) {
  switch (code) {
    case 0:
      return "Clear sky";

    case 1:
      return "Mainly clear";
    case 2:
      return "Partly cloudy";
    case 3:
      return "Overcast";

    case 45:
    case 48:
      return "Fog";

    case 51:
      return "Light drizzle";
    case 53:
      return "Moderate drizzle";
    case 55:
      return "Dense drizzle";

    case 56:
      return "Light freezing drizzle";
    case 57:
      return "Dense freezing drizzle";

    case 61:
      return "Slight rain";
    case 63:
      return "Moderate rain";
    case 65:
      return "Heavy rain";

    case 66:
      return "Light freezing rain";
    case 67:
      return "Heavy freezing rain";

    case 71:
      return "Slight snowfall";
    case 73:
      return "Moderate snowfall";
    case 75:
      return "Heavy snowfall";

    case 77:
      return "Snow grains";

    case 80:
      return "Slight rain showers";
    case 81:
      return "Moderate rain showers";
    case 82:
      return "Violent rain showers";

    case 85:
      return "Slight snow showers";
    case 86:
      return "Heavy snow showers";

    case 95:
      return "Thunderstorm";

    case 96:
      return "Thunderstorm with slight hail";
    case 99:
      return "Thunderstorm with heavy hail";

    default:
      return "Unknown weather condition";
  }
}

function weatherCodeInformation(code: number) {
  if (code === 0) {
    return { icon: IconSun, label: weatherCodeToText(code) };
  }
  if (code >= 1 && code <= 3) {
    return { icon: IconCloud, label: weatherCodeToText(code) };
  }
  if (code >= 45 && code <= 48) {
    return { icon: IconCloudFog, label: weatherCodeToText(code) };
  }
  if (code >= 51 && code <= 57) {
    return { icon: IconDroplets, label: weatherCodeToText(code) };
  }
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) {
    return { icon: IconUmbrella, label: weatherCodeToText(code) };
  }
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) {
    return { icon: IconSnowflake, label: weatherCodeToText(code) };
  }
  return { icon: IconCloudStorm, label: weatherCodeToText(code) };
}
