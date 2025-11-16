import { useEffect, useMemo, useState } from "react";
import { trpc, type RouterOutputs } from "../api/trpc";

/**
 * Small wrapper around the availableKeys API call to aovid it being called more than once
 */
export function useAvailableCharts(): {
  refetch: () => void;
  isLoading: boolean;
  availableKeys?: RouterOutputs["getAvailableKeys"];
} {
  const [alreadyFetched, setAlreadyFetched] = useState(false);
  const { data, isLoading } = trpc.getAvailableKeys.useQuery(undefined, {
    enabled: !alreadyFetched,
  });

  useEffect(() => {
    if (data && !alreadyFetched) {
      setAlreadyFetched(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);
  const refetch = useMemo(() => () => setAlreadyFetched(false), []);
  const response = useMemo(() => ({ refetch, availableKeys: data, isLoading }), [refetch, data, isLoading]);
  return response;
}
