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
}
