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
        }
    }
}
</script>


<template>
    <div class="modal fade" :id="'coreShapeTableModal'" tabindex="-1" :aria-labelledby="'coreShapeTableModal-settingsModalLabel'" aria-hidden="true">
        <div class="modal-dialog modal-xl modal-dialog-scrollable table">
            <div class="modal-content bg-dark border-0 shadow-lg">
                <div class="modal-header border-bottom border-secondary px-4 py-3">
                    <div class="d-flex align-items-center">
                        <i class="fa-solid fa-cubes text-primary me-2 fs-5"></i>
                        <h5 :data-cy="dataTestLabel + '-settingsModal-notification-text'" class="modal-title text-white mb-0" :id="'coreShapeTableModal-settingsModalLabel'">Select Core Shape</h5>
                    </div>
                    <button ref="closeSettingsModalRef" type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="settingsModalClose"></button>
                </div>
                <div class="modal-body px-4 py-4" id="dataTables_wrapper">
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

    /* Make DataTable text light */
    #dataTables_wrapper {
        color: #fff;
    }

    #dataTables_wrapper table {
        color: #fff;
    }

    #dataTables_wrapper table thead th {
        color: #fff;
        background-color: #212529;
        border-color: #6c757d;
    }

    #dataTables_wrapper table tbody td {
        color: #fff;
        background-color: #212529;
        border-color: #6c757d;
    }

    #dataTables_wrapper table tbody tr:hover td {
        background-color: #2c3034;
    }

    #dataTables_wrapper .dataTables_filter input,
    #dataTables_wrapper .dataTables_length select {
        background-color: #2c3034;
        color: #fff;
        border-color: #6c757d;
    }

    #dataTables_wrapper .dataTables_info,
    #dataTables_wrapper .dataTables_length label,
    #dataTables_wrapper .dataTables_filter label {
        color: #adb5bd;
    }

    #dataTables_wrapper .dataTables_paginate .paginate_button {
        color: #fff !important;
    }

    #dataTables_wrapper .dataTables_paginate .paginate_button.current {
        background: #0d6efd !important;
        border-color: #0d6efd !important;
        color: #fff !important;
    }

    #dataTables_wrapper .dataTables_paginate .paginate_button:hover {
        background: #2c3034 !important;
        border-color: #6c757d !important;
        color: #fff !important;
    }
</style>