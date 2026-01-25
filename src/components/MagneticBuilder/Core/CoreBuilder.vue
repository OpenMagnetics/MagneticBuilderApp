<script setup>
import Core3DVisualizer from '/WebSharedComponents/Common/Core3DVisualizer.vue'
import BasicCoreSelector from './BasicCoreSelector.vue'
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
        <div
            v-if="useVisualizers && masStore.mas.magnetic.core.functionalDescription != null"
            class="row"
            style="height: 30vh"
            :style="imageUpToDate? 'opacity: 100%;' : 'opacity: 20%;'"
        >
            <Core3DVisualizer 
                :dataTestLabel="`${dataTestLabel}-Core3DVisualizer`"
                :core="masStore.mas.magnetic.core"
                :forceUpdate="forceUpdateCore3DVisualizer"
                :fullCoreModel="true"
                :loadingGif="$settingsStore.loadingGif"
                :backgroundColor="$styleStore.magneticBuilder.main['background-color']"
            />
        </div>
        <h4 v-else class="mb-5" > {{"Core Description"}} </h4>
        <div class="row">
            <BasicCoreSelector 
                :masStore="masStore"
                :readOnly="readOnly"
                :operatingPointIndex="operatingPointIndex"
                :enableSimulation="enableSimulation"
                :enableAutoSimulation="enableAutoSimulation"
                :enableSubmenu="enableSubmenu"
                :enableAdvise="enableAdvise"
                @customizeCore="$emit('customizeCore')"
            />
        </div>
    </div>
</template>
