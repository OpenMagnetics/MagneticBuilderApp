<script setup >
import { Modal } from "bootstrap";
import DataTable from 'datatables.net-vue3';
import DataTablesCore from 'datatables.net';
</script>

<script>

export default {
    emits: ['coreShapeSelected'],
    props: {
        dataTestLabel: {
            type: String,
            default: '',
        },
        shapeFamily: {
            type: String,
            default: '',
        },
        coreShapeData: {
            type: Array,
            required: true,
        },
    },
    data() {
        DataTable.use(DataTablesCore);
        const coreShapeColumns = [
          { data: 'name' },
          { data: 'family' },
          { data: 'effectiveLength' },
          { data: 'effectiveArea' },
          { data: 'minimumArea' },
          { data: 'effectiveVolume' },
          { data: 'www' },
        ];
        return {
            coreShapeColumns,
        }
    },
    watch: {
        'shapeFamily': {
            handler(newValue, oldValue) {
                this.$refs.coreShapeTable.dt.search(newValue).draw().columns.adjust();
            },
          deep: true
        },
    },
    methods: {
        selectCoreShape(data) {
            this.$refs.closeSettingsModalRef.click();
            this.$emit('coreShapeSelected', data)
        },
    },
    computed: {
    },
    mounted() {
    },
    created() {
    }
}
</script>


<template>
    <div class="modal fade" :id="'coreShapeTableModal'" tabindex="-1" :aria-labelledby="'coreShapeTableModal-settingsModalLabel'" aria-hidden="true">
        <div class="modal-dialog modal-xl modal-dialog-scrollable table">
            <div class="modal-content" :style="$styleStore.controlPanel.main">
                <div class="modal-header">
                    <p :data-cy="dataTestLabel + '-settingsModal-notification-text'" class="modal-title fs-5" :id="'coreShapeTableModal-settingsModalLabel'">Magnetic Builder Settings</p>
                    <button ref="closeSettingsModalRef" type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="settingsModalClose"></button>
                </div>
                <div class="modal-body container text-start " id="dataTables_wrapper">
                    <DataTable
                        :class="''"
                        :columns="coreShapeColumns"
                        :data="coreShapeData"
                        :options="{ select: true, filter: true, lengthChange: true, info: true, paginate: true }"
                        width="100%"
                        ref="coreShapeTable"
                    >
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Family</th>
                                <th>Effective Length</th>
                                <th>Effective Area</th>
                                <th>Minimum Area</th>
                                <th>Effective Volume</th>
                                <th>Select</th>
                            </tr>
                        </thead>
                        <template #column-6="props">
                            <button
                                class="btn btn-primary"
                                @click="selectCoreShape(props.rowData)"
                            ><i class="fa-solid fa-square-check"></i></button>
                        </template>
                    </DataTable>
                </div>
            </div>
        </div>
    </div>
</template>

<style>

    .table {
        z-index: 9999;
    }

#dataTables_wrapper .dataTables_filter input {
  background-color: red;
}
</style>