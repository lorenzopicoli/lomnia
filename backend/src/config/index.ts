export default {
  importers: {
    location: {
      generic: {
        enabled: false,
      },
      googleTakout: {
        enabled: false,
      },
      googleTimeline: {
        enabled: false,
      },
      owntracksServer: {
        enabled: true,
      },
    },
    locationDetails: {
      nominatim: {
        enabled: true,
        /**
         * In MS
         */
        apiCallsDelay: 1500,
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
        enabled: false,
      },
    },
    health: {
      samsung: {
        heartRate: {
          enabled: true,
        },
        stepCount: {
          enabled: true,
        },
        sleep: {
          enabled: true,
          manualSleepDeviceUuid: "YONCTMRFDw",
        },
        sleepStage: {
          enabled: true,
        },
        snoring: {
          enabled: true,
        },
      },
    },
    internetPresence: {
      piholeServer: {
        enabled: false,
      },
    },
    files: {
      obsidian: {
        enabled: false,
      },
    },
  },
};
