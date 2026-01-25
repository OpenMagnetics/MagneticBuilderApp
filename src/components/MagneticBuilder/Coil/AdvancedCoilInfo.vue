<script setup>
import { deepCopy } from '/WebSharedComponents/assets/js/utils.js'
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
            maxwellCapacitanceMatrix: null,
            capacitanceMatrix: null,
            calculatingMatrices: false,
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
        formatMatrixAsLatex(matrix, symbol) {
            if (!matrix || !Array.isArray(matrix) || matrix.length === 0) {
                return `${symbol} = \\text{N/A}`;
            }
            
            const rows = matrix.map(row => {
                if (Array.isArray(row)) {
                    return row.map(val => this.formatValue(val)).join(' & ');
                }
                return this.formatValue(row);
            });
            
            return `${symbol} = \\begin{bmatrix} ${rows.join(' \\\\ ')} \\end{bmatrix}`;
        },
        formatValue(val) {
            if (val === null || val === undefined) return '0';
            const num = typeof val === 'object' && val.nominal !== undefined ? val.nominal : val;
            if (Math.abs(num) < 1e-12) return '0';
            if (Math.abs(num) >= 1e-3 && Math.abs(num) < 1e6) {
                return num.toFixed(4);
            }
            return num.toExponential(2);
        },
        async calculateMatrices() {
            if (!this.masStore.mas?.magnetic?.coil?.turnsDescription) {
                return;
            }
            
            this.calculatingMatrices = true;
            
            try {
                const magnetic = this.masStore.mas.magnetic;
                const operatingPoint = this.masStore.mas.inputs?.operatingPoints?.[this.operatingPointIndex];
                const frequency = operatingPoint?.excitationsPerWinding?.[0]?.frequency || 100000;
                
                // Calculate resistance matrix (TBD - placeholder)
                // TODO: When calculate_resistance_matrix is exposed in WASM
                // const resistanceMatrix = await this.taskQueueStore.calculateResistanceMatrix(magnetic, frequency, 25);
                // this.resistanceMatrix = resistanceMatrix;
                this.resistanceMatrix = this.createPlaceholderMatrix(magnetic.coil.functionalDescription?.length || 1);
                
                // Calculate inductance matrix from leakage inductance
                try {
                    const leakageData = await this.taskQueueStore.calculateLeakageInductance(
                        magnetic,
                        frequency,
                        0
                    );
                    if (leakageData.leakageInductancePerWinding) {
                        this.inductanceMatrix = this.buildInductanceMatrix(leakageData.leakageInductancePerWinding);
                    }
                } catch (e) {
                    console.warn('Could not calculate inductance matrix:', e);
                    this.inductanceMatrix = null;
                }
                
                // Calculate capacitance matrices (TBD - placeholder)
                // TODO: When calculate_stray_capacitance is exposed in WASM
                // const capacitanceData = await this.taskQueueStore.calculateStrayCapacitance(magnetic.coil);
                // this.maxwellCapacitanceMatrix = capacitanceData.maxwellCapacitanceMatrix;
                // this.capacitanceMatrix = capacitanceData.capacitanceMatrix;
                this.maxwellCapacitanceMatrix = this.createPlaceholderMatrix(magnetic.coil.functionalDescription?.length || 1);
                this.capacitanceMatrix = this.createPlaceholderMatrix(magnetic.coil.functionalDescription?.length || 1);
                
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
                        v-else-if="resistanceMatrixLatex"
                        :expression="resistanceMatrixLatex"
                        :display-mode="true"
                        :fontsize="16"
                    />
                    <div v-else class="text-muted small">
                        <em>TBD: calculate_resistance_matrix</em>
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
                        :plotModeInit="PLOT_MODES.MAGNETIC_FIELD"
                        :availablePlotModes="[PLOT_MODES.MAGNETIC_FIELD]"
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
                        v-else-if="maxwellCapacitanceMatrixLatex"
                        :expression="maxwellCapacitanceMatrixLatex"
                        :display-mode="true"
                        :fontsize="16"
                    />
                    <div v-else class="text-muted small">
                        <em>TBD: maxwell_capacitance_matrix</em>
                    </div>
                    
                    <span class="text-muted d-block mt-2">Capacitance</span>
                    <div v-if="calculatingMatrices" class="text-muted">
                        <i class="fas fa-spinner fa-spin"></i> Calculating...
                    </div>
                    <vue-latex
                        v-else-if="capacitanceMatrixLatex"
                        :expression="capacitanceMatrixLatex"
                        :display-mode="true"
                        :fontsize="16"
                    />
                    <div v-else class="text-muted small">
                        <em>TBD: capacitance_matrix</em>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
</style>