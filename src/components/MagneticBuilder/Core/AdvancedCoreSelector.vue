<script setup>
import AdvancedCoreSelectorShape from './AdvancedCoreSelector/AdvancedCoreSelectorShape.vue'
import AdvancedCoreSelectorGapping from './AdvancedCoreSelector/AdvancedCoreSelectorGapping.vue'
import AdvancedCoreSelectorMaterial from './AdvancedCoreSelector/AdvancedCoreSelectorMaterial.vue'
import { useHistoryStore } from '../../../stores/history'
import { deepCopy } from '/WebSharedComponents/assets/js/utils.js'
import { useTaskQueueStore } from '../../../stores/taskQueue'

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
        enableSimulation: {
            type: Boolean,
            default: true,
        },
    },
    data() {
        const taskQueueStore = useTaskQueueStore();
        const historyStore = useHistoryStore();
        const localData = {};
        const errorMessage = "";
        const loading = false;
        const forceUpdate = 0;
        const localCore = deepCopy(this.masStore.mas.magnetic.core);
        const subscriptions = [];

        return {
            taskQueueStore,
            historyStore,
            localData,
            errorMessage,
            loading,
            forceUpdate,
            localCore,
            subscriptions,
        }
    },
    computed: {
    },
    watch: { 
    },
    created () {
    },
    mounted () {
        this.subscriptions.push(this.$stateStore.$onAction(({name, args, after}) => {
            after(() => {
                if (name == "applyChanges") {
                    this.applyChanges();
                }
                if (name == "cancelChanges") {
                    this.cancelChanges();
                }
            });
        }))

        this.subscriptions.push(this.taskQueueStore.$onAction(({name, args, after}) => {
            after(() => {
                if (name == "bobbinFromCoreShapeGenerated") {
                    if (args[0]) {
                        const bobbin = args[1];
                        const currentBobbin = this.masStore.mas.magnetic.coil.bobbin;
                        // Only clear turns if bobbin actually changed
                        if (JSON.stringify(currentBobbin) !== JSON.stringify(bobbin)) {
                            this.masStore.mas.magnetic.coil.turnsDescription = null;
                            this.masStore.mas.magnetic.coil.layersDescription = null;
                            this.masStore.mas.magnetic.coil.sectionsDescription = null;
                        }
                        this.masStore.mas.magnetic.coil.bobbin = bobbin;
                        this.historyStore.addToHistory(this.masStore.mas);
                    }
                    else {
                        console.error(args[1])
                    }
                }

            });
        }))
    },
    beforeUnmount () {
        this.subscriptions.forEach((subscription) => {subscription();})
    },
    methods: {
        customizedCore(customCore) {
            this.masStore.mas.magnetic.core = customCore;
        },
        applyChanges() {
            this.localCore.functionalDescription.shape.type = "custom";
            this.localCore.name = "Custom";
            this.masStore.mas.magnetic.manufacturerInfo = null;

            this.masStore.mas.magnetic.core = deepCopy(this.localCore);
            this.$stateStore.magneticBuilder.mode.core = this.$stateStore.MagneticBuilderModes.Basic;
            this.taskQueueStore.generateBobbinFromCoreShape(this.localCore, this.masStore.mas.inputs.designRequirements.wiringTechnology).then((bobbin) => {
                this.masStore.mas.magnetic.coil.bobbin = bobbin;
            });
        },
        cancelChanges() {
            this.$stateStore.magneticBuilder.mode.core = this.$stateStore.MagneticBuilderModes.Basic;
        },
        errorInDimensions() {
            this.errorMessage = "There is an error in the dimensions, please review them";
        },
    }
}
</script>

<template>
    <div class="container">
        <div class="row">
            <img :data-cy="dataTestLabel + '-BasicCoreSelector-loading'" v-if="loading" class="mx-auto d-block col-12" alt="loading" style="width: 60%; height: auto;" :src="$settingsStore.loadingGif">
            <AdvancedCoreSelectorShape
                v-if="$stateStore.magneticBuilder.submode.core == $stateStore.MagneticBuilderCoreSubmodes.Shape"
                :dataTestLabel="dataTestLabel + '-AdvancedCoreSelectorShape'"
                :core="localCore"
                :enableSimulation="true"
                @errorInDimensions="errorInDimensions"
            />
            <AdvancedCoreSelectorGapping
                v-if="$stateStore.magneticBuilder.submode.core == $stateStore.MagneticBuilderCoreSubmodes.Gapping"
                :dataTestLabel="dataTestLabel + '-AdvancedCoreSelectorGapping'"
                :core="localCore"
                :inputs="masStore.mas.inputs"
                :enableSimulation="true"
            />
            <AdvancedCoreSelectorMaterial
                v-if="$stateStore.magneticBuilder.submode.core == $stateStore.MagneticBuilderCoreSubmodes.Material"
                :dataTestLabel="dataTestLabel + '-AdvancedCoreSelectorMaterial'"
                :core="localCore"
                :enableSimulation="true"
            />
        </div>
        <label class="text-danger col-12 pt-1" style="font-size: 1em">{{errorMessage}}</label>
    </div>
</template>
