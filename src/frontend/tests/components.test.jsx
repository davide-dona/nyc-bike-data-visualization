import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { createQueryWrapper } from './testQueryClient.jsx'

import SegmentedControl from '../components/SegmentedControl.jsx'
import AppHeader from '../features/header/AppHeader.jsx'
import MapPage from '../features/map/MapPage.jsx'
import SurfacePage from '../features/temporal/TemporalPage.jsx'
import WeatherPage from '../features/weather/WeatherPage.jsx'
import FootprintPage from '../features/footprint/FootprintPage.jsx'
import App from '../App.jsx'

// Stub axios via apiClient - all hooks use apiClient.get()
vi.mock('../api-data/apiClient', () => ({
    default: {
        get: vi.fn().mockResolvedValue({ data: {} }),
        interceptors: { request: { use: vi.fn() } },
    },
}))

// Wrapper to provide React Query context for components that use it
const wrapper = createQueryWrapper()

describe('components smoke tests', () => {
    it('AppHeader renders without crashing', () => {
        render(<MemoryRouter><AppHeader /></MemoryRouter>)
    })

    it('App renders without crashing', () => {
        render(<App />, { wrapper })
    })

    it('MapPage renders without crashing', () => {
        render(<MemoryRouter><MapPage /></MemoryRouter>, { wrapper })
    })

    it('SurfacePage renders without crashing', () => {
        render(<MemoryRouter><SurfacePage /></MemoryRouter>, { wrapper })
    })

    it('WeatherPage renders without crashing', () => {
        render(<MemoryRouter><WeatherPage /></MemoryRouter>, { wrapper })
    })

    it('FootprintPage renders without crashing', () => {
        render(<MemoryRouter><FootprintPage /></MemoryRouter>, { wrapper })
    })
})

describe('SegmentedControl', () => {
    const options = [
        { value: 'a', label: 'Alpha', icon: 'fa-solid fa-circle' },
        { value: 'b', label: 'Beta' },
    ]

    it('renders a framed light group and reports clicks', () => {
        const onChange = vi.fn()
        const { container, getByText } = render(
            <SegmentedControl options={options} value="a" onChange={onChange} ariaLabel="Test group" />,
        )

        const track = container.querySelector('.segmented-control')
        expect(track).not.toBeNull()
        expect(track.classList.contains('segmented-control--dark')).toBe(false)
        expect(getByText('Alpha').closest('button').classList.contains('active')).toBe(true)

        fireEvent.click(getByText('Beta'))
        expect(onChange).toHaveBeenCalledWith('b')
    })

    it('applies dark and small variants to the buttons', () => {
        const { getByText } = render(
            <SegmentedControl options={options} value="b" onChange={() => {}} variant="dark" size="sm" />,
        )

        const button = getByText('Beta').closest('button')
        expect(button.classList.contains('segmented-control__btn--dark')).toBe(true)
        expect(button.classList.contains('segmented-control__btn--sm')).toBe(true)
        expect(button.classList.contains('active')).toBe(true)
    })

    it('renders only the buttons when unframed', () => {
        const { container } = render(
            <SegmentedControl options={options} value="a" onChange={() => {}} framed={false} />,
        )

        expect(container.querySelector('.segmented-control')).toBeNull()
        expect(container.querySelectorAll('.segmented-control__btn')).toHaveLength(2)
    })
})