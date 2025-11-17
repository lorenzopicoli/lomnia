import { format } from "date-fns";

export const formatDateTime = (dateString: string) => {
  const d = new Date(dateString);
  return format(d, "HH:mm");
};
