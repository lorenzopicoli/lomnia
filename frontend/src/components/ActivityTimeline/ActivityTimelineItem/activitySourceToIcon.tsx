import { IconCheck, IconWorld } from "@tabler/icons-react";
import { FirefoxLogo } from "../../logos/Firefox";
import { HaresLogo } from "../../logos/HaresLogo";
import { OwntracksLogo } from "../../logos/OwntracksLogo";

export function websiteVisitActivitySourceToIcon(source: string | null) {
  switch (source) {
    case "firefox":
      return <FirefoxLogo height={20} width={20} />;
    default:
      return <IconWorld stroke={1.5} />;
  }
}

export function locationActivitySourceToIcon(source: string | null) {
  switch (source) {
    case "owntracks":
      return <OwntracksLogo />;
    default:
      return <OwntracksLogo height={20} width={20} />;
  }
}

export function habitActivitySourceToIcon(source: string | null) {
  switch (source) {
    case "hares":
      return <HaresLogo height={20} width={20} />;
    default:
      return <IconCheck />;
  }
}
