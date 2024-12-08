<script setup>
</script>

<script>
export default {
    props: {
        dataTestLabel: {
            type: String,
            default: '',
        },
        enableAdvise: {
            type: Boolean,
            default: true,
        },
        enableCustomize: {
            type: Boolean,
            default: true,
        },
        severalWires: {
            type: Boolean,
            default: false,
        },
        enableLoad: {
            type: Boolean,
            default: false,
        },
        allowAdvise: {
            type: Boolean,
            default: true,
        },
    },
    data() {
        return {
        }
    },
    computed: {
    },
    watch: { 
    },
    mounted () {
    },
    methods: {

    }
}
</script>

<template>
    <div class="container">
        <div class="row">
            <div v-if="severalWires" :class="allowAdvise? 'col-4' : 'col-0'" class="container m-0 p-0">
                <button v-if="allowAdvise" :disabled="!enableAdvise" :data-cy="dataTestLabel + 'Wire-Advise-button'" class="btn btn-primary mx-auto d-block mt-1 row" style="width:100%" @click="$emit('adviseWire')" >Advise wire </button>
                <button v-if="allowAdvise" :disabled="!enableAdvise" :data-cy="dataTestLabel + 'Wire-Advise-All-button'" class="btn btn-primary mx-auto d-block mt-1 row" style="width:100%" @click="$emit('adviseAllWires')" >Advise all </button>
            </div>
            <button v-if="!severalWires && allowAdvise" :disabled="!enableAdvise" :data-cy="dataTestLabel + 'Wire-Advise-button'" class="btn btn-primary mx-auto d-block mt-1 col-4" @click="$emit('adviseWire')" >Advise wire</button>
            <button :disabled="!enableCustomize" :data-cy="dataTestLabel + 'wire-Customize-button'" :class="allowAdvise? 'col-4' : 'col-6'" class="btn btn-success mx-auto d-block mt-1" @click="$emit('customizeCore')" >Customize</button>
            <button :disabled="!enableLoad" :data-cy="dataTestLabel + 'wire-Load-button'" :class="allowAdvise? 'col-4' : 'col-6'" class="btn btn-secondary mx-auto d-block mt-1" @click="$emit('loadCore')" >{{'Load wire from library'}}</button>
        </div>
    </div>
</template>
