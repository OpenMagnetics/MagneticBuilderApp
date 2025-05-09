<script setup>
import Dimension from '/WebSharedComponents/DataInput/Dimension.vue'
import { checkAndFixMas } from '/WebSharedComponents/assets/js/utils.js'
import { useHistoryStore } from '../../stores/history'
import { tooltipsMagneticBuilder } from '/WebSharedComponents/assets/js/texts.js'
</script>

<script>

export default {
    props: {
        dataTestLabel: {
            type: String,
            default: '',
        },
        windingIndex: {
            type: Number,
            default: 0,
        },
        masStore: {
            type: Object,
            required: true,
        },
        readOnly: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        const historyStore = useHistoryStore();
        const loading = false;
        const blockingRebounds = false;
        const forceUpdate = 0;
        const recentChange = false;
        const tryingToAssign = false;
        var localData = {
            numberTurns: 1,
            numberParallels: 1,
        };

        return {
            blockingRebounds,
            historyStore,
            localData,
            forceUpdate,
            loading,
            recentChange,
            tryingToAssign,
        }
    },
    computed: {
        styleTooltip() {
            var relative_placement;
            relative_placement = 'top'
            return {
                theme: {
                    placement: relative_placement,
                    'transition-delay': '1s',
                    width: '300px',
                    "text-align": "start",
                },
            }
        },
    },
    watch: {
        'masStore.mas.magnetic.coil.functionalDescription': {
            handler(newValue, oldValue) {
                if (!this.blockingRebounds && newValue[this.windingIndex].numberTurns != this.localData.numberTurns) {
                    this.assignLocalData(newValue[this.windingIndex])
                    this.blockingRebounds = true;
                    setTimeout(() => this.blockingRebounds = false, 10);
                }
            },
          deep: true
        },
    },
    mounted () {
        // this.cleanCoil();

        this.blockingRebounds = true;
        setTimeout(() => this.blockingRebounds = false, 10);

        checkAndFixMas(this.masStore.mas, this.$mkf).then(response => {
            this.masStore.mas = response;
            this.assignLocalData(this.masStore.mas.magnetic.coil.functionalDescription[this.windingIndex]);
        })
        .catch(error => {
            console.error(error.data)
        });

        this.historyStore.$onAction((action) => {
            if (action.name == "historyPointerUpdated") {
                this.assignLocalData(this.masStore.mas.magnetic.coil.functionalDescription[this.windingIndex])
                this.blockingRebounds = true;
                setTimeout(() => this.blockingRebounds = false, 10);
            }
        })
    },
    methods: {
        tryToAssign() {
            if (!this.tryingToAssign) {
                this.recentChange = false;
                this.tryingToAssign = true;
                setTimeout(() => {
                    if (this.recentChange) {
                        this.tryingToAssign = false;
                        this.tryToAssign();
                    }
                    else {
                        this.assignTurns();
                    }
                }
                , 100);
            }
        },
        cleanCoil() {
            setTimeout(() => {
                this.masStore.mas.magnetic.coil.turnsDescription = null;
                this.masStore.mas.magnetic.coil.layersDescription = null;
                this.masStore.mas.magnetic.coil.sectionsDescription = null;
            }, 50);
            
        },
        assignLocalData(winding) {
            this.localData["numberTurns"] = winding.numberTurns;
            this.localData["numberParallels"] = winding.numberParallels;
            this.forceUpdate += 1;
        },
        assignTurns() {
            if (!this.blockingRebounds) {
                this.masStore.mas.magnetic.coil.functionalDescription[this.windingIndex].numberTurns = this.localData["numberTurns"];
                this.masStore.mas.magnetic.coil.functionalDescription[this.windingIndex].numberParallels = this.localData["numberParallels"];
            }
            this.tryingToAssign = false;
            this.$emit("turnsUpdated", this.windingIndex)
        },
        turnsUpdated() {
            if (this.localData["numberTurns"] != this.masStore.mas.magnetic.coil.functionalDescription[this.windingIndex].numberTurns ||
                this.localData["numberParallels"] != this.masStore.mas.magnetic.coil.functionalDescription[this.windingIndex].numberParallels) {

                this.cleanCoil();
            }
            this.recentChange = true;
            this.tryToAssign();
        },

    }
}
</script>

<template>
    <div class="container">
        <div class="row" v-tooltip="styleTooltip">
            <img :data-cy="dataTestLabel + '-BasicWireSelector-loading'" v-if="loading" class="mx-auto d-block col-12" alt="loading" style="width: 60%; height: auto;" :src="$settingsStore.loadingGif">
            <Dimension class="col-12 mb-1 text-start"
                v-tooltip="tooltipsMagneticBuilder.wireNumberTurns"
                v-if="!loading"
                :disabled="readOnly"
                :name="'numberTurns'"
                :replaceTitle="'No. Turns'"
                :unit="null"
                :dataTestLabel="dataTestLabel + '-NumberTurns'"
                :numberDecimals="0"
                :min="1"
                :max="1000000"
                :allowNegative="false"
                :modelValue="localData"
                :forceUpdate="forceUpdate"
                :styleClassInput="'offset-6 col-6'"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="$styleStore.magneticBuilder.inputTextColor"
                @update="turnsUpdated"
            />
            <Dimension class="col-12 mb-1 text-start"
                v-tooltip="tooltipsMagneticBuilder.wireNumberParallels"
                v-if="!loading"
                :disabled="readOnly"
                :name="'numberParallels'"
                :replaceTitle="'No. Parallels'"
                :unit="null"
                :dataTestLabel="dataTestLabel + '-NumberParallels'"
                :numberDecimals="0"
                :min="1"
                :max="1000000"
                :allowNegative="false"
                :modelValue="localData"
                :forceUpdate="forceUpdate"
                :styleClassInput="'offset-6 col-6'"
                :valueFontSize="$styleStore.magneticBuilder.inputFontSize"
                :labelFontSize="$styleStore.magneticBuilder.inputTitleFontSize"
                :labelBgColor="$styleStore.magneticBuilder.inputLabelBgColor"
                :valueBgColor="$styleStore.magneticBuilder.inputValueBgColor"
                :textColor="$styleStore.magneticBuilder.inputTextColor"
                @update="turnsUpdated"
            />
        </div>
    </div>
</template>
