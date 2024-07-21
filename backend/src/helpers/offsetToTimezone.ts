import { FixedOffsetZone } from 'luxon'

/**
 *
 * @param offset offset in string format UTC-0400 or similar
 */
export const offsetToTimezone = (offset: string) => {
  const zone = FixedOffsetZone.parseSpecifier(offset.slice(0, -2))

  // Postgres uses a different reference than the usual
  // See here: https://dba.stackexchange.com/questions/130546/strange-utc-offset-time-zone-parsing-in-postgres
  const timezone =
    zone.name.indexOf('-') > -1
      ? zone.name.replace('-', '+')
      : zone.name.replace('+', '-')

  if (!zone.isValid) {
    throw new Error('Invalid timezone: ' + offset)
  }

  return timezone
}
