<template>
    <div class="container mx-auto">
        <h3 class="text-center text-2xl">Lets invest on margin</h3>

        <DataSetupForm v-if="!calculate" @dataCollected="dataCollected" />
        <InvestmentTable
            v-else
            :startDate="startDate"
            :salary="salary"
            :salaryPercent="salaryPercent"
            :marginTargetRate="marginTargetRate"
            :marginMaintenanceRate="marginMaintenanceRate"
            :marginInterestRate="marginInterestRate"
            :stockIndex="stockIndex"
            @back="calculate = false"
        />
    </div>
</template>

<script>
// import SapData from '@/data/StandardAndPoor.js'
// import InflationData from '@/data/Inflation.js'

import DataSetupForm from '@/components/dataSetupForm'
import InvestmentTable from '@/components/investmentTable'

export default {
    name: 'Home',

    components: {
        DataSetupForm,
        InvestmentTable
    },

    mounted() {},

    methods: {
        dataCollected({
            startDate,
            salary,
            salaryPercent,
            marginTargetRate,
            marginMaintenanceRate,
            marginInterestRate,
            stockIndex
        }) {
            this.startDate = startDate
            this.salary = salary
            this.salaryPercent = salaryPercent
            this.marginTargetRate = marginTargetRate
            this.marginMaintenanceRate = marginMaintenanceRate
            this.marginInterestRate = marginInterestRate
            this.stockIndex = stockIndex

            this.calculate = true
        }
    },

    data() {
        return {
            // Default values because I don't like to type
            startDate: new Date(1990, 11, 31),
            salary: 60000,
            salaryPercent: 20,
            marginTargetRate: 90,
            marginMaintenanceRate: 35,
            marginInterestRate: 4,
            stockIndex: 'sp',

            /**
             * Show the table?
             *
             * @type {Boolean}
             */
            calculate: false
        }
    }
}
</script>
