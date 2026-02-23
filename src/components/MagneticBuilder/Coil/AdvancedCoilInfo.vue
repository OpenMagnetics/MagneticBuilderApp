<script setup>
import { deepCopy, formatUnit, removeTrailingZeroes } from '/WebSharedComponents/assets/js/utils.js'
import { useTaskQueueStore } from '../../../stores/taskQueue'
import { useModelSettingsStore } from '../../../stores/modelSettings'
import Magnetic2DVisualizer, { PLOT_MODES } from '/WebSharedComponents/Common/Magnetic2DVisualizer.vue'
import Dimension from '/WebSharedComponents/DataInput/Dimension.vue'
</script>

<script>

export default {
    props: {
        dataTestLabel: {
            type: String,
            default: '',
        },
        masStore: {
            type: Object,
            required: true,
        },
        operatingPointIndex: {
            type: Number,
            default: 0,
        },
    },
    data() {
        const taskQueueStore = useTaskQueueStore();
        const modelSettingsStore = useModelSettingsStore();
        const subscriptions = [];
        const dataUptoDate = true;
        const lastSimulatedModels = "";
        const lastSimulatedMagnetics = "";
        const lastSimulatedFrequency = "";

        return {
            taskQueueStore,
            modelSettingsStore,
            subscriptions,
            dataUptoDate,
            PLOT_MODES,
            forceUpdate: 0,
            resistanceMatrix: null,
            inductanceMatrix: null,
            leakageInductanceMatrix: null,
            couplingCoefficientMatrix: null,
            maxwellCapacitanceMatrix: null,
            capacitanceMatrix: null,
            isCalculating: false,
            isMounted: false,
            calculatingMatrices: false,
            includeFringing: true,
            lastSimulatedModels,
            lastSimulatedMagnetics,
            lastSimulatedFrequency,
            frequencyData: { frequency: 100000 }, // Object for Dimension component v-model
            isUpdatingResistanceOnly: false, // Flag to prevent interference from other triggers
        }
    },
    computed: {
        resistanceMatrixLatex() {
            if (!this.resistanceMatrix) return null;
            return this.formatMatrixAsLatex(this.resistanceMatrix, 'R');
        },
        inductanceMatrixLatex() {
            if (!this.inductanceMatrix) return null;
            return this.formatMatrixAsLatex(this.inductanceMatrix, 'L');
        },
        leakageInductanceMatrixLatex() {
            if (!this.leakageInductanceMatrix) return null;
            return this.formatMatrixAsLatex(this.leakageInductanceMatrix, 'L_{lk}');
        },
        couplingCoefficientMatrixLatex() {
            if (!this.couplingCoefficientMatrix) return null;
            return this.formatMatrixAsLatex(this.couplingCoefficientMatrix, 'k', '');
        },
        maxwellCapacitanceMatrixLatex() {
            if (!this.maxwellCapacitanceMatrix) return null;
            return this.formatMatrixAsLatex(this.maxwellCapacitanceMatrix, 'C_M');
        },
        capacitanceMatrixLatex() {
            if (!this.capacitanceMatrix) return null;
            return this.formatMatrixAsLatex(this.capacitanceMatrix, 'C');
        },
        threeCapacitorModel() {
            // For 2-winding transformers: C1, C2, C3 when terminals B-D are connected
            // This is a simplified representation for specific terminal configurations
            if (!this.capacitanceMatrix || !this.maxwellCapacitanceMatrix) return null;
            
            const numWindings = Object.keys(this.capacitanceMatrix).length;
            if (numWindings !== 2) return null; // 3-capacitor model only for 2 windings
            
            const windingNames = Object.keys(this.capacitanceMatrix).sort();
            const w1 = windingNames[0];
            const w2 = windingNames[1];
            
            // Helper to extract numeric value from matrix entry
            // The capacitance matrix contains ScalarMatrixAtFrequency objects
            // which have a 'magnitude' property that is a map of maps
            const getCapacitanceValue = (winding1, winding2) => {
                const scalarMatrix = this.capacitanceMatrix[winding1]?.[winding2];
                if (!scalarMatrix) return 0;
                
                // Get the magnitude map
                const magnitude = scalarMatrix.magnitude || scalarMatrix.get_magnitude?.();
                if (!magnitude) return 0;
                
                // The magnitude is a map of maps: {turn1: {turn2: DimensionWithTolerance}}
                // For self-capacitance, sum the diagonal elements
                // For mutual capacitance, use the off-diagonal
                let total = 0;
                for (const [key1, innerMap] of Object.entries(magnitude)) {
                    for (const [key2, dimWithTol] of Object.entries(innerMap)) {
                        let value = 0;
                        if (typeof dimWithTol === 'number') {
                            value = dimWithTol;
                        } else if (dimWithTol && typeof dimWithTol === 'object') {
                            if (dimWithTol.nominal !== undefined) value = dimWithTol.nominal;
                            else if (dimWithTol.value !== undefined) value = dimWithTol.value;
                        }
                        total += value;
                    }
                }
                return total;
            };
            
            // Get capacitance values from the capacitance matrix (C11, C22, C12)
            const C11 = getCapacitanceValue(w1, w1);
            const C22 = getCapacitanceValue(w2, w2);
            const C12 = getCapacitanceValue(w1, w2) || getCapacitanceValue(w2, w1);
            
            console.log('[AdvancedCoilInfo] 3-capacitor model values:', { C11, C22, C12 });
            
            // Calculate C1, C2, C3 for the reduced circuit (B connected to D)
            // C1 = C11 + C12, C2 = C22 + C12, C3 = -C12
            const C1 = C11 + C12;
            const C2 = C22 + C12;
            const C3 = -C12;
            
            return {
                C1: C1,
                C2: C2, 
                C3: C3,
                C1_valid: C1 > 0,
                C2_valid: C2 > 0,
                C3_valid: C3 > 0,
                configuration: 'B connected to D (reduced circuit)',
                windingNames: windingNames
            };
        },
        sixCapacitorModel() {
            // For 2-winding transformers: γ1 to γ6 - the complete electrostatic model
            // Based on Cogitore et al. 1994 paper
            if (!this.capacitanceMatrix || !this.maxwellCapacitanceMatrix) return null;

            const numWindings = Object.keys(this.capacitanceMatrix).length;
            if (numWindings !== 2) return null; // 6-capacitor model for 2 windings

            const windingNames = Object.keys(this.capacitanceMatrix).sort();
            const w1 = windingNames[0];  // Primary
            const w2 = windingNames[1];  // Secondary

            // Helper to extract numeric value from ScalarMatrixAtFrequency
            // The maxwellCapacitanceMatrix is a ScalarMatrixAtFrequency with magnitude property
            const getMaxwellValue = (winding1, winding2) => {
                const magnitude = this.maxwellCapacitanceMatrix.magnitude || 
                                  this.maxwellCapacitanceMatrix.get_magnitude?.();
                if (!magnitude) return 0;
                
                const innerMap = magnitude[winding1];
                if (!innerMap) return 0;
                
                const dimWithTol = innerMap[winding2];
                if (!dimWithTol) return 0;
                
                if (typeof dimWithTol === 'number') return dimWithTol;
                if (dimWithTol && typeof dimWithTol === 'object') {
                    if (dimWithTol.nominal !== undefined) return dimWithTol.nominal;
                    if (dimWithTol.value !== undefined) return dimWithTol.value;
                }
                return 0;
            };

            // Get Maxwell capacitance coefficients (C11, C22, C12, C13, C23, C33)
            // C33 represents the capacitance between windings (inter-winding)
            const C11 = getMaxwellValue(w1, w1);
            const C22 = getMaxwellValue(w2, w2);
            const C12 = getMaxwellValue(w1, w2) || getMaxwellValue(w2, w1);

            // For the 6-capacitor model, we need to estimate C13, C23, C33
            // These represent the coupling to the third node (core/ground)
            // We can estimate them from the capacitance matrix
            const getCapacitanceValue = (winding1, winding2) => {
                const scalarMatrix = this.capacitanceMatrix[winding1]?.[winding2];
                if (!scalarMatrix) return 0;
                
                const magnitude = scalarMatrix.magnitude || scalarMatrix.get_magnitude?.();
                if (!magnitude) return 0;
                
                let total = 0;
                for (const [key1, innerMap] of Object.entries(magnitude)) {
                    for (const [key2, dimWithTol] of Object.entries(innerMap)) {
                        let value = 0;
                        if (typeof dimWithTol === 'number') {
                            value = dimWithTol;
                        } else if (dimWithTol && typeof dimWithTol === 'object') {
                            if (dimWithTol.nominal !== undefined) value = dimWithTol.nominal;
                            else if (dimWithTol.value !== undefined) value = dimWithTol.value;
                        }
                        total += value;
                    }
                }
                return total;
            };
            
            const C_self_1 = getCapacitanceValue(w1, w1);
            const C_self_2 = getCapacitanceValue(w2, w2);
            const C_mutual = getCapacitanceValue(w1, w2) || getCapacitanceValue(w2, w1);

            console.log('[AdvancedCoilInfo] 6-capacitor model values:', { C11, C22, C12, C_self_1, C_self_2, C_mutual });

            // Estimate C33 (inter-winding capacitance) and coupling coefficients
            // C13, C23 represent capacitance from each winding to ground/core
            const C33 = Math.abs(C_mutual);  // Inter-winding capacitance
            const C13 = C_self_1 - C11;      // Winding 1 to ground
            const C23 = C_self_2 - C22;      // Winding 2 to ground

            // Calculate the 6 capacitors according to Cogitore paper:
            // γ1 = C13, γ2 = C23 * q^2, γ3 = C33 (approximation)
            // γ4 = C33 + C13 + q*C23
            // γ5 = -q*C23
            // γ6 = -C13
            // where q is the transformation ratio (approximated as 1 for now)
            const q = 1;  // Could be calculated from inductance ratio if needed

            const gamma1 = C13;
            const gamma2 = C23 * q * q;
            const gamma3 = C33;
            const gamma4 = C33 + C13 + q * C23;
            const gamma5 = -q * C23;
            const gamma6 = -C13;

            return {
                // Gamma notation (Cogitore paper)
                gamma1: gamma1,
                gamma2: gamma2,
                gamma3: gamma3,
                gamma4: gamma4,
                gamma5: gamma5,
                gamma6: gamma6,
                // C notation (for schematic labels)
                C1: gamma1,
                C2: gamma2,
                C3: gamma3,
                C4: gamma4,
                C5: gamma5,
                C6: gamma6,
                windingNames: windingNames,
                isComplete: true
            };
        },
        numberOfWindings() {
            if (!this.capacitanceMatrix) return 0;
            return Object.keys(this.capacitanceMatrix).length;
        },
        capacitanceModelInfo() {
            const n = this.numberOfWindings;
            if (n === 0) return null;
            if (n === 1) {
                return {
                    description: 'Single winding: Only self-capacitance',
                    numCapacitors: 1,
                    modelType: 'single'
                };
            } else if (n === 2) {
                return {
                    description: 'Two windings: 3-capacitor (reduced) and 6-capacitor (complete) models available',
                    numCapacitors: 6,
                    modelType: 'two-winding',
                    has3Capacitor: true,
                    has6Capacitor: true
                };
            } else {
                // For n windings, the general model needs n(n+1)/2 capacitors
                const numCapacitors = (n * (n + 1)) / 2;
                return {
                    description: `${n} windings: Full model requires ${numCapacitors} capacitors. Only capacitance matrix shown.`,
                    numCapacitors: numCapacitors,
                    modelType: 'multi-winding',
                    has3Capacitor: false,
                    has6Capacitor: false
                };
            }
        },
    },
    watch: {
        'operatingPointIndex': {
            handler(newValue, oldValue) {
                this.updateFields(this.masStore.mas.outputs);
            },
          deep: true
        },
        'frequencyData.frequency': {
            handler(newValue, oldValue) {
                if (newValue !== oldValue && this.isMounted) {
                    console.log('[AdvancedCoilInfo] Frequency changed to', newValue, 'recalculating resistance matrix');
                    this.calculateMatrices(true); // true = only update resistance matrix
                }
            }
        },
    },
    mounted () {
        this.isMounted = true;
        
        // Initialize frequency from operating point
        const operatingPoint = this.masStore?.mas?.inputs?.operatingPoints?.[this.operatingPointIndex || 0];
        const defaultFrequency = operatingPoint?.excitationsPerWinding?.[0]?.frequency || 100000;
        this.frequencyData.frequency = defaultFrequency;
        console.log('[AdvancedCoilInfo] Initial frequency set to:', this.frequencyData.frequency);
        
        this.subscriptions.push(this.$stateStore.$onAction(({name, args, after}) => {
            after(() => {
                if (name == "closeCoilAdvancedInfo") {
                    this.$stateStore.magneticBuilder.mode.coil = this.$stateStore.MagneticBuilderModes.Basic;
                }
                if (name == "resimulate") {
                    console.log('[AdvancedCoilInfo] resimulate triggered, recalculating matrices');
                    this.dataUptoDate = false;
                    this.forceUpdate++;
                    // Don't trigger full recalculation if we're in the middle of a resistance-only update
                    if (!this.isUpdatingResistanceOnly) {
                        this.calculateMatrices();
                    }
                }
            });
        }))
        this.subscriptions.push(this.taskQueueStore.$onAction(({name, args, after}) => {
            after(() => {
                if (name == "wind" || name == "windPlanar") {
                    this.dataUptoDate = false;
                }
                if (name == "wound" || name == "planarWound" || name == "coreShapeProcessed" || name == "coreMaterialProcessed" || name == "coreProcessed") {
                    if (args[0]) {
                        this.dataUptoDate = false;
                        this.forceUpdate++;
                        // Don't trigger full recalculation if we're in the middle of a resistance-only update
                        if (!this.isUpdatingResistanceOnly) {
                            this.calculateMatrices();
                        }
                    }
                    else {
                        console.error(args[1])
                        this.dataUptoDate = false;
                    }
                }
            });
        }))
        
        // Initial calculation - wait for modelSettings to be initialized first
        this.waitForModelSettingsAndCalculate();
    },
    beforeUnmount () {
        this.isMounted = false;
        this.isCalculating = false;
        this.subscriptions.forEach((subscription) => {subscription();})
    },
    methods: {
    waitForModelSettingsAndCalculate() {
        // Wait for modelSettings to be initialized AND have valid models before calculating
        if (this.modelSettingsStore.isInitialized && 
            this.modelSettingsStore.strayCapacitanceModel &&
            Object.keys(this.modelSettingsStore.availableStrayCapacitanceModels).length > 0) {
            if (this.isMounted) {
                this.calculateMatrices();
            }
        } else {
            // Check again in 100ms
            setTimeout(() => this.waitForModelSettingsAndCalculate(), 100);
        }
    },
        onFrequencyUpdate() {
            // The frequency is automatically updated in frequencyData by the Dimension component
            // The watch on frequencyData.frequency will trigger recalculation
            console.log('[AdvancedCoilInfo] Frequency update triggered, new value:', this.frequencyData.frequency);
        },
        formatMatrixAsLatex(matrix, symbol, unit = '') {
            // Determine unit symbol based on matrix type
            const unitSymbol = unit || this.getUnitForSymbol(symbol);
            
            // Determine decimal precision based on symbol type
            // Coupling coefficient (k) should have 5 decimal places
            const decimals = symbol === 'k' ? 5 : 3;
            
            // Handle the ScalarMatrixAtFrequency format: {frequency: number, magnitude: {name: {name: value}}}
            if (matrix && matrix.magnitude && typeof matrix.magnitude === 'object') {
                const magnitude = matrix.magnitude;
                const windingNames = Object.keys(magnitude).sort();
                
                if (windingNames.length === 0) {
                    return `${symbol} = \\text{N/A}`;
                }
                
                const rows = windingNames.map(rowName => {
                    return windingNames.map(colName => {
                        const val = magnitude[rowName]?.[colName];
                        return this.formatValueWithUnit(val, unitSymbol, decimals);
                    }).join(' & ');
                });
                
                return `${symbol} = \\begin{bmatrix} ${rows.join(' \\\\ ')} \\end{bmatrix}`;
            }
            
            // Handle nested capacitance matrix: {windingName: {windingName: ScalarMatrixAtFrequency}}
            // This structure has winding pairs, each containing a 3x3 matrix
            if (matrix && typeof matrix === 'object' && !Array.isArray(matrix) && !matrix.magnitude) {
                const windingNames = Object.keys(matrix).sort();
                
                if (windingNames.length === 0) {
                    return `${symbol} = \\text{N/A}`;
                }
                
                // Check if this is the nested capacitance structure
                const firstWinding = matrix[windingNames[0]];
                if (firstWinding && typeof firstWinding === 'object') {
                    const secondLevelKeys = Object.keys(firstWinding);
                    if (secondLevelKeys.length > 0) {
                        const sample = firstWinding[secondLevelKeys[0]];
                        // Check if it's a ScalarMatrixAtFrequency (has magnitude property)
                        if (sample && sample.magnitude) {
                            // Debug: log the structure
                            console.log('[formatMatrixAsLatex] Capacitance matrix structure:', {
                                sample: sample,
                                sampleMagnitude: sample.magnitude,
                                sampleMagnitudeKeys: Object.keys(sample.magnitude),
                                firstValue: sample.magnitude[Object.keys(sample.magnitude)[0]]
                            });
                            
                            // This is a winding-to-winding capacitance map from calculate_capacitance_matrix
                            // The magnitude contains the actual capacitance value directly
                            const rows = windingNames.map(rowName => {
                                return windingNames.map(colName => {
                                    const scalarMatrix = matrix[rowName]?.[colName];
                                    let val = null;
                                    if (scalarMatrix && scalarMatrix.magnitude) {
                                        // The magnitude is a 2D nested structure with turn numbers
                                        // Sum all nominal values to get total capacitance
                                        let total = 0;
                                        for (const turn1 in scalarMatrix.magnitude) {
                                            const turn1Data = scalarMatrix.magnitude[turn1];
                                            if (turn1Data && typeof turn1Data === 'object') {
                                                for (const turn2 in turn1Data) {
                                                    const turn2Data = turn1Data[turn2];
                                                    if (turn2Data && turn2Data.nominal !== undefined) {
                                                        total += turn2Data.nominal;
                                                    }
                                                }
                                            }
                                        }
                                        val = total;
                                    }
                                    return this.formatValueWithUnit(val, unitSymbol, decimals);
                                }).join(' & ');
                            });
                            
                            return `${symbol} = \\begin{bmatrix} ${rows.join(' \\\\ ')} \\end{bmatrix}`;
                        }
                    }
                }
                
                return `${symbol} = \\text{Complex structure}`;
            }
            
            // Legacy array-based matrix format
            if (!matrix || !Array.isArray(matrix) || matrix.length === 0) {
                return `${symbol} = \\text{N/A}`;
            }
            
            const rows = matrix.map(row => {
                if (Array.isArray(row)) {
                    return row.map(val => this.formatValueWithUnit(val, unitSymbol, decimals)).join(' & ');
                }
                return this.formatValueWithUnit(row, unitSymbol, decimals);
            });
            
            return `${symbol} = \\begin{bmatrix} ${rows.join(' \\\\ ')} \\end{bmatrix}`;
        },
        getUnitForSymbol(symbol) {
            const unitMap = {
                'R': 'Ω',
                'L': 'H',
                'L_{lk}': 'H',
                'C': 'F',
                'C_M': 'F'
            };
            return unitMap[symbol] || '';
        },
        swapIncludeFringing() {
            this.includeFringing = !this.includeFringing;
        },
        formatValueWithUnit(val, unitSymbol, decimals = 3) {
            if (val === null || val === undefined) return '0';
            
            // Handle object with nominal property
            let num = val;
            if (typeof val === 'object') {
                if (val.nominal !== undefined) {
                    num = val.nominal;
                } else if (val.value !== undefined) {
                    num = val.value;
                } else {
                    return '0';
                }
            }
            
            // Ensure num is a number
            if (typeof num !== 'number' || isNaN(num)) {
                num = parseFloat(num);
                if (isNaN(num)) return '0';
            }
            
            if (Math.abs(num) < 1e-15) return '0';
            
            // Handle dimensionless values (empty unit)
            if (!unitSymbol || unitSymbol === '') {
                // Format as plain number with reasonable precision
                if (Math.abs(num) >= 0.01 && Math.abs(num) < 1000) {
                    return num.toFixed(decimals).replace(/\.?0+$/, '');
                }
                return num.toExponential(2);
            }
            
            // Use formatUnit for proper scaling and removeTrailingZeroes for clean display
            const { label, unit } = formatUnit(num, unitSymbol);
            const cleanLabel = removeTrailingZeroes(label, decimals);
            
            // Convert unit to LaTeX, properly handling Greek letters outside \text{}
            // Split unit into parts: prefix (text) + base unit (may have Greek)
            const latexUnit = this.convertUnitToLatex(unit);
            
            return `${cleanLabel}\\,${latexUnit}`;
        },
        convertUnitToLatex(unit) {
            // Map of Unicode to LaTeX commands (must be outside \text{})
            const greekMap = {
                'Ω': '\\Omega',
                'μ': '\\mu',
                '°': '^{\\circ}'
            };
            
            // Build LaTeX string, wrapping non-Greek chars in \text{} and Greek in math mode
            let result = '';
            let textBuffer = '';
            
            for (const char of unit) {
                if (greekMap[char]) {
                    // Flush text buffer first
                    if (textBuffer) {
                        result += `\\text{${textBuffer}}`;
                        textBuffer = '';
                    }
                    result += greekMap[char];
                } else {
                    textBuffer += char;
                }
            }
            
            // Flush remaining text buffer
            if (textBuffer) {
                result += `\\text{${textBuffer}}`;
            }
            
            return result;
        },
        formatValue(val) {
            if (val === null || val === undefined) return '0';
            
            // Handle object with nominal property
            let num = val;
            if (typeof val === 'object') {
                if (val.nominal !== undefined) {
                    num = val.nominal;
                } else if (val.value !== undefined) {
                    num = val.value;
                } else {
                    // Unknown object structure, return 0
                    return '0';
                }
            }
            
            // Ensure num is a number
            if (typeof num !== 'number' || isNaN(num)) {
                num = parseFloat(num);
                if (isNaN(num)) return '0';
            }
            
            if (Math.abs(num) < 1e-12) return '0';
            if (Math.abs(num) >= 1e-3 && Math.abs(num) < 1e6) {
                return num.toFixed(4);
            }
            return num.toExponential(2);
        },
        formatCapacitance(val) {
            // Format capacitance value with appropriate units (F, nF, pF)
            if (val === null || val === undefined) return '0';
            
            let num = val;
            if (typeof val === 'object') {
                if (val.nominal !== undefined) num = val.nominal;
                else if (val.value !== undefined) num = val.value;
                else return '0';
            }
            
            if (typeof num !== 'number' || isNaN(num)) {
                num = parseFloat(num);
                if (isNaN(num)) return '0';
            }
            
            const absVal = Math.abs(num);
            if (absVal < 1e-15) return '0';
            
            // Choose appropriate unit and scale
            if (absVal >= 1e-6) {
                return `${(num * 1e6).toFixed(2)} \\mu\\text{F}`;
            } else if (absVal >= 1e-9) {
                return `${(num * 1e9).toFixed(2)} \\text{nF}`;
            } else if (absVal >= 1e-12) {
                return `${(num * 1e12).toFixed(2)} \\text{pF}`;
            } else {
                return `${num.toExponential(2)} \\text{F}`;
            }
        },
        // Helper to safely set reactive data only if component is still mounted
        safeSet(key, value) {
            if (this.isMounted) {
                this[key] = value;
            }
        },
        async calculateMatrices(onlyResistance = false) {
            // Prevent multiple simultaneous calculations
            if (this.isCalculating) {
                // If we're already calculating and this is a resistance-only update, 
                // let the current calculation finish (it will use the new frequency)
                if (onlyResistance) {
                    return;
                }
                // If we're in the middle of a resistance-only update, wait for it
                if (this.isUpdatingResistanceOnly) {
                    return;
                }
            }
            
            if (onlyResistance) {
                this.isUpdatingResistanceOnly = true;
            }
            
            // Require full magnetic data including core and coil processing
            const magnetic = this.masStore.mas?.magnetic;
            
            if (!magnetic?.coil?.turnsDescription || !magnetic?.core?.processedDescription) {
                return;
            }
            
            // Validate coil has actual turn data
            const hasActualTurns = magnetic.coil.turnsDescription.length > 0 && 
                                   magnetic.coil.turnsDescription[0]?.length > 0;
            
            if (!hasActualTurns) {
                console.warn('[AdvancedCoilInfo] No actual turns data available, skipping matrix calculations');
                return;
            }
            
            // Validate functional description exists
            const hasFunctionalDescription = magnetic.coil.functionalDescription && 
                                            magnetic.coil.functionalDescription.length > 0;
            
            if (!hasFunctionalDescription) {
                console.warn('[AdvancedCoilInfo] No functional description available, skipping matrix calculations');
                return;
            }
            
            // Check for pending simulation models
            const pendingModels = this.$stateStore.pendingSimulationModels;
            console.log('[AdvancedCoilInfo] pendingSimulationModels:', pendingModels);
            
            // Build modelsData with pending models or store values
            const modelsData = {
                coreLosses: this.$userStore?.selectedModels?.['coreLosses'] || 'IGSE',
                coreTemperature: this.$userStore?.selectedModels?.['coreTemperature'] || 'Maniktala',
                gapReluctance: this.$userStore?.selectedModels?.['gapReluctance'] || 'Zhang',
                magneticFieldStrength: pendingModels?.magneticFieldStrengthModel || this.modelSettingsStore.magneticFieldStrengthModel,
                magneticFieldStrengthFringingEffect: pendingModels?.magneticFieldStrengthFringingEffectModel || this.modelSettingsStore.magneticFieldStrengthFringingEffectModel,
                reluctance: pendingModels?.reluctanceModel || this.modelSettingsStore.reluctanceModel,
                strayCapacitance: pendingModels?.strayCapacitanceModel || this.modelSettingsStore.strayCapacitanceModel,
                windingSkinEffectLosses: pendingModels?.windingSkinEffectLossesModel || this.modelSettingsStore.windingSkinEffectLossesModel,
                windingProximityEffectLosses: pendingModels?.windingProximityEffectLossesModel || this.modelSettingsStore.windingProximityEffectLossesModel,
            };
            
            // Check cache to avoid unnecessary recalculation
            const magneticsString = JSON.stringify(magnetic);
            const modelsString = JSON.stringify(modelsData);
            const frequencyString = String(this.frequencyData.frequency);
            
            // Check if we only need to update resistance (frequency change only)
            if (onlyResistance) {
                // For frequency-only updates, we still need to recalculate resistance
                // but skip the cache check and other matrices
                console.log('[AdvancedCoilInfo] Frequency-only update - recalculating only resistance matrix');
            } else if (magneticsString === this.lastSimulatedMagnetics && 
                modelsString === this.lastSimulatedModels) {
                console.log('[AdvancedCoilInfo] Cache hit - skipping matrix recalculation');
                this.dataUptoDate = true;
                return;
            }
            
            console.log('[AdvancedCoilInfo] Cache miss - recalculating matrices with models:', modelsData);
            
            this.isCalculating = true;
            this.calculatingMatrices = true;
            
            try {
                const operatingPoint = this.masStore.mas.inputs?.operatingPoints?.[this.operatingPointIndex];
                // Use the frequency from the input, or fall back to operating point frequency
                const frequency = this.frequencyData.frequency || operatingPoint?.excitationsPerWinding?.[0]?.frequency || 100000;
                const temperature = operatingPoint?.conditions?.ambientTemperature || 25;
                
                // Validate we have required coil data for matrix calculations
                const coil = magnetic.coil;
                const hasLayers = coil.layersDescription && coil.layersDescription.length > 0;
                const hasTurns = coil.turnsDescription && coil.turnsDescription.length > 0;
                
                // Calculate resistance matrix (requires turns with coordinates)
                if (hasTurns) {
                    try {
                        const resistanceData = await this.taskQueueStore.calculateResistanceMatrix(magnetic, temperature, frequency);
                        // Format is {frequency: number, magnitude: {windingName: {windingName: value}}}
                        if (resistanceData && resistanceData.magnitude) {
                            this.safeSet('resistanceMatrix', resistanceData);
                        } else if (resistanceData && Array.isArray(resistanceData)) {
                            this.safeSet('resistanceMatrix', resistanceData);
                        } else {
                            this.safeSet('resistanceMatrix', null);
                        }
                    } catch (e) {
                        console.error('Resistance matrix error:', e.message || e);
                        this.safeSet('resistanceMatrix', null);
                    }
                } else {
                    this.safeSet('resistanceMatrix', null);
                }
                
                // Skip other matrices if only updating resistance
                if (onlyResistance) {
                    this.isCalculating = false;
                    this.calculatingMatrices = false;
                    this.isUpdatingResistanceOnly = false;
                    this.lastSimulatedFrequency = frequencyString;
                    return;
                }
                
                // Calculate inductance matrix (requires core processing)
                if (magnetic.core?.processedDescription?.effectiveParameters) {
                    try {
                        const inductanceData = await this.taskQueueStore.calculateInductanceMatrix(magnetic, frequency, modelsData);
                        // Format is {frequency: number, magnitude: {windingName: {windingName: value}}}
                        if (inductanceData && inductanceData.magnitude) {
                            this.safeSet('inductanceMatrix', inductanceData);
                        } else if (inductanceData && Array.isArray(inductanceData)) {
                            this.safeSet('inductanceMatrix', inductanceData);
                        } else {
                            this.safeSet('inductanceMatrix', null);
                        }
                    } catch (e) {
                        console.error('Inductance matrix error:', e.message || e);
                        this.safeSet('inductanceMatrix', null);
                    }

                    // Calculate leakage inductance matrix
                    try {
                        const leakageInductanceData = await this.taskQueueStore.calculateLeakageInductanceMatrix(magnetic, frequency, modelsData);
                        // Format is {frequency: number, magnitude: {windingName: {windingName: value}}}
                        if (leakageInductanceData && leakageInductanceData.magnitude) {
                            this.safeSet('leakageInductanceMatrix', leakageInductanceData);
                        } else if (leakageInductanceData && Array.isArray(leakageInductanceData)) {
                            this.safeSet('leakageInductanceMatrix', leakageInductanceData);
                        } else {
                            this.safeSet('leakageInductanceMatrix', null);
                        }
                    } catch (e) {
                        console.error('Leakage inductance matrix error:', e.message || e);
                        this.safeSet('leakageInductanceMatrix', null);
                    }

                    // Calculate coupling coefficient matrix
                    try {
                        const couplingData = await this.taskQueueStore.calculateCouplingCoefficientMatrix(magnetic, frequency, modelsData);
                        if (couplingData && couplingData.magnitude) {
                            this.safeSet('couplingCoefficientMatrix', couplingData);
                        } else {
                            this.safeSet('couplingCoefficientMatrix', null);
                        }
                    } catch (e) {
                        console.error('Coupling coefficient matrix error:', e.message || e);
                        this.safeSet('couplingCoefficientMatrix', null);
                    }
                } else {
                    this.safeSet('inductanceMatrix', null);
                    this.safeSet('leakageInductanceMatrix', null);
                    this.safeSet('couplingCoefficientMatrix', null);
                }
                
                // Calculate capacitance matrices (requires layers)
                if (hasLayers && operatingPoint && coil) {
                    try {
                        // Skip if model isn't valid
                        if (!modelsData.strayCapacitance) {
                            console.warn('[AdvancedCoilInfo] No stray capacitance model selected, skipping capacitance calculation');
                            this.safeSet('maxwellCapacitanceMatrix', null);
                            this.safeSet('capacitanceMatrix', null);
                        } else {
                            // Validate coil has required geometric data
                            if (!coil.layersDescription || coil.layersDescription.length === 0) {
                                console.warn('[AdvancedCoilInfo] Coil missing layers description, skipping capacitance calculation');
                                this.safeSet('maxwellCapacitanceMatrix', null);
                                this.safeSet('capacitanceMatrix', null);
                            } else {
                                const capacitanceData = await this.taskQueueStore.calculateStrayCapacitance(
                                    coil,
                                    operatingPoint,
                                    modelsData
                                );
                                
                                if (capacitanceData) {
                                    // Use the maxwellCapacitanceMatrix directly from capacitanceData if available
                                    if (capacitanceData.maxwellCapacitanceMatrix && capacitanceData.maxwellCapacitanceMatrix.length > 0) {
                                        // It's an array of ScalarMatrixAtFrequency, take the first one
                                        this.safeSet('maxwellCapacitanceMatrix', capacitanceData.maxwellCapacitanceMatrix[0]);
                                    } else if (capacitanceData.capacitanceAmongWindings) {
                                        // Fall back to calculating separately
                                        try {
                                            const maxwellData = await this.taskQueueStore.calculateMaxwellCapacitanceMatrix(
                                                coil,
                                                capacitanceData.capacitanceAmongWindings
                                            );
                                            if (maxwellData && Array.isArray(maxwellData) && maxwellData.length > 0) {
                                                this.safeSet('maxwellCapacitanceMatrix', maxwellData[0]);
                                            } else {
                                                this.safeSet('maxwellCapacitanceMatrix', null);
                                            }
                                        } catch (e) {
                                            console.error('Maxwell matrix error:', e.message || e);
                                            this.safeSet('maxwellCapacitanceMatrix', null);
                                        }
                                    }
                                    
                                    // Extract capacitance matrix from stray capacitance data
                                    if (capacitanceData.capacitanceMatrix) {
                                        this.safeSet('capacitanceMatrix', capacitanceData.capacitanceMatrix);
                                    } else {
                                        this.safeSet('capacitanceMatrix', null);
                                    }
                                    
                                    // Get proper capacitance matrix from mkf.calculate_capacitance_matrix
                                    try {
                                        const properCapMatrix = await this.taskQueueStore.calculateCapacitanceMatrix(
                                            coil,
                                            modelsData
                                        );
                                        if (properCapMatrix && Array.isArray(properCapMatrix) && properCapMatrix.length > 0) {
                                            this.safeSet('capacitanceMatrix', properCapMatrix[0]);
                                        }
                                    } catch (capMatrixError) {
                                        console.warn('[AdvancedCoilInfo] Could not calculate proper capacitance matrix:', capMatrixError.message || capMatrixError);
                                    }
                                }
                            }
                        }
                    } catch (e) {
                        console.error('Stray capacitance error:', e.message || e);
                        this.safeSet('maxwellCapacitanceMatrix', null);
                        this.safeSet('capacitanceMatrix', null);
                    }
                } else {
                    this.safeSet('maxwellCapacitanceMatrix', null);
                    this.safeSet('capacitanceMatrix', null);
                }
                
                if (this.isMounted) {
                    this.dataUptoDate = true;
                    // Update cache after successful calculation
                    this.lastSimulatedMagnetics = magneticsString;
                    this.lastSimulatedModels = modelsString;
                    this.lastSimulatedFrequency = frequencyString;
                    console.log('[AdvancedCoilInfo] Cache updated with new models');
                }
            } catch (e) {
                console.error('Error calculating matrices:', e);
            } finally {
                this.isCalculating = false;
                this.isUpdatingResistanceOnly = false;
                if (this.isMounted) {
                    this.calculatingMatrices = false;
                }
            }
        },
        createPlaceholderMatrix(size) {
            const matrix = [];
            for (let i = 0; i < size; i++) {
                const row = [];
                for (let j = 0; j < size; j++) {
                    row.push(i === j ? 1e-6 : 1e-9);
                }
                matrix.push(row);
            }
            return matrix;
        },
        buildInductanceMatrix(leakageInductances) {
            const size = leakageInductances.length;
            const matrix = [];
            for (let i = 0; i < size; i++) {
                const row = [];
                for (let j = 0; j < size; j++) {
                    if (i === j) {
                        // Diagonal: self inductance
                        const val = leakageInductances[i]?.nominal || leakageInductances[i] || 0;
                        row.push(val);
                    } else {
                        // Off-diagonal: mutual inductance (approximation)
                        row.push(0);
                    }
                }
                matrix.push(row);
            }
            return matrix;
        },
    }
}
</script>

