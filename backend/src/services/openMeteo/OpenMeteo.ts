import { fetchWeatherApi } from "openmeteo";
import type { Point } from "../../db/types";
import { Logger } from "../Logger";

/**
 * TODO: Add rate limiting in here
 */
export class OpenMeteo {
  static apiVersion = "v1";
  private apiUrl = `https://archive-api.open-meteo.com/${OpenMeteo.apiVersion}/archive`;
  protected logger = new Logger("OpenMeteoAPI");
  private apiParams = {
    hourly: [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "precipitation",
      "rain",
      "snowfall",
      "snow_depth",
      "weather_code",
      "cloud_cover",
      "wind_speed_10m",
      "wind_speed_100m",
    ],
    daily: [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "temperature_2m_mean",
      "apparent_temperature_max",
      "apparent_temperature_min",
      "sunrise",
      "sunset",
      "daylight_duration",
      "sunshine_duration",
      "rain_sum",
      "snowfall_sum",
    ],
  };

  /**
   * Fetches historical weather data for a list of places for a given period
   *
   * TODO: Return cached response if we have cached data for all locations for all of the dates, otherwise calls the API
   *
   */
  public async fetchHistorical(params: { points: Point[]; startDate: string; endDate: string; timezone: string }) {
    const { points, startDate, endDate, timezone } = params;
    const meteoParams = {
      latitude: points.map((p) => p.lat),
      longitude: points.map((p) => p.lng),
      timezone: timezone,
      start_date: startDate,
      end_date: endDate,
      ...this.apiParams,
    };

    return fetchWeatherApi(this.apiUrl, meteoParams);
  }
}
