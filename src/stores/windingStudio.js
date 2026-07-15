import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// Winding Studio session state (feature branch; removable with the
// WindingStudio/ folder). Hand-drawn ("pinned") section rectangles ride every
// wind call and are re-imposed by the engine after compaction, so a drawn
// section survives subsequent re-winds. Deliberately NOT persisted: section
// names like "Primary section 0" repeat across designs, and a stale pin from
// another magnetic must never apply to this one.
export const useWindingStudioStore = defineStore("windingStudio", () => {
    // sectionName -> { coordinates: [x, y], dimensions: [w, h] } in meters.
    const customSectionRects = ref({});
    // Engine delimit/compact pass on wind. Drawn sections are immune either
    // way; this switches it for the rest of the coil.
    const compactEnabled = ref(true);

    const customSectionCount = computed(() => Object.keys(customSectionRects.value).length);

    function setCustomSectionRect(sectionName, rect) {
        customSectionRects.value = { ...customSectionRects.value, [sectionName]: rect };
    }

    function clearCustomSectionRects() {
        customSectionRects.value = {};
    }

    // A winding moved to another leg invalidates its drawn rectangles
    // (section names are "<winding> section <n>").
    function clearCustomSectionRectsForWinding(windingName) {
        const kept = {};
        for (const [sectionName, rect] of Object.entries(customSectionRects.value)) {
            if (!sectionName.startsWith(windingName + " ")) {
                kept[sectionName] = rect;
            }
        }
        customSectionRects.value = kept;
    }

    return {
        customSectionRects,
        compactEnabled,
        customSectionCount,
        setCustomSectionRect,
        clearCustomSectionRects,
        clearCustomSectionRectsForWinding,
    }
})
