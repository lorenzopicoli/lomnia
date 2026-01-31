import * as z from "zod";

/**
 * How a page visit was initiated.
 */
export const WebsiteVisitType = z.enum([
  /**
   * The user followed a link and opened a new top-level window.
   */
  "link",

  /**
   * The user typed the URL, used the address bar autocomplete,
   * or selected it from history.
   */
  "typed",

  /**
   * The user navigated to the page via a bookmark.
   */
  "bookmark",

  /**
   * Inner content was loaded (images, iframes, or subframes)
   * without an explicit user navigation.
   */
  "embed",

  /**
   * The navigation was a permanent redirect.
   */
  "redirectPermanent",

  /**
   * The navigation was a temporary redirect.
   */
  "redirectTemporary",

  /**
   * The transition resulted in a download.
   */
  "download",

  /**
   * The user followed a link that loaded the page inside a frame.
   */
  "framedLink",

  /**
   * The page was reloaded.
   */
  "reload",
]);

export const IngestionWebsiteVisit = z
  .object({
    entityType: z.literal("websiteVisit").meta({
      description: "Entity discriminator",
    }),

    version: z.string().meta({
      description: "The version of the schema used",
    }),

    id: z.string().meta({
      description: "Unique identifier for the location record. Must be stable across multiple extractions",
    }),

    source: z.string().meta({
      description: "The application source used to get this",
    }),

    websiteId: z.string().meta({
      description: "The website that was visited",
    }),

    fromVisitId: z
      .string()
      .meta({
        description: "The previous visit that led to this one",
      })
      .optional(),

    type: WebsiteVisitType.meta({
      description: "How the visit was initiated",
    }).optional(),

    fileDownloaded: z
      .string()
      .meta({
        description: "The file downloaded as a result of this visit",
      })
      .optional(),

    recordedAt: z.iso.datetime().meta({
      description: "The date at which the website was visited, in UTC time",
    }),
  })
  .meta({
    title: "Website Visit",
    description: "Represents a visit to a website",
  });

export default IngestionWebsiteVisit;
export type IngestionWebsiteVisit = z.infer<typeof IngestionWebsiteVisit>;
export const fileName = "website_visit.schema.json";
