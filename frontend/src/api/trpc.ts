import type { AppRouter } from "@lomnia/backend/src/routes/router";
import { QueryClient } from "@tanstack/react-query";
import { httpLink } from "@trpc/client";
import { createTRPCClient } from "@trpc/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";

const API_URL = window.API_URL ?? "http://localhost:3010";
const trpcClient = createTRPCClient<AppRouter>({
  links: [httpLink({ url: `${API_URL}/trpc` })],
});

export const queryClient = new QueryClient();

export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: trpcClient,
  queryClient,
});

export type RouterOutputs = inferRouterOutputs<AppRouter>;
