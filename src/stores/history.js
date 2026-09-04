import { defineStore } from 'pinia'
import { ref  } from 'vue'
import { deepCopy  } from '/WebSharedComponents/assets/js/utils.js'

export const useHistoryStore = defineStore("history", () => {
    const masHistory = ref([]);
    const historyPointer = ref(-1);
    let blockingRebounds = false;
    let blockingAdditions = false;
    let reboundsTimer = null;
    let additionsTimer = null;

    function blockAdditions(durationMs) {
        blockingAdditions = true;
        if (additionsTimer) clearTimeout(additionsTimer);
        if (durationMs != null && durationMs > 0) {
            additionsTimer = setTimeout(() => {
                blockingAdditions = false;
                additionsTimer = null;
            }, durationMs);
        }
    }

    function unblockAdditions() {
        blockingAdditions = false;
        if (additionsTimer) {
            clearTimeout(additionsTimer);
            additionsTimer = null;
        }
    }

    // Gesture coalescing: successive states from ONE user gesture (a winding-
    // studio drag re-winding several times, a placement flip-flop) collapse
    // into a single undo step. Callers pass a stable gestureKey; consecutive
    // adds with the same key within the window REPLACE the last entry, so
    // back() lands on the pre-gesture state in one step.
    const GESTURE_COALESCE_WINDOW_MS = 5000;
    let lastGestureKey = null;
    let lastGestureTime = 0;

    function addToHistory(mas, gestureKey = null) {
        if (blockingRebounds) {
            return
        }
        if (blockingAdditions) {
            return
        }
        // A state identical to the current entry is a rebound echo (e.g. the
        // mas watcher firing after back()/forward() restored it), not an edit.
        // Comparing content makes the suppression deterministic instead of
        // relying solely on the 100ms timer window below.
        if (this.historyPointer >= 0 &&
            JSON.stringify(this.masHistory[this.historyPointer]) === JSON.stringify(mas)) {
            return
        }
        const now = Date.now();
        const coalesce = gestureKey != null
            && gestureKey === lastGestureKey
            && now - lastGestureTime < GESTURE_COALESCE_WINDOW_MS
            && this.historyPointer >= 1
            && this.historyPointer === this.masHistory.length - 1;
        lastGestureKey = gestureKey;
        lastGestureTime = now;
        if (coalesce) {
            this.masHistory[this.historyPointer] = deepCopy(mas);
        }
        else {
            // Discard any redo entries beyond the current pointer
            if (this.historyPointer < this.masHistory.length - 1) {
                this.masHistory.length = this.historyPointer + 1;
            }
            this.masHistory.push(deepCopy(mas));
            this.historyPointer = this.masHistory.length - 1;
        }
        blockingRebounds = true;
        if (reboundsTimer) clearTimeout(reboundsTimer);
        reboundsTimer = setTimeout(() => {
            blockingRebounds = false;
            reboundsTimer = null;
        }, 100);
    }

    function reset() {
        this.historyPointer = -1;
        this.masHistory = [];
        blockingRebounds = false;
        blockingAdditions = false;
        lastGestureKey = null;
        lastGestureTime = 0;
        if (reboundsTimer) clearTimeout(reboundsTimer);
        if (additionsTimer) clearTimeout(additionsTimer);
        reboundsTimer = null;
        additionsTimer = null;
    }

    function back() {
        // Navigating breaks any gesture chain: the next edit must be a NEW step.
        lastGestureKey = null;
        if (this.historyPointer > 0) {
            this.historyPointer -= 1;
        }
        blockingRebounds = true;
        if (reboundsTimer) clearTimeout(reboundsTimer);
        reboundsTimer = setTimeout(() => {
            blockingRebounds = false;
            reboundsTimer = null;
        }, 100);
        return deepCopy(this.masHistory[this.historyPointer]);
    }

    function forward() {
        lastGestureKey = null;
        if (this.historyPointer < this.masHistory.length - 1) {
            this.historyPointer += 1;
        }
        blockingRebounds = true;
        if (reboundsTimer) clearTimeout(reboundsTimer);
        reboundsTimer = setTimeout(() => {
            blockingRebounds = false;
            reboundsTimer = null;
        }, 100);
        return deepCopy(this.masHistory[this.historyPointer]);
    }

    function isBackPossible() {
        return this.historyPointer > 0;
    }

    function isForwardPossible() {
        return this.historyPointer < this.masHistory.length - 1;
    }

    function getCurrent() {
        if (this.masHistory.length == 0) {
            return null;
        }
        else {
            return deepCopy(this.masHistory[this.historyPointer]);
        }
    }

    function historyPointerUpdated() {
    }

    return {
        masHistory,
        historyPointer,
        addToHistory,
        reset,
        back,
        forward,
        isBackPossible,
        isForwardPossible,
        getCurrent,
        historyPointerUpdated,
        blockAdditions,
        unblockAdditions,
    }
},
{
    persist: false,
})
