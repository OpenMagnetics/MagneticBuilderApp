<script>
export default {
    emits: ["customizeCoil"],
    props: {
        dataTestLabel: {
            type: String,
            default: '',
        },
        enableCustomize: {
            type: Boolean,
            default: true,
        },
        readOnly: {
            type: Boolean,
            default: false,
        },
    },
}
</script>

<template>
    <div class="mb-submenu">
        <button
            v-if="!readOnly"
            :disabled="!enableCustomize"
            :data-cy="dataTestLabel + '-Coil-Customize-button'"
            class="mb-btn mb-btn-ghost"
            @click="$emit('customizeCoil')"
        >
            <i class="bi bi-sliders me-2"></i>Customize
        </button>
    </div>
</template>

<style scoped>
.mb-submenu {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    padding: 10px 4px 6px;
}

.mb-btn {
    flex: 1 1 auto;
    min-width: fit-content;
    padding: 10px 14px;
    border-radius: 8px;
    font-size: 0.88rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    cursor: pointer;
    border: 1px solid transparent;
    transition: filter 0.15s, box-shadow 0.2s, transform 0.1s, background 0.15s, color 0.15s;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.mb-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.mb-btn:not(:disabled):hover {
    filter: brightness(1.12);
    transform: translateY(-1px);
}

.mb-btn-primary {
    background: linear-gradient(135deg,
        color-mix(in srgb, var(--bs-primary) 115%, transparent 0%) 0%,
        var(--bs-primary) 55%,
        rgb(var(--bs-primary-rgb) / 0.85) 100%);
    color: var(--bs-white);
    border: 2px solid color-mix(in srgb, var(--bs-primary) 70%, var(--bs-white) 30%);
    box-shadow:
        0 0 0 2px rgb(var(--bs-primary-rgb) / 0.35),
        0 4px 14px rgb(var(--bs-primary-rgb) / 0.5),
        inset 0 1px 0 rgba(255, 255, 255, 0.3);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
}

.mb-btn-primary:not(:disabled):hover {
    box-shadow:
        0 0 0 2px rgb(var(--bs-primary-rgb) / 0.35),
        0 6px 20px rgb(var(--bs-primary-rgb) / 0.6),
        inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.mb-btn-outline {
    background: rgb(var(--bs-primary-rgb) / 0.2);
    border: 1px solid rgb(var(--bs-primary-rgb) / 0.55);
    color: var(--bs-primary);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.mb-btn-outline:not(:disabled):hover {
    background: rgb(var(--bs-primary-rgb) / 0.3);
    border-color: rgb(var(--bs-primary-rgb) / 0.75);
    box-shadow: 0 3px 10px rgb(var(--bs-primary-rgb) / 0.25);
}

.mb-btn-ghost {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.28);
    color: var(--bs-light);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.mb-btn-ghost:not(:disabled):hover {
    background: rgba(255, 255, 255, 0.14);
    border-color: rgba(255, 255, 255, 0.4);
}
</style>
