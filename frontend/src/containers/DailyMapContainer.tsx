import { useQuery } from "@tanstack/react-query";
import { format, startOfDay } from "date-fns";
import { trpc } from "../api/trpc";
import { MaximizableMap } from "../components/MaximizableMap";

export default function DailyMapContainer(props: { day: Date }) {
  const { day } = props;

  const { data: points, isLoading } = useQuery(
    trpc.charts.locations.getDailyMap.queryOptions({
      day: format(startOfDay(day), "yyyy-MM-dd"),
      groupPointsByInSec: 10,
    }),
  );

  return <MaximizableMap points={points ?? []} isLoading={!points || isLoading} />;
}
