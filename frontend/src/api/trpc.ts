import type { AppRouter } from "@lomnia/backend/src/routes/router";
import { QueryClient } from "@tanstack/react-query";
import { httpLink } from "@trpc/client";
import { createTRPCClient } from "@trpc/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";

let apiUrl = "http://localhost:3010";
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
const windowApiUrl = (window as any).API_URL;

if (windowApiUrl !== "__API_URL__") {
  apiUrl = windowApiUrl;
}

const trpcClient = createTRPCClient<AppRouter>({
  links: [httpLink({ url: `${apiUrl}/trpc` })],
});

export const queryClient = new QueryClient();

export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: trpcClient,
  queryClient,
});

export type RouterOutputs = inferRouterOutputs<AppRouter>;
