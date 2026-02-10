import {
  IconCloud,
  IconCloudFog,
  IconCloudStorm,
  IconDroplets,
  IconSnowflake,
  IconSun,
  IconUmbrella,
} from "@tabler/icons-react";

export function weatherCodeToText(code: number) {
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

export function weatherCodeInformation(code: number) {
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
