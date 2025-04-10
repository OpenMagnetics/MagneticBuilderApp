<script setup>
import Core3DVisualizer from '/WebSharedComponents/Common/Core3DVisualizer.vue'
import BasicCoreSelector from './BasicCoreSelector.vue'
import { deepCopy } from '/WebSharedComponents/assets/js/utils.js'
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
        const core = {};
        const imageUpToDate = false; 
        return {
            core,
            imageUpToDate,
        }
    },
    computed: {
    },
    watch: {
        'masStore.mas.magnetic.core': {
            handler(newValue, oldValue) {
                console.log("Core updated");
                console.log(this.$settingsStore.magneticBuilderSettings.autoRedraw);

                if (this.$settingsStore.magneticBuilderSettings.autoRedraw) {
                    this.core = newValue;
                    this.imageUpToDate = true;
                }
                else {
                    this.imageUpToDate = false;
                }
            },
          deep: true
        }
    },
    mounted () {
        this.$stateStore.$onAction((action) => {
            if (action.name == "redraw") {
                console.log("redraw");
                this.core = deepCopy(this.masStore.mas.magnetic.core);
                this.imageUpToDate = true;
            }
        })
    },
    methods: {
    }
}
</script>

<template>
    <div class="container">
        <div
            v-if="useVisualizers && core.functionalDescription != null"
            class="row"
            style="height: 30vh"
            :style="imageUpToDate? 'opacity: 100%;' : 'opacity: 20%;'"
        >
            <Core3DVisualizer 
                :dataTestLabel="`${dataTestLabel}-Core3DVisualizer`"
                :core="core"
                :fullCoreModel="true"
                :loadingGif="$settingsStore.loadingGif"
                :backgroundColor="$styleStore.magneticBuilder.main.background"
            />
        </div>
        <h4 v-else class="mb-5" > {{"Core Description"}} </h4>
        <div class="row">
            <BasicCoreSelector 
                :masStore="masStore"
                :readOnly="readOnly"
                :operatingPointIndex="operatingPointIndex"
                :enableSimulation="enableSimulation"
                :enableSubmenu="enableSubmenu"
                :enableAdvise="enableAdvise"
            />
        </div>
    </div>
</template>