<template>
    <div class="container-fluid" :style="$styleStore.magneticBuilder.main">
        <div
            class="row"
            :style="dataUptoDate ? 'opacity: 100%;' : 'opacity: 60%;'"
        >
            <!-- Left Column: Resistance -->
            <div class="col-4">
                <h5 class="text-center mb-2">Resistance</h5>
                <!-- Wire Losses Plot -->
                <div>
                    <Magnetic2DVisualizer 
                        v-if="masStore.mas?.magnetic?.coil?.turnsDescription"
                        :modelValue="masStore.mas"
                        :forceUpdate="forceUpdate"
                        :operatingPointIndex="operatingPointIndex"
                        :enableZoom="true"
                        :enableOptions="false"
                        :plotModeInit="PLOT_MODES.WIRES_LOSSES"
                        :availablePlotModes="[PLOT_MODES.WIRES_LOSSES]"
                        :backgroundColor="$styleStore.magneticBuilder.main['background-color']"
                        :textColor="$styleStore.magneticBuilder.main['color']"
                    />
                    <div v-else class="d-flex align-items-center justify-content-center h-100 text-muted">
                        No coil data available
                    </div>
                </div>
                <div v-if="masStore.mas?.magnetic?.coil?.turnsDescription" class="text-center">
                    <small class="text-muted d-block"><i class="fas fa-info-circle"></i> Hover over the image to see values</small>
                </div>
                <!-- Frequency Input for Resistance Calculation -->
                <div class="mt-2 mb-2">
                    <Dimension
                        :name="'frequency'"
                        :replaceTitle="'Frequency'"
                        unit="Hz"
                        :min="1000"
                        :max="10000000"
                        v-model="frequencyData"
                        @update="onFrequencyUpdate"
                        :labelWidthProportionClass="'col-5'"
                        :valueWidthProportionClass="'col-7'"
                        :valueFontSize="$styleStore.magneticBuilder.inputFontSize || '14px'"
                        :labelFontSize="$styleStore.magneticBuilder.inputLabelFontSize || '14px'"
                        :labelBgColor="'transparent'"
                        :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor || '#3a3a3a'"
                        :textColor="$styleStore.magneticBuilder.inputTextColor || '#fff'"
                    />
                </div>
                <!-- Resistance Matrix -->
                <div class="text-center mt-2">
                    <div v-if="calculatingMatrices" class="text-muted">
                        <i class="fas fa-spinner fa-spin"></i> Calculating...
                    </div>
                    <vue-latex
                        v-else-if="resistanceMatrixLatex && resistanceMatrix"
                        :expression="resistanceMatrixLatex"
                        :display-mode="true"
                        :fontsize="16"
                    />
                    <div v-else class="text-muted small">
                        <em>No resistance data available</em>
                    </div>
                </div>
            </div>

            <!-- Middle Column: Leakage Inductance -->
            <div class="col-4">
                <h5 class="text-center mb-2">Leakage Inductance</h5>
                <!-- Magnetic Field Plot -->
                <div>
                    <Magnetic2DVisualizer 
                        v-if="masStore.mas?.magnetic?.coil?.turnsDescription"
                        :modelValue="masStore.mas"
                        :forceUpdate="forceUpdate"
                        :operatingPointIndex="operatingPointIndex"
                        :enableZoom="true"
                        :enableOptions="false"
                        :enableFringingOption="true"
                        :plotModeInit="PLOT_MODES.MAGNETIC_FIELD"
                        :availablePlotModes="[PLOT_MODES.MAGNETIC_FIELD]"
                        :includeFringingInit="includeFringing"
                        @swapIncludeFringing="swapIncludeFringing"
                        :backgroundColor="$styleStore.magneticBuilder.main['background-color']"
                        :textColor="$styleStore.magneticBuilder.main['color']"
                    />
                    <div v-else class="d-flex align-items-center justify-content-center h-100 text-muted">
                        No coil data available
                    </div>
                </div>
                <div v-if="masStore.mas?.magnetic?.coil?.turnsDescription" class="text-center">
                    <small class="text-muted d-block"><i class="fas fa-info-circle"></i> Hover over the image to see values</small>
                </div>
                <!-- Inductance Matrix -->
                <div class="text-center mt-2">
                    <span class="text-muted d-block">Inductance Matrix</span>
                    <div v-if="calculatingMatrices" class="text-muted">
                        <i class="fas fa-spinner fa-spin"></i> Calculating...
                    </div>
                    <vue-latex
                        v-else-if="inductanceMatrixLatex"
                        :expression="inductanceMatrixLatex"
                        :display-mode="true"
                        :fontsize="16"
                    />
                    <div v-else class="text-muted small">
                        <em>No inductance data</em>
                    </div>
                </div>
                <!-- Leakage Inductance Matrix -->
                <div class="text-center mt-2">
                    <span class="text-muted d-block">Leakage Inductance Matrix</span>
                    <div v-if="calculatingMatrices" class="text-muted">
                        <i class="fas fa-spinner fa-spin"></i> Calculating...
                    </div>
                    <vue-latex
                        v-else-if="leakageInductanceMatrixLatex"
                        :expression="leakageInductanceMatrixLatex"
                        :display-mode="true"
                        :fontsize="16"
                    />
                    <div v-else class="text-muted small">
                        <em>No leakage inductance data</em>
                    </div>
                </div>
                <!-- Coupling Coefficient Matrix -->
                <div class="text-center mt-2">
                    <span class="text-muted d-block">Coupling Coefficient</span>
                    <div v-if="calculatingMatrices" class="text-muted">
                        <i class="fas fa-spinner fa-spin"></i> Calculating...
                    </div>
                    <vue-latex
                        v-else-if="couplingCoefficientMatrixLatex"
                        :expression="couplingCoefficientMatrixLatex"
                        :display-mode="true"
                        :fontsize="16"
                    />
                    <div v-else class="text-muted small">
                        <em>No coupling data</em>
                    </div>
                </div>
            </div>

            <!-- Right Column: Stray Capacitance -->
            <div class="col-4">
                <h5 class="text-center mb-2">Stray Capacitance</h5>
                <!-- Electric Field Plot -->
                <div>
                    <Magnetic2DVisualizer 
                        v-if="masStore.mas?.magnetic?.coil?.turnsDescription"
                        :modelValue="masStore.mas"
                        :forceUpdate="forceUpdate"
                        :operatingPointIndex="operatingPointIndex"
                        :enableZoom="true"
                        :enableOptions="false"
                        :plotModeInit="PLOT_MODES.ELECTRIC_FIELD"
                        :availablePlotModes="[PLOT_MODES.ELECTRIC_FIELD]"
                        :backgroundColor="$styleStore.magneticBuilder.main['background-color']"
                        :textColor="$styleStore.magneticBuilder.main['color']"
                    />
                    <div v-else class="d-flex align-items-center justify-content-center h-100 text-muted">
                        No coil data available
                    </div>
                </div>
                <div v-if="masStore.mas?.magnetic?.coil?.turnsDescription" class="text-center">
                    <small class="text-muted d-block"><i class="fas fa-info-circle"></i> Hover over the image to see values</small>
                </div>
                <!-- Capacitance Matrices -->
                <div class="text-center mt-2">
                    <span class="text-muted d-block">Capacitance Matrix</span>
                    <div v-if="calculatingMatrices" class="text-muted">
                        <i class="fas fa-spinner fa-spin"></i> Calculating...
                    </div>
                    <vue-latex
                        v-else-if="capacitanceMatrixLatex && capacitanceMatrix"
                        :expression="capacitanceMatrixLatex"
                        :display-mode="true"
                        :fontsize="16"
                    />
                    <div v-else class="text-muted small">
                        <em>No capacitance data available</em>
                    </div>
                    
                    <span class="text-muted d-block mt-2">Maxwell Capacitance Matrix</span>
                    <div v-if="calculatingMatrices" class="text-muted">
                        <i class="fas fa-spinner fa-spin"></i> Calculating...
                    </div>
                    <vue-latex
                        v-else-if="maxwellCapacitanceMatrixLatex && maxwellCapacitanceMatrix"
                        :expression="maxwellCapacitanceMatrixLatex"
                        :display-mode="true"
                        :fontsize="16"
                    />
                    <div v-else class="text-muted small">
                        <em>No Maxwell capacitance data available</em>
                    </div>
                    
                    <!-- 3C Capacitor Model -->
                    <div v-if="threeCapacitorModel" class="mt-2">
                        <div class="mt-2 p-2 border rounded" style="background-color: #2a2a2a; border-color: #444;">
                            <small class="d-block mb-2 text-white"><strong>3 Capacitor Model</strong></small>
                            
                            <!-- 3-Capacitor Equivalent Circuit Diagram -->
                            <svg viewBox="0 0 320 230" class="w-100" style="max-width: 300px; height: auto; display: block; margin: 0 auto;">
                                <!-- Left Port (Primary) - Terminals A and B -->
                                <!-- Terminal A -->
                                <circle cx="60" cy="40" r="4" fill="#fff" stroke="#fff" stroke-width="2"/>
                                <text x="48" y="35" font-size="14" fill="#fff" font-weight="bold">A</text>
                                
                                <!-- Terminal B -->
                                <circle cx="60" cy="160" r="4" fill="#fff" stroke="#fff" stroke-width="2"/>
                                <text x="48" y="175" font-size="14" fill="#fff" font-weight="bold">B</text>
                                
                                <!-- Left winding connections -->
                                <line x1="60" y1="40" x2="100" y2="40" stroke="#fff" stroke-width="2"/>
                                <line x1="60" y1="160" x2="100" y2="160" stroke="#fff" stroke-width="2"/>
                                
                                <!-- Left winding (inductor symbol) - 5 loops, ends down toward bottom -->
                                <path d="M 100 40 Q 115 40 115 52 Q 115 64 100 64 Q 85 64 85 76 Q 85 88 100 88 Q 115 88 115 100 Q 115 112 100 112 Q 85 112 85 124 Q 85 136 100 136 Q 115 136 115 148 Q 115 160 100 160" 
                                      stroke="#fff" stroke-width="2" fill="none"/>
                                
                                <!-- Transformer Core (two vertical bars) - smaller -->
                                <line x1="150" y1="50" x2="150" y2="150" stroke="#fff" stroke-width="3"/>
                                <line x1="165" y1="50" x2="165" y2="150" stroke="#fff" stroke-width="3"/>
                                
                                <!-- Right winding (inductor symbol) - 5 loops, ends down toward bottom -->
                                <path d="M 215 40 Q 200 40 200 52 Q 200 64 215 64 Q 230 64 230 76 Q 230 88 215 88 Q 200 88 200 100 Q 200 112 215 112 Q 230 112 230 124 Q 230 136 215 136 Q 200 136 200 148 Q 200 160 215 160" 
                                      stroke="#fff" stroke-width="2" fill="none"/>
                                
                                <!-- Right winding connections -->
                                <line x1="215" y1="40" x2="255" y2="40" stroke="#fff" stroke-width="2"/>
                                <line x1="215" y1="160" x2="255" y2="160" stroke="#fff" stroke-width="2"/>
                                
                                <!-- Right Port (Secondary) - Terminals C and D -->
                                <!-- Terminal C -->
                                <circle cx="255" cy="40" r="4" fill="#fff" stroke="#fff" stroke-width="2"/>
                                <text x="265" y="35" font-size="14" fill="#fff" font-weight="bold">C</text>
                                
                                <!-- Terminal D -->
                                <circle cx="255" cy="160" r="4" fill="#fff" stroke="#fff" stroke-width="2"/>
                                <text x="265" y="175" font-size="14" fill="#fff" font-weight="bold">D</text>
                                
                                <!-- C1 Capacitor between A and B - rotated 90°, centered on left side, larger -->
                                <line x1="5" y1="92" x2="35" y2="92" stroke="#fff" stroke-width="2.5"/>
                                <line x1="5" y1="108" x2="35" y2="108" stroke="#fff" stroke-width="2.5"/>
                                <!-- Connections to capacitor -->
                                <line x1="20" y1="40" x2="20" y2="92" stroke="#fff" stroke-width="1.5"/>
                                <line x1="20" y1="108" x2="20" y2="160" stroke="#fff" stroke-width="1.5"/>
                                <line x1="60" y1="40" x2="20" y2="40" stroke="#fff" stroke-width="1.5"/>
                                <line x1="60" y1="160" x2="20" y2="160" stroke="#fff" stroke-width="1.5"/>
                                <text x="40" y="102" font-size="14" fill="#fff" font-style="italic" font-weight="bold">C₁</text>
                                
                                <!-- C2 Capacitor between C and D - rotated 90°, centered on right side, larger -->
                                <line x1="285" y1="92" x2="315" y2="92" stroke="#fff" stroke-width="2.5"/>
                                <line x1="285" y1="108" x2="315" y2="108" stroke="#fff" stroke-width="2.5"/>
                                <!-- Connections to capacitor -->
                                <line x1="300" y1="40" x2="300" y2="92" stroke="#fff" stroke-width="1.5"/>
                                <line x1="300" y1="108" x2="300" y2="160" stroke="#fff" stroke-width="1.5"/>
                                <line x1="255" y1="40" x2="300" y2="40" stroke="#fff" stroke-width="1.5"/>
                                <line x1="255" y1="160" x2="300" y2="160" stroke="#fff" stroke-width="1.5"/>
                                <text x="265" y="102" font-size="14" fill="#fff" font-style="italic" font-weight="bold">C₂</text>
                                
                                <!-- C3 Capacitor between B and D - vertical, centered on the wire connecting B and D, larger, plates closer -->
                                <line x1="147" y1="174" x2="147" y2="198" stroke="#fff" stroke-width="2.5"/>
                                <line x1="163" y1="174" x2="163" y2="198" stroke="#fff" stroke-width="2.5"/>
                                
                                <!-- Connections from B and D to capacitor -->
                                <line x1="60" y1="186" x2="147" y2="186" stroke="#fff" stroke-width="1.5"/>
                                <line x1="147" y1="186" x2="147" y2="174" stroke="#fff" stroke-width="1.5"/>
                                <line x1="255" y1="186" x2="163" y2="186" stroke="#fff" stroke-width="1.5"/>
                                <line x1="163" y1="186" x2="163" y2="174" stroke="#fff" stroke-width="1.5"/>
                                
                                <!-- Vertical drops from terminals B and D to horizontal line -->
                                <line x1="60" y1="160" x2="60" y2="186" stroke="#fff" stroke-width="1.5"/>
                                <line x1="255" y1="160" x2="255" y2="186" stroke="#fff" stroke-width="1.5"/>
                                
                                <text x="172" y="168" font-size="14" fill="#fff" font-style="italic" font-weight="bold">C₃</text>
                            </svg>
                            
                            <!-- 3C Values displayed below schematic -->
                            <div class="mt-2 small text-center" style="color: #fff;">
                                <div class="d-inline-block mx-2">
                                    <vue-latex :expression="`C_1 = ${formatCapacitance(threeCapacitorModel.C1)}`" :fontsize="13" />
                                </div>
                                <div class="d-inline-block mx-2">
                                    <vue-latex :expression="`C_2 = ${formatCapacitance(threeCapacitorModel.C2)}`" :fontsize="13" />
                                </div>
                                <div class="d-inline-block mx-2">
                                    <vue-latex :expression="`C_3 = ${formatCapacitance(threeCapacitorModel.C3)}`" :fontsize="13" />
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 6C Capacitor Model -->
                    <div v-if="sixCapacitorModel && sixCapacitorModel.isComplete" class="mt-3">
                        <div class="mt-2 p-2 border rounded" style="background-color: #2a2a2a; border-color: #444;">
                            <small class="d-block mb-2 text-white"><strong>6 Capacitor Model</strong></small>
                            
                            <!-- 6-Capacitor Equivalent Circuit Diagram -->
                            <svg viewBox="0 0 320 240" class="w-100" style="max-width: 300px; height: auto; display: block; margin: 0 auto;">
                                <!-- Left Port (Primary) - Terminals A and B -->
                                <!-- Terminal A -->
                                <circle cx="60" cy="40" r="4" fill="#fff" stroke="#fff" stroke-width="2"/>
                                <text x="48" y="35" font-size="14" fill="#fff" font-weight="bold">A</text>
                                
                                <!-- Terminal B -->
                                <circle cx="60" cy="160" r="4" fill="#fff" stroke="#fff" stroke-width="2"/>
                                <text x="48" y="175" font-size="14" fill="#fff" font-weight="bold">B</text>
                                
                                <!-- Left winding (inductor symbol) - 5 loops -->
                                <path d="M 100 40 Q 115 40 115 52 Q 115 64 100 64 Q 85 64 85 76 Q 85 88 100 88 Q 115 88 115 100 Q 115 112 100 112 Q 85 112 85 124 Q 85 136 100 136 Q 115 136 115 148 Q 115 160 100 160" 
                                      stroke="#fff" stroke-width="2" fill="none" opacity="0.25"/>
                                
                                <!-- Transformer Core -->
                                <line x1="150" y1="50" x2="150" y2="150" stroke="#fff" stroke-width="3" opacity="0.25"/>
                                <line x1="165" y1="50" x2="165" y2="150" stroke="#fff" stroke-width="3" opacity="0.25"/>
                                
                                <!-- Right winding (inductor symbol) - 5 loops -->
                                <path d="M 215 40 Q 200 40 200 52 Q 200 64 215 64 Q 230 64 230 76 Q 230 88 215 88 Q 200 88 200 100 Q 200 112 215 112 Q 230 112 230 124 Q 230 136 215 136 Q 200 136 200 148 Q 200 160 215 160" 
                                      stroke="#fff" stroke-width="2" fill="none" opacity="0.25"/>
                                
                                <!-- Left winding connections (terminal to winding) -->
                                <line x1="60" y1="40" x2="100" y2="40" stroke="#fff" stroke-width="2" opacity="0.25"/>
                                <line x1="60" y1="160" x2="100" y2="160" stroke="#fff" stroke-width="2" opacity="0.25"/>
                                
                                <!-- Right winding connections (terminal to winding) -->
                                <line x1="215" y1="40" x2="255" y2="40" stroke="#fff" stroke-width="2" opacity="0.25"/>
                                <line x1="215" y1="160" x2="255" y2="160" stroke="#fff" stroke-width="2" opacity="0.25"/>
                                
                                <!-- Right Port (Secondary) - Terminals C and D -->
                                <circle cx="255" cy="40" r="4" fill="#fff" stroke="#fff" stroke-width="2"/>
                                <text x="265" y="35" font-size="14" fill="#fff" font-weight="bold">C</text>
                                
                                <circle cx="255" cy="160" r="4" fill="#fff" stroke="#fff" stroke-width="2"/>
                                <text x="265" y="175" font-size="14" fill="#fff" font-weight="bold">D</text>
                                
                                <!-- C1 Capacitor between A and B - rotated 90°, centered on left side, larger -->
                                <line x1="5" y1="92" x2="35" y2="92" stroke="#fff" stroke-width="2.5"/>
                                <line x1="5" y1="108" x2="35" y2="108" stroke="#fff" stroke-width="2.5"/>
                                <line x1="20" y1="40" x2="20" y2="92" stroke="#fff" stroke-width="1.5"/>
                                <line x1="20" y1="108" x2="20" y2="160" stroke="#fff" stroke-width="1.5"/>
                                <line x1="60" y1="40" x2="20" y2="40" stroke="#fff" stroke-width="1.5"/>
                                <line x1="60" y1="160" x2="20" y2="160" stroke="#fff" stroke-width="1.5"/>
                                <text x="40" y="102" font-size="14" fill="#fff" font-style="italic" font-weight="bold">C₁</text>
                                
                                <!-- C2 Capacitor between C and D - rotated 90°, centered on right side, larger -->
                                <line x1="285" y1="92" x2="315" y2="92" stroke="#fff" stroke-width="2.5"/>
                                <line x1="285" y1="108" x2="315" y2="108" stroke="#fff" stroke-width="2.5"/>
                                <line x1="300" y1="40" x2="300" y2="92" stroke="#fff" stroke-width="1.5"/>
                                <line x1="300" y1="108" x2="300" y2="160" stroke="#fff" stroke-width="1.5"/>
                                <line x1="255" y1="40" x2="300" y2="40" stroke="#fff" stroke-width="1.5"/>
                                <line x1="255" y1="160" x2="300" y2="160" stroke="#fff" stroke-width="1.5"/>
                                <text x="265" y="102" font-size="14" fill="#fff" font-style="italic" font-weight="bold">C₂</text>
                                
                                <!-- C3 Capacitor between B and D - vertical, centered on the wire connecting B and D, larger, plates closer -->
                                <line x1="147" y1="174" x2="147" y2="198" stroke="#fff" stroke-width="2.5"/>
                                <line x1="163" y1="174" x2="163" y2="198" stroke="#fff" stroke-width="2.5"/>
                                <line x1="60" y1="186" x2="147" y2="186" stroke="#fff" stroke-width="1.5"/>
                                <line x1="147" y1="186" x2="147" y2="174" stroke="#fff" stroke-width="1.5"/>
                                <line x1="255" y1="186" x2="163" y2="186" stroke="#fff" stroke-width="1.5"/>
                                <line x1="163" y1="186" x2="163" y2="174" stroke="#fff" stroke-width="1.5"/>
                                <line x1="60" y1="160" x2="60" y2="186" stroke="#fff" stroke-width="1.5"/>
                                <line x1="255" y1="160" x2="255" y2="186" stroke="#fff" stroke-width="1.5"/>
                                <text x="172" y="168" font-size="14" fill="#fff" font-style="italic" font-weight="bold">C₃</text>
                                
                                <!-- C4 Capacitor between A and C - vertical, on top of the magnetic core, same distance from core as C3 -->
                                <line x1="147" y1="2" x2="147" y2="26" stroke="#fff" stroke-width="2.5"/>
                                <line x1="163" y1="2" x2="163" y2="26" stroke="#fff" stroke-width="2.5"/>
                                <line x1="60" y1="14" x2="147" y2="14" stroke="#fff" stroke-width="1.5"/>
                                <line x1="147" y1="14" x2="147" y2="26" stroke="#fff" stroke-width="1.5"/>
                                <line x1="255" y1="14" x2="163" y2="14" stroke="#fff" stroke-width="1.5"/>
                                <line x1="163" y1="14" x2="163" y2="26" stroke="#fff" stroke-width="1.5"/>
                                <line x1="60" y1="40" x2="60" y2="14" stroke="#fff" stroke-width="1.5"/>
                                <line x1="255" y1="40" x2="255" y2="14" stroke="#fff" stroke-width="1.5"/>
                                <text x="172" y="36" font-size="14" fill="#fff" font-style="italic" font-weight="bold">C₄</text>
                                
                                <!-- C5 Capacitor between A and D - shifted toward A to make room for C6 -->
                                <!-- Center shifted by -40 along AD: (157.5-34, 100-20.8) = (123.5, 79.2) -->
                                <!-- AD direction unit vector ≈ (0.85, 0.52) -->
                                <!-- Perpendicular unit vector ≈ (0.52, -0.85) - plates go from bottom-left to top-right "/" -->
                                <!-- Plate length = 24px (12px each side), gap = 16px (8px from center each way) -->
                                <!-- Plate 1 center: (123.5 - 8*0.85, 79.2 - 8*0.52) = (116.7, 75) -->
                                <!-- Plate 1: from (110.5, 85.2) to (122.9, 64.8) - "/" shape -->
                                <!-- Plate 2 center: (123.5 + 8*0.85, 79.2 + 8*0.52) = (130.3, 83.4) -->
                                <!-- Plate 2: from (124.1, 93.6) to (136.5, 73.2) - "/" shape -->
                                <line x1="110.5" y1="85.2" x2="122.9" y2="64.8" stroke="#fff" stroke-width="2.5"/>
                                <line x1="124.1" y1="93.6" x2="136.5" y2="73.2" stroke="#fff" stroke-width="2.5"/>
                                
                                <!-- Connections to middle of capacitor plates (plate centers) -->
                                <line x1="60" y1="40" x2="116.7" y2="75" stroke="#fff" stroke-width="1.5"/>
                                <line x1="255" y1="160" x2="130.3" y2="83.4" stroke="#fff" stroke-width="1.5"/>
                                
                                <text x="138" y="68" font-size="14" fill="#fff" font-style="italic" font-weight="bold">C₅</text>
                                
                                <!-- C6 Capacitor between B and C - shifted toward C to mirror C5 -->
                                <!-- B(60,160) to C(255,40), direction ≈ (0.85, -0.52) -->
                                <!-- Perpendicular unit vector ≈ (0.52, 0.85) - plates go from top-left to bottom-right "\" -->
                                <!-- Midpoint of BC: (157.5, 100), shifted +40 toward C: (191.5, 79.2) -->
                                <!-- Plate length = 24px (12px each side), gap = 16px (8px from center each way) -->
                                <!-- Plate 1 center: (191.5 - 8*0.85, 79.2 + 8*0.52) = (184.7, 83.4) -->
                                <!-- Plate 1: from (178.5, 73.2) to (190.9, 93.6) - "\" shape -->
                                <!-- Plate 2 center: (191.5 + 8*0.85, 79.2 - 8*0.52) = (198.3, 75) -->
                                <!-- Plate 2: from (192.1, 64.8) to (204.5, 85.2) - "\" shape -->
                                <line x1="178.5" y1="73.2" x2="190.9" y2="93.6" stroke="#fff" stroke-width="2.5"/>
                                <line x1="192.1" y1="64.8" x2="204.5" y2="85.2" stroke="#fff" stroke-width="2.5"/>
                                
                                <!-- Connections to middle of capacitor plates (plate centers) -->
                                <line x1="60" y1="160" x2="184.7" y2="83.4" stroke="#fff" stroke-width="1.5"/>
                                <line x1="255" y1="40" x2="198.3" y2="75" stroke="#fff" stroke-width="1.5"/>
                                
                                <text x="208" y="95" font-size="14" fill="#fff" font-style="italic" font-weight="bold">C₆</text>
                            </svg>
                            
                            <!-- 6C Values displayed below schematic -->
                            <div class="mt-2 small text-center" style="color: #fff;">
                                <div class="d-inline-block mx-2">
                                    <vue-latex :expression="`C_1 = ${formatCapacitance(sixCapacitorModel.C1 || threeCapacitorModel.C1)}`" :fontsize="13" />
                                </div>
                                <div class="d-inline-block mx-2">
                                    <vue-latex :expression="`C_2 = ${formatCapacitance(sixCapacitorModel.C2 || threeCapacitorModel.C2)}`" :fontsize="13" />
                                </div>
                                <div class="d-inline-block mx-2">
                                    <vue-latex :expression="`C_3 = ${formatCapacitance(sixCapacitorModel.C3 || threeCapacitorModel.C3)}`" :fontsize="13" />
                                </div>
                            </div>
                            <div class="mt-1 small text-center" style="color: #fff;">
                                <div class="d-inline-block mx-2">
                                    <vue-latex :expression="`C_4 = ${formatCapacitance(sixCapacitorModel.C4 || threeCapacitorModel.C1)}`" :fontsize="13" />
                                </div>
                                <div class="d-inline-block mx-2">
                                    <vue-latex :expression="`C_5 = ${formatCapacitance(sixCapacitorModel.C5 || threeCapacitorModel.C2)}`" :fontsize="13" />
                                </div>
                                <div class="d-inline-block mx-2">
                                    <vue-latex :expression="`C_6 = ${formatCapacitance(sixCapacitorModel.C6 || threeCapacitorModel.C3)}`" :fontsize="13" />
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
</style>