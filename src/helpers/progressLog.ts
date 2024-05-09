import { differenceInSeconds, intervalToDuration } from 'date-fns'

const progressLog = (startDate: Date, total: number, current: number) => {
  const timeElapsed = differenceInSeconds(new Date(), startDate)
  const eta = (total - current) * (timeElapsed / current)
  const duration = intervalToDuration({ start: 0, end: eta * 1000 })
  const zeroPad = (num) => String(num).padStart(2, '0')

  const formatted = [duration.hours, duration.minutes, duration.seconds]
    .filter(Boolean)
    .map(zeroPad)
    .join(':')

  return formatted
}

export default progressLog
