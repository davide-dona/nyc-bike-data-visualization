import axios from 'axios'

/** Shared axios instance for API requests. */
const apiClient = axios.create({
    // 127.0.0.1 rather than localhost: browsers resolve localhost to ::1 first,
    // which can silently hit a different (stale) service bound on IPv6
    baseURL: 'http://127.0.0.1:8000',
    headers: { 'Content-Type': 'application/json' },
})

// Strip null/empty params before sending
apiClient.interceptors.request.use((config) => {
    if (config.params) {
        config.params = Object.fromEntries(
            Object.entries(config.params).filter(([, v]) => v != null && v !== '')
        )
    }
    return config
})

export default apiClient