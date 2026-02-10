const WEBSITE_VISIT_TYPE_LABELS: Record<string, string> = {
  link: "Link",
  typed: "Typed URL",
  bookmark: "Bookmark",
  embed: "Embedded content",
  redirectPermanent: "Permanent redirect",
  redirectTemporary: "Temporary redirect",
  download: "Download",
  framedLink: "Framed link",
  reload: "Reload",
};

export function websiteVisitTypeFormat(type: string): string {
  return WEBSITE_VISIT_TYPE_LABELS[type] ?? null;
}
