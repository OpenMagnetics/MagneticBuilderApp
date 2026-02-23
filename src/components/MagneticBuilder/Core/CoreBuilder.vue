<script setup>
import Magnetic3DVisualizer from '/WebSharedComponents/Common/Magnetic3DVisualizer.vue'
import BasicCoreSelector from './BasicCoreSelector.vue'
import { deepCopy } from '/WebSharedComponents/assets/js/utils.js'
import { useTaskQueueStore } from '../../../stores/taskQueue'
</script>

<script>
export default {
    emits: ['customizeCore'],
    props: {
        dataTestLabel: {
            type: String,
            default: '',
        },
        masStore: {
            type: Object,
            required: true,
        },
        useVisualizers: {
            type: Boolean,
            default: true,
        },
        enableSimulation: {
            type: Boolean,
            default: true,
        },
        enableAutoSimulation: {
            type: Boolean,
            default: true,
        },
        enableSubmenu: {
            type: Boolean,
            default: true,
        },
        enableAdvise: {
            type: Boolean,
            default: true,
        },
        readOnly: {
            type: Boolean,
            default: false,
        },
        operatingPointIndex: {
            type: Number,
            default: 0,
        },
    },
    data() {
        const taskQueueStore = useTaskQueueStore();
        const imageUpToDate = false;
        const forceUpdateCore3DVisualizer = 0; 
        const subscriptions = []; 
        return {
            taskQueueStore,
            imageUpToDate,
            forceUpdateCore3DVisualizer,
            subscriptions,
        }
    },
    computed: {
    },
    watch: {
    },
    mounted () {
        this.subscriptions.push(this.$stateStore.$onAction(({name, args, after}) => {
            after(() => {
                if (name == "redraw") {
                    this.forceUpdateCore3DVisualizer += 1;
                    this.imageUpToDate = true;
                }
            });
        }))

        this.subscriptions.push(this.taskQueueStore.$onAction(({name, args, after}) => {
            after(() => {
                if (name == "coreProcessed") {
                    if (args[0]) {
                        const core = args[1];
                        if (this.$settingsStore.magneticBuilderSettings.autoRedraw) {
                            this.forceUpdateCore3DVisualizer += 1;
                            this.imageUpToDate = true;
                        }
                        else {
                            this.imageUpToDate = false;
                        }
                    }
                    else {
                        console.error(args[1])
                        this.imageUpToDate = false;
                    }
                }
            });
        }))

        this.core = deepCopy(this.masStore.mas.magnetic.core);
        this.imageUpToDate = true;

    },
    beforeUnmount () {
        this.subscriptions.forEach((subscription) => {subscription();})
    },
    methods: {
    }
}
</script>

<template>
    <div class="container">
        <div class="row">
            <BasicCoreSelector 
                :masStore="masStore"
                :readOnly="readOnly"
                :operatingPointIndex="operatingPointIndex"
                :enableSimulation="enableSimulation"
                :enableAutoSimulation="enableAutoSimulation"
                :enableSubmenu="enableSubmenu"
                :enableAdvise="enableAdvise"
                :useVisualizers="useVisualizers"
                :forceUpdateVisualizer="forceUpdateCore3DVisualizer"
                :imageUpToDate="imageUpToDate"
                @customizeCore="$emit('customizeCore')"
                @gappingUpdated="imageUpToDate = false; $emit('gappingUpdated')"
                @coreProcessed="forceUpdateCore3DVisualizer += 1; imageUpToDate = true"
            />
        </div>
    </div>
</template>
