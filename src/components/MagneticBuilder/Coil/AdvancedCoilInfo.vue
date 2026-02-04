<script setup>
import { deepCopy, formatUnit, removeTrailingZeroes } from '/WebSharedComponents/assets/js/utils.js'
import { useTaskQueueStore } from '../../../stores/taskQueue'
import Magnetic2DVisualizer, { PLOT_MODES } from '/WebSharedComponents/Common/Magnetic2DVisualizer.vue'
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
        const subscriptions = [];
        const dataUptoDate = true;

        return {
            taskQueueStore,
            subscriptions,
            dataUptoDate,
            PLOT_MODES,
            forceUpdate: 0,
            resistanceMatrix: null,
            inductanceMatrix: null,
            couplingCoefficientMatrix: null,
            maxwellCapacitanceMatrix: null,
            capacitanceMatrix: null,
            calculatingMatrices: false,
            includeFringing: true,
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
    },
    watch: {
        'operatingPointIndex': {
            handler(newValue, oldValue) {
                this.updateFields(this.masStore.mas.outputs);
            },
          deep: true
        },
    },
    mounted () {
        this.subscriptions.push(this.$stateStore.$onAction(({name, args, after}) => {
            after(() => {
                if (name == "closeCoilAdvancedInfo") {
                    this.$stateStore.magneticBuilder.mode.coil = this.$stateStore.MagneticBuilderModes.Basic;
                }
            });
        }))
        this.subscriptions.push(this.taskQueueStore.$onAction(({name, args, after}) => {
            after(() => {
                if (name == "wind" || name == "windPlanar") {
                    this.dataUptoDate = false;
                }
                if (name == "wound" || name == "planarWound" || name == "coreShapeProcessed" || name == "coreMaterialProcessed") {
                    if (args[0]) {
                        this.dataUptoDate = false;
                        this.forceUpdate++;
                        this.calculateMatrices();
                    }
                    else {
                        console.error(args[1])
                        this.dataUptoDate = false;
                    }
                }
            });
        }))
        
        // Initial calculation
        this.calculateMatrices();
    },
    beforeUnmount () {
        this.subscriptions.forEach((subscription) => {subscription();})
    },
    methods: {
        formatMatrixAsLatex(matrix, symbol, unit = '') {
            // Determine unit symbol based on matrix type
            const unitSymbol = unit || this.getUnitForSymbol(symbol);
            
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
                        return this.formatValueWithUnit(val, unitSymbol);
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
                            // This is a winding-to-winding capacitance map
                            // For now, show a summary or first diagonal entry
                            const entries = [];
                            for (const winding of windingNames) {
                                const selfMatrix = matrix[winding]?.[winding];
                                if (selfMatrix && selfMatrix.magnitude) {
                                    // Get the total capacitance (sum of diagonal elements or a specific value)
                                    const mag = selfMatrix.magnitude;
                                    const keys = Object.keys(mag);
                                    if (keys.length > 0) {
                                        // Get the first diagonal value as representative
                                        const val = mag[keys[0]]?.[keys[0]];
                                        entries.push(`C_{${winding}} = ${this.formatValueWithUnit(val, unitSymbol)}`);
                                    }
                                }
                            }
                            if (entries.length > 0) {
                                return entries.join(', \\quad ');
                            }
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
                    return row.map(val => this.formatValueWithUnit(val, unitSymbol)).join(' & ');
                }
                return this.formatValueWithUnit(row, unitSymbol);
            });
            
            return `${symbol} = \\begin{bmatrix} ${rows.join(' \\\\ ')} \\end{bmatrix}`;
        },
        getUnitForSymbol(symbol) {
            const unitMap = {
                'R': 'Ω',
                'L': 'H',
                'C': 'F',
                'C_M': 'F'
            };
            return unitMap[symbol] || '';
        },
        swapIncludeFringing() {
            this.includeFringing = !this.includeFringing;
        },
        formatValueWithUnit(val, unitSymbol) {
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
                    return num.toFixed(3).replace(/\.?0+$/, '');
                }
                return num.toExponential(2);
            }
            
            // Use formatUnit for proper scaling and removeTrailingZeroes for clean display
            const { label, unit } = formatUnit(num, unitSymbol);
            const cleanLabel = removeTrailingZeroes(label, 3);
            
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
        async calculateMatrices() {
            // Require full magnetic data including core and coil processing
            const magnetic = this.masStore.mas?.magnetic;
            
            if (!magnetic?.coil?.turnsDescription || !magnetic?.core?.processedDescription) {
                return;
            }
            
            this.calculatingMatrices = true;
            
            try {
                const operatingPoint = this.masStore.mas.inputs?.operatingPoints?.[this.operatingPointIndex];
                const frequency = operatingPoint?.excitationsPerWinding?.[0]?.frequency || 100000;
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
                            this.resistanceMatrix = resistanceData;
                        } else if (resistanceData && Array.isArray(resistanceData)) {
                            this.resistanceMatrix = resistanceData;
                        } else {
                            this.resistanceMatrix = null;
                        }
                    } catch (e) {
                        console.error('Resistance matrix error:', e.message || e);
                        this.resistanceMatrix = null;
                    }
                } else {
                    this.resistanceMatrix = null;
                }
                
                // Calculate inductance matrix (requires core processing)
                if (magnetic.core?.processedDescription?.effectiveParameters) {
                    try {
                        const inductanceData = await this.taskQueueStore.calculateInductanceMatrix(magnetic, frequency, {});
                        // Format is {frequency: number, magnitude: {windingName: {windingName: value}}}
                        if (inductanceData && inductanceData.magnitude) {
                            this.inductanceMatrix = inductanceData;
                        } else if (inductanceData && Array.isArray(inductanceData)) {
                            this.inductanceMatrix = inductanceData;
                        } else {
                            this.inductanceMatrix = null;
                        }
                    } catch (e) {
                        console.error('Inductance matrix error:', e.message || e);
                        this.inductanceMatrix = null;
                    }
                    
                    // Calculate coupling coefficient matrix
                    try {
                        const couplingData = await this.taskQueueStore.calculateCouplingCoefficientMatrix(magnetic, frequency, {});
                        if (couplingData && couplingData.magnitude) {
                            this.couplingCoefficientMatrix = couplingData;
                        } else {
                            this.couplingCoefficientMatrix = null;
                        }
                    } catch (e) {
                        console.error('Coupling coefficient matrix error:', e.message || e);
                        this.couplingCoefficientMatrix = null;
                    }
                } else {
                    this.inductanceMatrix = null;
                    this.couplingCoefficientMatrix = null;
                }
                
                // Calculate capacitance matrices (requires layers)
                if (hasLayers && operatingPoint) {
                    try {
                        const capacitanceData = await this.taskQueueStore.calculateStrayCapacitance(
                            coil,
                            operatingPoint,
                            {}
                        );
                        
                        if (capacitanceData) {
                            // Use the maxwellCapacitanceMatrix directly from capacitanceData if available
                            if (capacitanceData.maxwellCapacitanceMatrix && capacitanceData.maxwellCapacitanceMatrix.length > 0) {
                                // It's an array of ScalarMatrixAtFrequency, take the first one
                                this.maxwellCapacitanceMatrix = capacitanceData.maxwellCapacitanceMatrix[0];
                            } else if (capacitanceData.capacitanceAmongWindings) {
                                // Fall back to calculating separately
                                try {
                                    const maxwellData = await this.taskQueueStore.calculateMaxwellCapacitanceMatrix(
                                        coil,
                                        capacitanceData.capacitanceAmongWindings
                                    );
                                    if (maxwellData && Array.isArray(maxwellData) && maxwellData.length > 0) {
                                        this.maxwellCapacitanceMatrix = maxwellData[0];
                                    } else {
                                        this.maxwellCapacitanceMatrix = null;
                                    }
                                } catch (e) {
                                    console.error('Maxwell matrix error:', e.message || e);
                                    this.maxwellCapacitanceMatrix = null;
                                }
                            }
                            
                            // Extract capacitance matrix from stray capacitance data
                            if (capacitanceData.capacitanceMatrix) {
                                this.capacitanceMatrix = capacitanceData.capacitanceMatrix;
                            } else {
                                this.capacitanceMatrix = null;
                            }
                        }
                    } catch (e) {
                        console.error('Stray capacitance error:', e.message || e);
                        this.maxwellCapacitanceMatrix = null;
                        this.capacitanceMatrix = null;
                    }
                } else {
                    this.maxwellCapacitanceMatrix = null;
                    this.capacitanceMatrix = null;
                }
                
                this.dataUptoDate = true;
            } catch (e) {
                console.error('Error calculating matrices:', e);
            } finally {
                this.calculatingMatrices = false;
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
                    <span class="text-muted d-block">Maxwell Capacitance</span>
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
                    
                    <span class="text-muted d-block mt-2">Capacitance</span>
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
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
</style>