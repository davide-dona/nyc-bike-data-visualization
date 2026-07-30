import { useIsFetching } from "@/clients/baseApiQuery.js";

/**
 * Handler hook. Returns the number of in-flight React Query fetches for the
 * queries mounted on the current page, excluding the dataset date-range query,
 * and falling back to 0 when no QueryClient is available (useful for isolated
 * tests / storybook-style renders). Only `active` queries are counted, so a
 * request left in flight by a page the user navigated away from (React Query
 * doesn't cancel it) no longer keeps the header filters locked.
 * @returns {number} Count of active fetches (0 when QueryClient is absent).
 */
export default function useSafeIsFetching() {
    try {
        return useIsFetching({
            type: "active",
            predicate: (query) => query.queryKey?.[0] !== "dataset-date-range",
        });
    } catch (hookError) {
        if (!String(hookError?.message).includes("No QueryClient set"))
            throw hookError;
        return 0;
    }
}
