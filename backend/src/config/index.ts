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
      },
      openMeteo: {
        enabled: true,
      },
      userPoi: {
        enabled: true,
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
