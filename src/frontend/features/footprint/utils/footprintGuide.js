// Editorial copy for the footprint page's "How To Read It" visualization guide
export const FOOTPRINT_GUIDE = {
    mapName: 'Footprint',
    title: 'How To Read It',
    summary: 'This view answers two different questions and keeps them apart: what would the same kilometres emit by other modes, and how much car CO2 did riding plausibly avoid. The first is a comparison, the second is an estimate - so it always comes as a range.',
    hints: [
        {
            title: 'Comparison is not avoidance',
            text: 'The bar chart re-expresses the same travelled distance per mode. It does not claim riders would otherwise have driven - that claim lives in the band, discounted by the substitution rate.',
        },
        {
            title: 'Trust the band, not the line',
            text: 'The shaded envelope spans the plausible substitution rates from the literature. The dotted line is only your chosen point inside it - move the slider and watch how much the outcome depends on that assumption.',
        },
        {
            title: 'Check the assumptions',
            text: 'Every emission factor, the substitution range, and what the estimate leaves out are listed below the charts. If you disagree with an input, the box tells you exactly which number to challenge.',
        },
    ],
}
