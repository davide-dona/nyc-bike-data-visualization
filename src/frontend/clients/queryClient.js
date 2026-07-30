import { QueryClient } from '@tanstack/react-query'
export { QueryClientProvider } from '@tanstack/react-query'

/** Centralized QueryClient instance with app-wide defaults. */
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            staleTime: 15 * 60 * 1000,    // 15 minutes
            gcTime: 30 * 60 * 1000,       // 30 minutes
        },
    },
})