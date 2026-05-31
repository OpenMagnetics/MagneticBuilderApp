<script setup>
import Dialog from 'primevue/dialog'
import DataTable from 'datatables.net-vue3';
import DataTablesCore from 'datatables.net';
</script>

<script>

export default {
    components: { Dialog },
    emits: ['coreShapeSelected', 'update:visible'],
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
        visible: { type: Boolean, default: false },
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
                if (this.$refs.coreShapeTable && this.$refs.coreShapeTable.dt) {
                    this.$refs.coreShapeTable.dt.search(newValue).draw().columns.adjust();
                }
            },
          deep: true
        },
    },
    methods: {
        selectCoreShape(data) {
            this.$emit('update:visible', false);
            this.$emit('coreShapeSelected', data)
        }
    }
}
</script>


<template>
    <Dialog
        :visible="visible"
        @update:visible="(v) => $emit('update:visible', v)"
        :modal="true"
        :draggable="false"
        :style="{ width: 'min(95vw, 1200px)' }"
        :pt="{ root: { class: 'shape-modal-content' } }">
        <template #header>
            <div class="d-flex align-items-center">
                <i class="pi pi-box shape-header-icon mr-3"></i>
                <h5 :data-cy="dataTestLabel + '-settingsModal-notification-text'" class="modal-title mb-0 shape-modal-title">Select Core Shape</h5>
            </div>
        </template>
        <div class="px-2 py-2" id="dataTables_wrapper">
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
                                <th>Eff. Length</th>
                                <th>Eff. Area</th>
                                <th>Min. Area</th>
                                <th>Eff. Volume</th>
                                <th></th>
                            </tr>
                        </thead>
                        <template #column-6="props">
                            <button
                                class="btn shape-select-btn"
                                @click="selectCoreShape(props.rowData)"
                            ><i class="pi pi-arrow-right"></i></button>
                        </template>
                    </DataTable>
                </div>
    </Dialog>
</template>

