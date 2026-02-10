import { Box, Flex, Group, Skeleton, Text } from "@mantine/core";
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

interface WeatherInfoItemProps {
  icon: React.ComponentType;
  color: string;
  label: string;
}
function WeatherInfoItem({ icon, color, label }: WeatherInfoItemProps) {
  return (
    <Flex flex={1} align="center" gap="sm">
      <Box style={{ flexShrink: 0 }}>
        <LoIcon Icon={icon} color={color} />
      </Box>
      <Box style={{ minWidth: 0, overflow: "hidden", flex: 1 }}>
        <Text truncate="end">{label}</Text>
      </Box>
    </Flex>
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
