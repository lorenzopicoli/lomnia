function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function lerpColor(c1: [number, number, number], c2: [number, number, number], t: number): [number, number, number] {
  return [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)];
}

export function getHourColors(hour: number): [number, number, number, number] {
  const night: [number, number, number] = [25, 55, 120];
  const morning: [number, number, number] = [210, 180, 70];
  const midday: [number, number, number] = [200, 190, 70];
  const evening: [number, number, number] = [220, 110, 50];
  const late: [number, number, number] = [70, 130, 200];

  let color: [number, number, number];

  if (hour >= 0 && hour < 5) {
    const t = hour / 5;
    color = lerpColor(night, morning, t);
  } else if (hour < 11) {
    const t = (hour - 5) / 6;
    color = lerpColor(morning, midday, t);
  } else if (hour < 16) {
    const t = (hour - 11) / 5;
    color = lerpColor(midday, evening, t);
  } else if (hour < 19) {
    const t = (hour - 16) / 3;
    color = lerpColor(evening, late, t);
  } else {
    const t = (hour - 19) / 5;
    color = lerpColor(late, night, t);
  }

  return [...color, 220];
}
