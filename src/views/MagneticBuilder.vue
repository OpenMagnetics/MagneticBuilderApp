<script setup>
import Header from '/src/components/Header.vue'
import Footer from '/src/components/Footer.vue'
import { toTitleCase } from '/WebSharedComponents/assets/js/utils.js'

import MagneticBuilder from '/src/components/MagneticBuilder.vue'
import ControlPanel from '/src/components/ControlPanel.vue'

import { useMasStore } from '/src/stores/mas'

</script>

<script>
export default {
    props: {
        toolLabel: {
            type: String,
            default: 'magneticBuilder',
        },
        dataTestLabel: {
            type: String,
            default: 'MagneticBuilder',
        },
        showTitle: {
            type: Boolean,
            default: true,
        },
        showControlPanel: {
            type: Boolean,
            default: true,
        },
    },
    data() {
        const masStore = useMasStore();
        return {
            masStore,
            updateStoryline: 0,
        }
    },
    methods: {
    },
    computed: {
    },
    mounted() {
    },
    created() {
    },
}
</script>

<template>
    <div class="d-flex flex-column min-vh-100">
        <Header />
        <main role="main" class="main">
            <div class="container mx-auto">
                <div class="row">
                    <div class="text-white bg-dark text-center col-xs-12 col-sm-12 col-md-11 bg-transparent px container" >
                        <div class="mb-2 row px-3" >

                            <div data-cy="magnetic-synthesis-previous-tool-button-placeholder" class=" col-sm-12 col-md-2 mt-1"></div>
                            <h2 v-if="showTitle" data-cy="magnetic-synthesis-title-text" :class="showControlPanel? 'col-sm-12 col-md-4 col-lg-4' : 'col-sm-12 col-md-9'" class="" >
                                {{"Magnetic Builder"}}
                            </h2>
                            <div v-if="showControlPanel" data-cy="magnetic-synthesis-title-control-panel" :class="showTitle? 'col-sm-12 col-md-6 col-lg-6 col-xl-6' : 'col-sm-12 col-md-9'">
                                <ControlPanel/>
                            </div>
                        </div>
                            
                        <div class="row">
                            <MagneticBuilder 
                                :masStore="masStore"
                                :dataTestLabel="`${dataTestLabel}-MagneticBuilder`"
                                :isIsolatedApp="true"
                                :mkf="$mkf"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </main>
        <Footer class="mt-auto"/>
    </div>
</template>


<style lang="css">


</style>
