export default {
  importers: {
    habits: {
      hares: {
        enabled: true,
      },
      obsidianHabitsJson: {
        enabled: true,
      },
    },
    location: {
      googleTakout: {
        enabled: false,
      },
      googleTimeline: {
        enabled: false,
      },
    },
    locationDetails: {
      nominatim: {
        enabled: true,
        /**
         * In MS
         */
        apiCallsDelay: 1200,
        /**
         * Number of locations to be fetched in each run. Increasing this number will slowdown each cycle
         */
        maxImportSession: 1000,

        /**
         * User agent used when calling the api. Nominatim requires you to pass this. You should adapt this to something
         * that reflects your application as this is used to rate limit. More info:
         * https://operations.osmfoundation.org/policies/nominatim/
         */
        userAgent: "lomnia",
      },
      openMeteo: {
        enabled: true,
        /**
         * Number of locations to updated each run. Increasing this number will slowdown each cycle
         */
        maxImportSession: 30000,
        /* This should be better calculated so this importer can run as fast as possible. In reality I couldn't find
         * any proper documentation on their API rate limits. On the website it says fewer than 10k calls per day,
         * but I know there are also daily/minute rates. I found a PR with some description and that's what I used
         * to very roughly calculate a number that would be very safe (I rather it to be slow than failing consistently)
         * In ms
         */
        apiCallsDelay: 10000,
      },
      userPoi: {
        enabled: true,

        recalculateAll: false,
      },
    },
    health: {
      samsung: {
        heartRate: {
          enabled: false,
        },
        stepCount: {
          enabled: false,
        },
        sleep: {
          enabled: false,
          manualSleepDeviceUuid: "YONCTMRFDw",
        },
        sleepStage: {
          enabled: false,
          /**
           * Sometimes samsung health will record sleep stages but without a matching sleep id. To avoid logging
           * them as errors every time, you can skip them here
           */
          skipSleepIds: [
            "00353839-3137-3831-3832-343336333731",
            "00353839-3137-3235-3935-353236333731",
            "00353839-3137-3338-3239-363136333731",
            "00353839-3137-3738-3134-383036333731",
            "00353839-3137-3032-3036-393935333731",
            "00353839-3137-3937-3633-313935333731",
            "00353839-3137-3436-3733-323835333731",
            "00353839-3137-3434-3531-343735333731",
            "00353839-3137-3135-3932-353635333731",
          ],
        },
        snoring: {
          enabled: false,
        },
      },
    },
    internetPresence: {},
    files: {
      obsidian: {
        enabled: true,
      },
    },
  },
  charts: {
    countriesVisited: {
      /**
       * Minimum amount of time spent in a country to consider a country as "visited"
       * Useful to filter out points recorded while flying over a country for example
       */
      minimumTimeInMin: 24 * 60,
    },
    citiesVisited: {
      /**
       * Minimum amount of time spent in a city to consider as "visited"
       * Useful to filter out points recorded while flying over a country for example
       */
      minimumTimeInMin: 2 * 60,
    },
    placesVisited: {
      /**
       * Minimum amount of time spent in a place to consider it as "visited"
       */
      minimumTimeInMin: 15,
      /**
       * How many places are shown in the chart
       */
      limit: 20,
    },
    habitTextBar: {
      /**
       * How many values are shown in the chart
       */
      limit: 20,
    },
  },
};
