export function formatExerciseType(type: string) {
  switch (type) {
    case "running":
      return "Run";
    case "strength_training":
      return "Gym";
    case "volleyball":
      return "Volleyball";
    case "cycling":
      return "Cycling";
    case "yoga":
      return "Yoga";
    case "generic":
      return "Exercise";
    default:
      return "Exercise";
  }
}
