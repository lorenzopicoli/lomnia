export function getRandomColor() {
  const randomValue = () => Math.floor(Math.random() * 128) // Limit range to produce darker colors
  const r = randomValue() + 50
  const g = randomValue() + 50
  const b = randomValue() + 50
  return `rgb(${r}, ${g}, ${b})`
}

export function getRandomBrighterColor() {
  const randomValue = () => Math.floor(Math.random() * 160) // Limit range to produce darker colors
  const r = randomValue() + 50
  const g = randomValue() + 50
  const b = randomValue() + 50
  return `rgb(${r}, ${g}, ${b})`
}
