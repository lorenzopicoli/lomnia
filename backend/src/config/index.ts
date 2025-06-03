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
      },
      openMeteo: {
        enabled: true,
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
