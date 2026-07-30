import { describe, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { createQueryWrapper } from './testQueryClient.jsx'

import { useInfrastructureStationSelection } from '@/features/map/infrastructure/hooks/useInfrastructureStationSelection.js'

import { useDatasetDateRange } from '../features/header/hooks/useDatasetDateRange.js'
import useDayHourStats from '../features/temporal/hooks/useDayHourStats.js'
import useStationUsageCounts from '@/features/map/station_usage/hooks/useStationUsageCounts.js'
import useStationAvailability from '@/features/map/hooks/useStationAvailability.js'
import useWeatherStats from '../features/weather/hooks/useWeatherStats.js'
import useTemperatureResponse from '../features/weather/hooks/useTemperatureResponse.js'
import useRainImpact from '../features/weather/hooks/useRainImpact.js'

// Stub axios via apiClient - all hooks use apiClient.get(), which returns { data: ... }
vi.mock('../clients/apiClient.js', () => ({
    default: {
        get: vi.fn().mockResolvedValue({ data: {} }),
        interceptors: { request: { use: vi.fn() } },
    },
}))
// Wrapper to provide React Query context for hooks that use it
const TEST_FILTERS = { start_date: '2026-01-01', end_date: '2026-01-31', user_type: 'member' }
const wrapper = createQueryWrapper()

describe('hooks smoke tests', () => {
    it('useDatasetDateRange resolves without throwing', async () => {
        const { result } = renderHook(() => useDatasetDateRange(), { wrapper })
        await waitFor(() => expect(result.current).toBeDefined())
    })

    it('useDayHourStats resolves without throwing', async () => {
        const { result } = renderHook(() => useDayHourStats(TEST_FILTERS), { wrapper })
        await waitFor(() => expect(result.current).toBeDefined())
    })

    it('useStationUsageCounts resolves without throwing', async () => {
        const { result } = renderHook(() => useStationUsageCounts(TEST_FILTERS), { wrapper })
        await waitFor(() => expect(result.current).toBeDefined())
    })

    it('useStationAvailability resolves without throwing', async () => {
        const { result } = renderHook(() => useStationAvailability(TEST_FILTERS), { wrapper })
        await waitFor(() => expect(result.current).toBeDefined())
    })

    it('useWeatherStats resolves without throwing', async () => {
        const { result } = renderHook(() => useWeatherStats(TEST_FILTERS), { wrapper })
        await waitFor(() => expect(result.current).toBeDefined())
    })

    it('useTemperatureResponse resolves without throwing', async () => {
        const { result } = renderHook(() => useTemperatureResponse(TEST_FILTERS), { wrapper })
        await waitFor(() => expect(result.current).toBeDefined())
    })

    it('useRainImpact resolves without throwing', async () => {
        const { result } = renderHook(() => useRainImpact(TEST_FILTERS), { wrapper })
        await waitFor(() => expect(result.current).toBeDefined())
    })
})

describe('useInfrastructureStationSelection', () => {
    const STATIONS = [
        { id: 'a', name: 'Station A' },
        { id: 'b', name: 'Station B' },
    ]

    it('clears the selection when leaving the infrastructure layer', () => {
        const { result, rerender } = renderHook(
            ({ activeLayer }) => useInfrastructureStationSelection(STATIONS, activeLayer),
            { initialProps: { activeLayer: 'infrastructure' } },
        )

        act(() => result.current.onStationPick({ object: { id: 'a' } }, {}))
        expect(result.current.selectedStationIds).toEqual(['a'])

        rerender({ activeLayer: 'trip_flow' })
        expect(result.current.selectedStationIds).toEqual([])

        // Returning to the layer must not resurrect the old selection
        rerender({ activeLayer: 'infrastructure' })
        expect(result.current.selectedStationIds).toEqual([])
    })
})
