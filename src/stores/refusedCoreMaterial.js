import { defineStore } from 'pinia'
import { ref } from 'vue'

// A core material MKF refuses as data no material can have (MATERIAL_INVALID_PROPERTY, e.g. Fair-Rite
// 95's old record: remanence above saturation), per MAS store, as the host found it when the design
// was loaded. The verdict is MKF's; this only remembers it. The info panels do not compute with that
// copy, they say it must be updated (Alf, 2026-10-27). The verdict belongs to that exact copy: once
// the design's material is anything else (the library's copy, another material) it no longer applies.
export const useRefusedCoreMaterialStore = defineStore("refusedCoreMaterial", () => {
    // MAS store id -> { material: the refused copy as JSON, name, message: MKF's reason }
    const refusedByMas = ref({});

    function set(masStoreId, material, message) {
        refusedByMas.value = { ...refusedByMas.value, [masStoreId]: { material: JSON.stringify(material), name: material.name, message } };
    }

    function clear(masStoreId) {
        if (masStoreId in refusedByMas.value) {
            const { [masStoreId]: dropped, ...kept } = refusedByMas.value;
            refusedByMas.value = kept;
        }
    }

    // The refusal of the material the design holds now, or null.
    function of(masStoreId, material) {
        const refused = refusedByMas.value[masStoreId];
        if (refused == null || material == null || JSON.stringify(material) != refused.material) return null;
        return { name: refused.name, message: refused.message };
    }

    return { refusedByMas, set, clear, of };
});
