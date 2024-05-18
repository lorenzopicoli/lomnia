import { isValid, parseISO } from 'date-fns'

export function isISODateString(value: string) {
  const possibleDate = parseISO(value)
  return isValid(possibleDate)
}
