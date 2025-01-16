<script setup >
import { defineAsyncComponent } from "vue";
import { useMasStore } from '/src/stores/mas'

</script>

<script>

export default {
    components: {
        BugReporterModal: defineAsyncComponent(() => import('/src/components/BugReporter.vue') ),
    },
    data() {
        const masStore = useMasStore();
        return {
            masStore,
        }
    },
    methods: {
    },
    computed: {
        newPowerMagneticToolDesign() {
            this.$userStore.resetMagneticTool();
            this.masStore.resetMas("power");
            console.log(this.$route.name)
            if (this.$route.name != 'MagneticBuilder')
                setTimeout(() => {this.$router.push('/magnetic_tool');}, 100);
            else
                setTimeout(() => {this.$router.go();}, 100);
        },
        continueMagneticToolDesign() {
            if (this.$route.name != 'MagneticBuilder')
                setTimeout(() => {this.$router.push('/magnetic_tool');}, 100);
            else
                setTimeout(() => {this.$router.go();}, 100);
        },
    },
    created() {
    },
    mounted() {
        let fontawesome = document.createElement('script')
        fontawesome.setAttribute('src', 'https://kit.fontawesome.com/d5a40d6941.js')
        document.head.appendChild(fontawesome)
    }
}
</script>

<template>
    <nav class="navbar navbar-expand-lg bg-dark navbar-dark text-primary mb-1 om-header" id="header_wrapper">
        <div class="container-fluid">
            <a data-cy="Header-logo-home-link" href="/" aria-label="Visit OpenMagnetics and Tear Down the Paywalls!">
                <img src="/images/logo.svg" width="60" height="40" href="/" class="d-inline-block align-top me-3" alt="OpenMagnetics Logo">
            </a>
            <a  data-cy="Header-brand-home-link" class="navbar-brand text-primary" href="/">OpenMagnetics's Magnetic Builder</a>
            <button class="navbar-toggler text-primary" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavDropdown" aria-controls="navbarNavDropdown" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon text-white"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNavDropdown">
                <ul class="navbar-nav">
                    <li class="nav-item">
                        <a data-cy="Header-alfs-musings-link" class="nav-link text-primary me-3" href="https://www.linkedin.com/newsletters/7026708624966135808/"  target="_blank">Alf's Musings</a>
                    </li>
                    <li class="nav-item">
                        <span class="nav-item">
                            <button data-cy="Header-new-magnetic-link" class="btn me-4 nav-link text-dark bg-primary border-dark" @click="newPowerMagneticToolDesign">New magnetic<i class="ms-2 fa-solid fa-toolbox"></i> </button>
                        </span>
                    </li>
                    <li v-if="$userStore.isAnyDesignLoaded() && $route.name != 'MagneticTool'" class="nav-item">
                        <span class="nav-item">
                            <button data-cy="Header-donate-link" class="btn me-4 nav-link text-dark bg-primary border-dark" @click="continueMagneticToolDesign">Continue design<i class="ms-2 fa-solid fa-box-open"></i> </button>
                        </span>
                    </li>
                </ul>
                <ul class="navbar-nav ms-auto">
                    <li class="nav-item">
                        <span class="nav-item">
                            <a data-cy="Header-donate-link" href="https://en.liberapay.com/OpenMagnetics/" target="_blank" rel="noopener noreferrer" class="btn me-4 nav-link text-dark bg-info border-dark">Donate to OM <i class="fa-solid fa-circle-dollar-to-slot"></i> </a>
                        </span>
                    </li>
                    <li class="nav-item">
                        <span class="nav-item">
                            <button data-cy="Header-report-bug-modal-button" class="btn me-4 nav-link text-danger border-dark"  data-bs-toggle="modal" data-bs-target="#reportBugModal">Report bug <i class="fa-solid fa-bug"></i> </button>
                        </span>
                    </li>
                    <li class="nav-item">
                        <span class="nav-item">
                            <a data-cy="Header-repository-link" class="btn me-4 nav-link text-success border-dark" href="https://github.com/OpenMagnetics/" target="_blank" rel="noopener noreferrer">Beta <i class="fa-brands fa-github"></i> </a>
                        </span>
                    </li>
                </ul>
            </div>

        </div>
    </nav>

    <!-- Modal -->
    <BugReporterModal/>
</template>

<style>

    html {
      position: relative;
      min-height: 100%;
      padding-bottom:160px;
    }

    .om-header {
        min-width: 100%;
        position: fixed;
        z-index: 999;
    }


    @media (max-width: 340px) {
        #title {
            display : none;
        }
    }

    body {
        background-color: var(--bs-dark) !important;
    }
    .border-dark {
        border-color: var(--bs-dark) !important;
    }
    .input-group-text{
        background-color: var(--bs-light) !important;
        color: var(--bs-white) !important;
        border-color: var(--bs-dark) !important;
    }
    .custom-select,
    .form-control {
        background-color: var(--bs-dark) !important;
        color: var(--bs-white) !important;
        border-color: var(--bs-dark) !important;
    }
    .jumbotron{
        border-radius: 1em;
        box-shadow: 0 5px 10px rgba(0,0,0,.2);
    }
    .card{
        padding: 1.5em .5em .5em;
        background-color: var(--bs-light);
        border-radius: 1em;
        text-align: center;
        box-shadow: 0 5px 10px rgba(0,0,0,.2);
    }
    .form-control:disabled {
        background-color: var(--bs-dark) !important;
        color: var(--bs-white) !important;
        border-color: var(--bs-dark) !important;
    }
    .form-control:-webkit-autofill,
    .form-control:-webkit-autofill:focus,
    .form-control:-webkit-autofill{
        -webkit-text-fill-color: var(--bs-white) !important;
        background-color: transparent !important;
        -webkit-box-shadow: 0 0 0 50px var(--bs-dark) inset;
    }

    .container {
        max-width: 100vw;
        align-items: center;
    }

    .main {
      margin-top: 60px;
    }
    ::-webkit-scrollbar { height: 3px;}
    ::-webkit-scrollbar-button {  background-color: var(--bs-light); }
    ::-webkit-scrollbar-track {  background-color: var(--bs-light);}
    ::-webkit-scrollbar-track-piece { background-color: var(--bs-dark);}
    ::-webkit-scrollbar-thumb {  background-color: var(--bs-light); border-radius: 3px;}
    ::-webkit-scrollbar-corner { background-color: var(--bs-light);}

    .small-text {
       font-size: calc(1rem + 0.1vw);
    }
    .medium-text {
       font-size: calc(0.8rem + 0.4vw);
    }
    .large-text {
       font-size: calc(1rem + 0.5vw);
    }

    .accordion-button:focus {
        border-color: var(--bs-primary) !important;
        outline: 0  !important;
        box-shadow: none  !important;
    }

</style>
