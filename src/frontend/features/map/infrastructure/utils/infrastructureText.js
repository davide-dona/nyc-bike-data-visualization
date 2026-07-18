// Centralized display copy for the infrastructure insight frames.
export const INFRASTRUCTURE_TEXT = {
    networkChanges: {
        title: 'Segments installed and removed per year',
        note: 'Bars above the line count new segments, bars below count retired ones. Click a year to see the network as it stood then.',
        xAxisTitle: 'Year',
        yAxisTitle: 'Segments',
        installedLabel: 'Installed',
        removedLabel: 'Removed',
    },
    borough: {
        title: 'Segments by borough',
        noteLead: 'Compares network size across boroughs as of ',
        noteTail: '.',
        xAxisTitle: 'Segments',
    },
    facility: {
        title: 'Segments by facility class',
        noteLead: 'Shows how much of the network each protection level covers as of ',
        noteTail: '.',
        xAxisTitle: 'Segments',
    },
    yearScope: {
        presentLead: 'the present (',
        presentTail: ')',
    },
    sidebar: {
        eyebrow: 'Infrastructure',
        headings: {
            highlights: 'Highlights',
            historicalProfile: 'Historical profile',
            topConnected: 'Top connected stations',
        },
        metrics: {
            capacity: { label: 'Capacity', hint: 'effective docks' },
            docks: { label: 'Docks', hint: 'available now' },
            classicBikes: { label: 'Classic bikes', hint: 'available now' },
            electricBikes: { label: 'E-bikes', hint: 'available now' },
            bikesAvailable: { label: 'Bikes available', hint: 'available now' },
            disabled: { label: 'Disabled', hint: 'out of service' },
        },
        highlightLabels: {
            peakHour: 'Peak hour',
            busiestDay: 'Busiest day',
            flowBalance: 'Flow balance',
            profile: 'Profile',
        },
        chartTitles: {
            byDayOfWeek: 'Avg rides by day of week',
            byHour: 'Avg rides by hour',
            inOutByHour: 'Avg in / out by hour',
        },
        loading: 'Loading station statistics…',
    },
}
