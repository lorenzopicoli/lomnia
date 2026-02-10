import { Flex, Group, Skeleton } from "@mantine/core";
import { IconSunrise, IconSunset, IconTemperatureMinus, IconTemperaturePlus, IconUvIndex } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns/format";
import { intervalToDuration } from "date-fns/intervalToDuration";
import { startOfDay } from "date-fns/startOfDay";
import { trpc } from "../api/trpc";
import { WeatherInfoItem, type WeatherInfoItemProps } from "../components/WeatherInfoItem/WeatherInfoItem";
import { formatDateTime } from "../utils/formatDateTime";
import { weatherCodeInformation } from "../utils/formatWeatherCode";
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

  if (!data || !data.daily) {
    return null;
  }
  const { daily } = data;

  const sunshineInterval = isNumber(daily.sunshineDuration)
    ? intervalToDuration({
        start: 0,
        end: daily.sunshineDuration * 1000,
      })
    : null;

  const weatherCode = isNumber(daily.weatherCode) ? weatherCodeInformation(daily.weatherCode) : null;

  const zeroPad = (num: number) => String(num).padStart(2, "0");

  const weatherItems = [
    isNumber(daily.apparentTemperatureMax) && {
      icon: IconTemperaturePlus,
      color: "#ab264c",
      label: `${Math.round(daily.apparentTemperatureMax)}°C`,
    },
    isNumber(daily.apparentTemperatureMin) && {
      icon: IconTemperatureMinus,
      color: "#328ac9",
      label: `${Math.round(daily.apparentTemperatureMin)}°C`,
    },
    weatherCode && {
      icon: weatherCode.icon,
      color: getRandomColor(),
      label: weatherCode.label,
    },
    sunshineInterval && {
      icon: IconUvIndex,
      color: getRandomColor(),
      label: `Sunshine: ${zeroPad(sunshineInterval.hours ?? 0)}h${zeroPad(sunshineInterval.minutes ?? 0)}m`,
    },
    daily.sunrise && {
      icon: IconSunrise,
      color: getRandomColor(),
      label: `Sunrise: ${formatDateTime(daily.sunrise)}`,
    },
    daily.sunset && {
      icon: IconSunset,
      color: getRandomColor(),
      label: `Sunset: ${formatDateTime(daily.sunset)}`,
    },
  ].filter(Boolean) as WeatherInfoItemProps[];

  return (
    <Group style={{ flexWrap: "wrap" }} maw={"100%"} miw={0} w="100%">
      {weatherItems.map((item) => (
        <WeatherInfoItem key={item.label} {...item} />
      ))}
    </Group>
  );
}

function Loading() {
  return (
    <Group style={{ flexWrap: "wrap" }} maw={"100%"} miw={0} w="100%">
      {Array.from({ length: 6 }).map(() => (
        // biome-ignore lint/correctness/useJsxKeyInIterable: not needed
        <Flex gap="sm">
          <Skeleton h={30} w={30} bdrs={20} />
          <Skeleton h={30} w={100} />
        </Flex>
      ))}
    </Group>
  );
}