<style>
    .shape-table-modal {
        z-index: 9999;
    }

    .shape-modal-content {
        background-color: var(--bs-dark);
        border: 1px solid var(--bs-secondary);
        border-radius: 0.75rem;
        box-shadow: 0 25px 50px -12px rgba(var(--bs-black-rgb), 0.5);
    }

    .shape-modal-header {
        border-bottom: 1px solid var(--bs-gray-700);
        padding: 1rem 1.5rem;
    }

    .shape-modal-title {
        color: var(--bs-gray-100);
        font-weight: 600;
        letter-spacing: 0.01em;
    }

    .shape-header-icon {
        color: var(--bs-primary);
        font-size: 1.25rem;
    }

    .shape-select-btn {
        background-color: var(--bs-gray-700);
        color: var(--bs-gray-100);
        border: 1px solid var(--bs-secondary);
        border-radius: var(--bs-border-radius);
        padding: 0.3rem 0.75rem;
        font-size: 0.8rem;
        height: 1.75rem;
        line-height: 1.25rem;
        cursor: pointer;
        transition: background-color 0.2s, border-color 0.2s, box-shadow 0.2s;
    }

    .shape-select-btn:hover {
        background-color: var(--bs-primary);
        border-color: var(--bs-primary);
        color: var(--bs-white);
    }

    .shape-select-btn:focus {
        box-shadow: 0 0 0 0.15rem rgba(var(--bs-primary-rgb), 0.25);
    }

    /* DataTable wrapper */
    #dataTables_wrapper {
        color: var(--bs-gray-100);
    }

    #dataTables_wrapper table {
        color: var(--bs-gray-100);
        border-collapse: separate;
        border-spacing: 0;
    }

    #dataTables_wrapper table thead th {
        color: var(--bs-gray-300);
        background-color: var(--bs-gray-800);
        border-bottom: 2px solid var(--bs-primary);
        padding: 0.75rem 1rem;
        font-size: 0.8rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    #dataTables_wrapper table tbody td {
        color: var(--bs-gray-100);
        background-color: var(--bs-dark);
        border-bottom: 1px solid var(--bs-gray-700);
        padding: 0.6rem 1rem;
        font-size: 0.85rem;
        transition: background-color 0.15s;
    }

    #dataTables_wrapper table tbody tr:hover td {
        background-color: var(--bs-gray-700);
    }

    #dataTables_wrapper table tbody tr.selected td {
        background-color: rgba(var(--bs-primary-rgb), 0.15);
    }

    /* Search input */
    #dataTables_wrapper .dataTables_filter input,
    #dataTables_wrapper .dt-search input {
        background-color: var(--bs-gray-800) !important;
        color: var(--bs-gray-100) !important;
        border: 1px solid var(--bs-secondary) !important;
        border-radius: var(--bs-border-radius) !important;
        padding: 0.35rem 0.75rem !important;
        font-size: 0.85rem !important;
        height: 1.75rem !important;
        outline: none !important;
        transition: border-color 0.2s, box-shadow 0.2s !important;
    }

    #dataTables_wrapper .dataTables_filter input:focus,
    #dataTables_wrapper .dt-search input:focus {
        border-color: var(--bs-primary) !important;
        box-shadow: 0 0 0 0.15rem rgba(var(--bs-primary-rgb), 0.25) !important;
    }

    /* Length select dropdown */
    #dataTables_wrapper .dataTables_length select,
    #dataTables_wrapper .dt-length select,
    #dataTables_wrapper .dt-search input,
    #dataTables_wrapper .dataTables_filter input {
        margin-left: 0.5rem;
        margin-right: 0.5rem;
    }

    #dataTables_wrapper .dataTables_length select,
    #dataTables_wrapper .dt-length select {
        background-color: var(--bs-gray-800) !important;
        color: var(--bs-gray-100) !important;
        border: 1px solid var(--bs-secondary) !important;
        border-radius: var(--bs-border-radius) !important;
        padding: 0.25rem 0.5rem !important;
        font-size: 0.85rem !important;
        height: 1.75rem !important;
        outline: none !important;
        cursor: pointer;
        transition: border-color 0.2s, box-shadow 0.2s !important;
    }

    #dataTables_wrapper .dataTables_length select:focus,
    #dataTables_wrapper .dt-length select:focus {
        border-color: var(--bs-primary) !important;
        box-shadow: 0 0 0 0.15rem rgba(var(--bs-primary-rgb), 0.25) !important;
    }

    #dataTables_wrapper .dataTables_length select option,
    #dataTables_wrapper .dt-length select option {
        background-color: var(--bs-gray-800);
        color: var(--bs-gray-100);
    }

    /* Top controls - entries + search on same line */
    #dataTables_wrapper .dt-layout-row:has(.dt-length),
    #dataTables_wrapper .dt-layout-row:has(.dataTables_length) {
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        flex-wrap: nowrap !important;
        gap: 1rem;
        margin-bottom: 1rem;
    }

    #dataTables_wrapper .dt-layout-row:has(.dt-length) > div,
    #dataTables_wrapper .dt-layout-row:has(.dataTables_length) > div {
        float: none !important;
        display: flex !important;
        align-items: center !important;
        width: auto !important;
    }

    /* Labels */
    #dataTables_wrapper .dataTables_info,
    #dataTables_wrapper .dataTables_length label,
    #dataTables_wrapper .dataTables_filter label,
    #dataTables_wrapper .dt-info,
    #dataTables_wrapper .dt-length label,
    #dataTables_wrapper .dt-search label {
        color: var(--bs-gray-500) !important;
        font-size: 0.8rem;
        white-space: nowrap;
    }

    /* Pagination */
    #dataTables_wrapper .dataTables_paginate .paginate_button,
    #dataTables_wrapper .dt-paging button {
        background-color: var(--bs-gray-800) !important;
        color: var(--bs-gray-300) !important;
        border: 1px solid var(--bs-secondary) !important;
        border-radius: var(--bs-border-radius) !important;
        margin: 0 2px !important;
        padding: 0.3rem 0.65rem !important;
        font-size: 0.8rem !important;
        cursor: pointer;
        transition: all 0.15s !important;
    }

    #dataTables_wrapper .dataTables_paginate .paginate_button.current,
    #dataTables_wrapper .dt-paging button.current {
        background-color: var(--bs-primary) !important;
        border-color: var(--bs-primary) !important;
        color: var(--bs-white) !important;
        font-weight: 600 !important;
    }

    #dataTables_wrapper .dataTables_paginate .paginate_button:hover,
    #dataTables_wrapper .dt-paging button:hover {
        background-color: var(--bs-gray-700) !important;
        border-color: var(--bs-primary) !important;
        color: var(--bs-gray-100) !important;
    }

    #dataTables_wrapper .dataTables_paginate .paginate_button.disabled,
    #dataTables_wrapper .dt-paging button.disabled {
        color: var(--bs-secondary) !important;
        background-color: var(--bs-dark) !important;
        border-color: var(--bs-gray-700) !important;
        cursor: default !important;
        opacity: 0.5;
    }
</style>
