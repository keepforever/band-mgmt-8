export type GetURLArgs = {
  invitationId: string | undefined
  songId: string | undefined
  bandId: string | undefined
  eventId: string | undefined
}

export const bands = {
  root: {
    getURL: () => '/policy-center',
  },

  songs: {
    root: {
      getURL: ({ songId, bandId }: GetURLArgs) => `bands/${bandId}/songs/${songId}`,
    },

    list: {
      root: {
        getURL: ({ bandId }: GetURLArgs) => `bands/${bandId}/songs`,
      },
    },

    detail: {
      root: {
        getURL: ({ songId, bandId }: GetURLArgs) => `bands/${bandId}/songs/${songId}`,
      },
    },

    edit: {
      root: {
        getURL: ({ songId, bandId }: GetURLArgs) => `bands/${bandId}/songs/${songId}/edit`,
      },
    },

    new: {
      root: {
        getURL: ({ bandId }: GetURLArgs) => `bands/${bandId}/songs/new`,
      },
    },
  },
}

export const routeManager = {
  bands,
}
