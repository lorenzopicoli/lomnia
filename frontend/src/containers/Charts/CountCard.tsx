import { useQuery } from "@tanstack/react-query";
import { trpc } from "../../api/trpc";
import type { CountCardChartProps } from "../../charts/types";
import { TextCardChart } from "../../components/TextCardChart/TextCardChart";

export function CountCard(props: CountCardChartProps) {
  const { countKey } = props;
  const { data } = useQuery(
    trpc.charts.counts.getCounts.queryOptions({
      countKey,
    }),
  );
  return <TextCardChart {...props} value={data ?? -1} />;
}
