<script setup>
import { deepCopy, formatUnit, removeTrailingZeroes } from '/WebSharedComponents/assets/js/utils.js'
import { useTaskQueueStore } from '../../../stores/taskQueue'
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
        const subscriptions = [];
        const dataUptoDate = true;

        return {
            taskQueueStore,
            subscriptions,
            dataUptoDate,
            PLOT_MODES,
            forceUpdate: 0,
            resistanceMatrix: null,
            resistanceFrequencyInput: { resistanceFrequency: null },  // Will be set from operating point
            calculatingResistance: false,
            inductanceMatrix: null,
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
        // Initialize resistance frequency from operating point
        const operatingPoint = this.masStore.mas.inputs?.operatingPoints?.[this.operatingPointIndex];
        const frequency = operatingPoint?.excitationsPerWinding?.[0]?.frequency || 100000;
        this.resistanceFrequencyInput.resistanceFrequency = frequency;
        
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
            // This structure has winding pairs, each containing a ScalarMatrixAtFrequency
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
                            // Build an NxN matrix from the winding-to-winding capacitance map
                            const rows = windingNames.map(rowWinding => {
                                return windingNames.map(colWinding => {
                                    const cellMatrix = matrix[rowWinding]?.[colWinding];
                                    if (cellMatrix && cellMatrix.magnitude) {
                                        // Extract a representative value from the magnitude
                                        // magnitude is {name: {name: value}}, sum all values for total capacitance
                                        const mag = cellMatrix.magnitude;
                                        let total = 0;
                                        for (const outerKey of Object.keys(mag)) {
                                            for (const innerKey of Object.keys(mag[outerKey] || {})) {
                                                const val = mag[outerKey][innerKey];
                                                if (typeof val === 'number') {
                                                    total += val;
                                                } else if (val && typeof val === 'object' && val.nominal !== undefined) {
                                                    total += val.nominal;
                                                }
                                            }
                                        }
                                        return this.formatValueWithUnit(total, unitSymbol);
                                    }
                                    return '0';
                                }).join(' & ');
                            });
                            
                            return `${symbol} = \\begin{bmatrix} ${rows.join(' \\\\ ')} \\end{bmatrix}`;
                        }
                    }
                }
                
                return `${symbol} = \\text{N/A}`;
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
            
            // Use formatUnit for proper scaling and removeTrailingZeroes for clean display
            const { label, unit } = formatUnit(num, unitSymbol);
            const cleanLabel = removeTrailingZeroes(label, 3);
            return `${cleanLabel}\\,\\text{${unit}}`;
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
            
            // Debug logging - check what data is available
            console.group('🔍 Matrix Calculation Debug');
            console.log('magnetic:', magnetic ? 'present' : 'MISSING');
            console.log('magnetic.core:', magnetic?.core ? 'present' : 'MISSING');
            console.log('magnetic.core.processedDescription:', magnetic?.core?.processedDescription ? 'present' : 'MISSING');
            console.log('magnetic.core.processedDescription.effectiveParameters:', magnetic?.core?.processedDescription?.effectiveParameters ? 'present' : 'MISSING');
            console.log('magnetic.coil:', magnetic?.coil ? 'present' : 'MISSING');
            console.log('magnetic.coil.functionalDescription:', magnetic?.coil?.functionalDescription?.length || 0, 'windings');
            console.log('magnetic.coil.turnsDescription:', magnetic?.coil?.turnsDescription?.length || 0, 'turns');
            console.log('magnetic.coil.layersDescription:', magnetic?.coil?.layersDescription?.length || 0, 'layers');
            if (magnetic?.coil?.turnsDescription?.length > 0) {
                const firstTurn = magnetic.coil.turnsDescription[0];
                console.log('First turn keys:', Object.keys(firstTurn));
                console.log('First turn coordinates:', firstTurn.coordinates ? 'present' : 'MISSING');
            }
            console.groupEnd();
            
            if (!magnetic?.coil?.turnsDescription || !magnetic?.core?.processedDescription) {
                console.warn('⚠️ Skipping matrix calculation - missing required data');
                return;
            }
            
            this.calculatingMatrices = true;
            
            try {
                const operatingPoint = this.masStore.mas.inputs?.operatingPoints?.[this.operatingPointIndex];
                const frequency = operatingPoint?.excitationsPerWinding?.[0]?.frequency || 100000;
                const temperature = operatingPoint?.conditions?.ambientTemperature || 25;
                
                console.log('📊 Calculating matrices with frequency:', frequency, 'Hz, temperature:', temperature, '°C');
                
                // Validate we have required coil data for matrix calculations
                const coil = magnetic.coil;
                const hasLayers = coil.layersDescription && coil.layersDescription.length > 0;
                const hasTurns = coil.turnsDescription && coil.turnsDescription.length > 0;
                
                // Calculate resistance matrix (requires turns with coordinates)
                if (hasTurns) {
                    // Initialize frequency input to the operating point frequency
                    this.resistanceFrequencyInput.resistanceFrequency = frequency;
                    await this.calculateResistanceAtFrequency();
                } else {
                    console.log('⏭️ Skipping resistance matrix - no turns data');
                    this.resistanceMatrix = null;
                }
                
                // Calculate inductance matrix (requires core processing)
                if (magnetic.core?.processedDescription?.effectiveParameters) {
                    try {
                        console.log('🟢 Calling calculateInductanceMatrix...');
                        const inductanceData = await this.taskQueueStore.calculateInductanceMatrix(magnetic, frequency, {});
                        console.log('🟢 Inductance matrix result:', inductanceData);
                        // Format is {frequency: number, magnitude: {windingName: {windingName: value}}}
                        if (inductanceData && inductanceData.magnitude) {
                            this.inductanceMatrix = inductanceData;
                        } else if (inductanceData && Array.isArray(inductanceData)) {
                            this.inductanceMatrix = inductanceData;
                        } else {
                            this.inductanceMatrix = null;
                        }
                    } catch (e) {
                        console.error('❌ Inductance matrix error:', e.message || e);
                        this.inductanceMatrix = null;
                    }
                } else {
                    console.log('⏭️ Skipping inductance matrix - no effectiveParameters');
                    this.inductanceMatrix = null;
                }
                
                // Calculate capacitance matrices (requires layers)
                if (hasLayers) {
                    // Calculate Maxwell capacitance matrix
                    try {
                        console.log('🟠 Calling calculateMaxwellCapacitanceMatrix...');
                        const maxwellData = await this.taskQueueStore.calculateMaxwellCapacitanceMatrix(coil, {});
                        console.log('🟠 Maxwell matrix result:', maxwellData);
                        if (maxwellData && Array.isArray(maxwellData) && maxwellData.length > 0) {
                            this.maxwellCapacitanceMatrix = maxwellData[0];
                        } else {
                            this.maxwellCapacitanceMatrix = null;
                        }
                    } catch (e) {
                        console.error('❌ Maxwell matrix error:', e.message || e);
                        this.maxwellCapacitanceMatrix = null;
                    }
                    
                    // Calculate capacitance matrix
                    try {
                        console.log('🔵 Calling calculateCapacitanceMatrix...');
                        const capacitanceData = await this.taskQueueStore.calculateCapacitanceMatrix(coil, {});
                        console.log('🔵 Capacitance matrix result:', capacitanceData);
                        if (capacitanceData && typeof capacitanceData === 'object') {
                            this.capacitanceMatrix = capacitanceData;
                        } else {
                            this.capacitanceMatrix = null;
                        }
                    } catch (e) {
                        console.error('❌ Capacitance matrix error:', e.message || e);
                        this.capacitanceMatrix = null;
                    }
                } else {
                    console.log('⏭️ Skipping capacitance matrices - hasLayers:', hasLayers);
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
        async calculateResistanceAtFrequency() {
            const magnetic = this.masStore.mas?.magnetic;
            if (!magnetic?.coil?.turnsDescription) {
                this.resistanceMatrix = null;
                return;
            }
            
            this.calculatingResistance = true;
            
            try {
                const operatingPoint = this.masStore.mas.inputs?.operatingPoints?.[this.operatingPointIndex];
                const temperature = operatingPoint?.conditions?.ambientTemperature || 25;
                const frequency = this.resistanceFrequencyInput.resistanceFrequency || 0;
                
                console.log(`🔵 Calling calculateResistanceMatrix at ${frequency} Hz...`);
                const resistanceData = await this.taskQueueStore.calculateResistanceMatrix(magnetic, temperature, frequency);
                console.log(`🔵 Resistance matrix result at ${frequency} Hz:`, resistanceData);
                
                if (resistanceData && (resistanceData.magnitude || Array.isArray(resistanceData))) {
                    this.resistanceMatrix = resistanceData;
                } else {
                    this.resistanceMatrix = null;
                }
            } catch (e) {
                console.error(`❌ Resistance matrix error:`, e.message || e);
                this.resistanceMatrix = null;
            } finally {
                this.calculatingResistance = false;
            }
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
                    <div v-if="masStore.mas?.magnetic?.coil?.turnsDescription" class="mb-2">
                        <Dimension
                            :dataTestLabel="dataTestLabel + '-ResistanceFrequency'"
                            :name="'resistanceFrequency'"
                            :replaceTitle="'Frequency'"
                            :unit="'Hz'"
                            :min="0"
                            :max="1e9"
                            :allowZero="true"
                            v-model="resistanceFrequencyInput"
                            :labelWidthProportionClass="'col-5'"
                            :valueWidthProportionClass="'col-7'"
                            :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                            :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                            :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                            :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                            :textColor="$styleStore.magneticBuilder.inputTextColor"
                            @update="calculateResistanceAtFrequency"
                        />
                    </div>
                    <div v-if="calculatingResistance" class="text-muted">
                        <i class="fas fa-spinner fa-spin"></i> Calculating...
                    </div>
                    <vue-latex
                        v-else-if="resistanceMatrixLatex && resistanceMatrix"
                        :expression="resistanceMatrixLatex"
                        :display-mode="true"
                        :fontsize="16"
                    />
                    <div v-else-if="masStore.mas?.magnetic?.coil?.turnsDescription" class="text-muted small">
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