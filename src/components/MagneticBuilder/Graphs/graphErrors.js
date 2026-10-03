import { formatUnit, removeTrailingZeroes } from '/WebSharedComponents/assets/js/utils.js'

function formatFrequency(hertz) {
    const aux = formatUnit(hertz, 'Hz');
    return `${removeTrailingZeroes(aux.label, 2)} ${aux.unit}`;
}

/**
 * The message a graph shows when its sweep fails: the engine's own reason, in words a user can
 * act on. A generic "Error calculating ..." hid that, for example, the material has no data at
 * the lower end of the frequency range the graph asks for.
 */
export function describeGraphError(error, what) {
    const text = String(error?.message ?? error ?? '').replace(/^Error:\s*/, '').replace(/^Exception:\s*/, '');

    // MKF: "[MATERIAL_FREQUENCY_OUT_OF_SPAN] Material 97: complex permeability is tabulated from
    // 10000.000000 Hz to 1680000000.000000 Hz; 1000.000000 Hz is below that range ..."
    const span = text.match(/Material (.+?): complex permeability is tabulated from ([\d.e+-]+) Hz to ([\d.e+-]+) Hz; ([\d.e+-]+) Hz is (below|above)/);
    if (span) {
        const [, material, from, to, asked, side] = span;
        const fix = side === 'below'
            ? `set the minimum frequency to at least ${formatFrequency(Number(from))}`
            : `set the maximum frequency to at most ${formatFrequency(Number(to))}`;
        return `Cannot calculate ${what} at ${formatFrequency(Number(asked))}: material ${material} has complex permeability data only from ${formatFrequency(Number(from))} to ${formatFrequency(Number(to))}. In the graph settings, ${fix}.`;
    }

    const missing = text.match(/Material data missing for: ([^(]+)/);
    if (missing && /complex permeability/i.test(text)) {
        return `Complex permeability data is not available for ${missing[1].trim()}. Please select a different material with complex permeability data.`;
    }

    const reason = text.replace(/^\[[A-Z_]+\]\s*/, '').trim();
    return reason === '' ? `Error calculating ${what}` : `Error calculating ${what}: ${reason}`;
}
