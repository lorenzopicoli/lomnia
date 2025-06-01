import colors from "ansi-colors";
import cliProgress from "cli-progress";
import { differenceInSeconds, intervalToDuration } from "date-fns";
import humanFileSize from "./humanFileSize";

export default class ProgressLogger {
  private total: number | undefined;
  private format: string;
  private bar: cliProgress.SingleBar;
  private hasStarted = false;
  private isFileSize = false;
  private startDate = new Date();

  constructor(title: string, options?: { total?: number; isFileSize?: boolean }) {
    const { total, isFileSize } = options ?? {};
    this.total = total;
    this.isFileSize = isFileSize ?? false;

    this.format = `${title} |${colors.cyan(
      "{bar}",
    )}| {percentage}% || {humanValue}/{humanTotal} || Speed: {speed} || ETA: {humanEta}`;

    this.bar = new cliProgress.SingleBar({
      format: this.format,
      barCompleteChar: "\u2588",
      barIncompleteChar: "\u2591",
      hideCursor: true,
    });

    if (total) {
      this.start();
      this.bar.start(total, 0, {
        speed: "N/A",
      });
    }
  }

  private start() {
    this.hasStarted = true;
  }

  public step(current: number, total: number, startDate?: Date) {
    if (startDate) {
      this.startDate = startDate;
    }
    if (total !== this.total) {
      this.bar.setTotal(total);
      this.total = total;
    }

    if (!this.hasStarted) {
      this.start();
      this.bar.start(total, 0, {
        speed: "N/A",
      });
    }

    const { eta, speedPerSecond } = this.getEta(current);

    const humanValue = this.isFileSize ? humanFileSize(current) : current;
    const humanTotal = this.isFileSize ? humanFileSize(total) : total;
    const speed = this.isFileSize ? humanFileSize(speedPerSecond) : speedPerSecond;

    this.bar.update(current, {
      humanValue,
      humanTotal,
      speed: `${speed}/s`,
      humanEta: eta,
    });
    if (current >= total) {
      this.stop();
    }
  }

  public stop() {
    this.bar.stop();
  }
  private getEta(current: number) {
    if (!this.total) {
      console.log("Trying to get ETA before setting total");
      return { eta: 0, speedPerSecond: 0 };
    }

    const timeElapsed = differenceInSeconds(new Date(), this.startDate);
    const eta = (this.total - current) * (timeElapsed / current);
    const duration = intervalToDuration({ start: 0, end: eta * 1000 });
    const zeroPad = (num: number) => String(num).padStart(2, "0");

    const formatted = [duration.hours ?? 0, duration.minutes ?? 0, duration.seconds ?? 0].map(zeroPad).join(":");

    return {
      eta: formatted,
      speedPerSecond: timeElapsed > 0 ? current / timeElapsed : 0,
    };
  }
}
