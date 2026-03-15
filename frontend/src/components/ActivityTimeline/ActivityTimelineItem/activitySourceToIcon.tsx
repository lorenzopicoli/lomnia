import { IconCheck, IconPin, IconRun, IconWorld, IconZzz } from "@tabler/icons-react";
import { FirefoxLogo } from "../../logos/Firefox";
import { GarminLogo } from "../../logos/GarminLogo";
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
      return <OwntracksLogo height={20} width={20} />;
    default:
      return <IconPin height={20} width={20} />;
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

export function sleepActivitySourceToIcon(source: string | null) {
  switch (source) {
    case "garmin":
      return <GarminLogo height={20} width={20} />;
    default:
      return <IconZzz stroke={1.5} />;
  }
}

export function exerciseActivitySourceToIcon(source: string | null) {
  switch (source) {
    case "garmin":
      return <GarminLogo height={20} width={20} />;
    default:
      return <IconRun stroke={1.5} />;
  }
}
