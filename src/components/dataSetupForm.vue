<template>
    <div class="container mx-auto bg-gray-300 w-3/4 p-6">
        <div class="flex w-full justify-center align-middle p-8">
            <p class="w-1/2 self-center">When do we start?</p>
            <div class="rounded-lg p-2 bg-white w-1/2 align-middle">
                <datepicker v-model="startDate" name="investmentStartDate" />
            </div>
        </div>

        <div class="flex w-full justify-center align-middle p-8">
            <p class="w-2/3 self-center pr-8">What's your current salary?</p>
            <div class="rounded-lg p-2 bg-white w-1/3 align-middle">
                <currency-input currency="USD" v-model="salary" />
            </div>
        </div>

        <div class="flex w-full justify-center align-middle p-8">
            <p class="w-2/3 self-center pr-8">How much do you save every month?</p>
            <div class="rounded-lg p-2 bg-white w-1/3 align-middle">
                <currency-input currency="USD" v-model="salarySaved" />
            </div>
        </div>

        <div class="flex w-full justify-center align-middle p-8">
            <p class="w-2/3 self-center pr-8">
                What's your broker's margin maintenance rate?
            </p>
            <div class="rounded-lg p-2 bg-white w-1/3 align-middle">
                <vue-slider v-model="marginMaintenanceRate" :min="25" :max="100" />
                <p class="text-center text-gray-700 text-sm">({{ marginMaintenanceRate }}%)</p>
            </div>
        </div>

        <div class="flex w-full justify-center align-middle p-8">
            <p class="w-2/3 self-center pr-8">What's your brokers margin interest rate?</p>
            <div class="rounded-lg p-2 bg-white w-1/3 align-middle">
                <vue-slider v-model="marginInterestRate" :min="0" :max="25" />
                <p class="text-center text-gray-700 text-sm">({{ marginInterestRate }}%)</p>
            </div>
        </div>

        <div class="flex w-full justify-center align-middle p-8">
            <p class="w-2/3 self-center pr-8">What % margin do you want to maintain?</p>
            <div class="rounded-lg p-2 bg-white w-1/3 align-middle">
                <vue-slider v-model="marginTargetRate" :min="0" :max="marginMax" />
                <p class="text-center text-gray-700 text-sm">({{ marginTargetRate }}%)</p>
            </div>
        </div>

        <div class="w-full p-8">
            <p class="w-full text-center mb-2">What index do you want to follow?</p>

            <div class="justify-around align-middle w-full flex">
                <input type="radio" id="sp" value="sp" v-model="stockIndex" hidden />
                <!-- <input type="radio" id="dj" value="dj" v-model="stockIndex" hidden /> -->

                <label
                    class="w-1/3 inline text-center bg-green-300 p-4 rounded-full border-2 border-green-900 cursor-pointer"
                    :class="[stockIndex == 'sp' ? 'bg-green-700' : 'hover:bg-green-400']"
                    for="sp"
                    v-html="'S&P'"
                />
                <!-- <label
                    class="w-1/3 inline text-center bg-green-300 p-4 rounded-full border-2 border-green-900 cursor-pointer"
                    :class="[stockIndex == 'dj' ? 'bg-green-700' : 'hover:bg-green-400']"
                    for="dj"
                    v-html="'Dow Jones'"
                /> -->
            </div>
        </div>

        <p v-if="error" class="p-2 m-2 mb-6 rounded-full text-center bg-red-200 text-red-800" v-html="error" />

        <div class="flex">
            <div class="flex-grow"></div>
            <button @click="simulate" class="bg-green-300 p-2 rounded-lg mr-8" v-html="'Show me the money'" />
        </div>
    </div>
</template>

<script>
// import InflationData from '@/data/Inflation.js'
import Datepicker from 'vuejs-datepicker'
import VueSlider from 'vue-slider-component'
import 'vue-slider-component/theme/antd.css'
import { CurrencyInput } from 'vue-currency-input'

import SapData from '@/data/StandardAndPoor.js'

export default {
    name: 'DataSetup',

    props: {
        defaultStartDate: {
            required: false,
            default: () => {
                return new Date(1990, 1, 1)
            }
        },

        defaultSalary: {
            required: false,
            default: 60000
        },

        defaultSalarySaved: {
            required: false,
            default: 500
        },

        defaultMarginTargetRate: {
            required: false,
            default: 50
        },

        defaultMarginMaintenanceRate: {
            required: false,
            default: 35
        },

        defaultMarginInterestRate: {
            required: false,
            default: 5
        },

        defaultStockIndex: {
            required: false,
            default: 'sp'
        }
    },

    components: {
        Datepicker,
        VueSlider,
        CurrencyInput
    },

    mounted() {
        this.startDate = this.defaultStartDate
        this.salary = this.defaultSalary
        this.salarySaved = this.defaultSalarySaved
        this.marginTargetRate = this.defaultMarginTargetRate
        this.marginMaintenanceRate = this.defaultMarginMaintenanceRate
        this.marginInterestRate = this.defaultMarginInterestRate
        this.stockIndex = this.defaultStockIndex
    },

    computed: {
        marginMax() {
            return Math.round((100 / this.marginMaintenanceRate) * 100)
        },

        salaryPercent() {
            return (this.salarySaved * 12) / this.salary
        }
    },

    methods: {
        simulate() {
            this.error = false

            setTimeout(() => {
                try {
                    if (!['sp', 'dj'].includes(this.stockIndex)) {
                        throw 'Select a stock index'
                    }

                    // todo: get dow jones
                    let stockPrices = this.stockIndex == 'sp' ? SapData : []
                    let oldest = stockPrices[stockPrices.length - 1].date
                    console.log(new Date(oldest))
                    if (new Date(oldest) > this.startDate) {
                        throw `Cannot go back that far with stock prices. Oldest price is ${new Date(oldest)}`
                    }

                    if (this.salaryPercent <= 0) {
                        throw 'Invest something will ya?'
                    }
                } catch (error) {
                    this.error = error
                }

                this.$emit('dataCollected', {
                    startDate: this.startDate,
                    salary: this.salary,
                    salaryPercent: this.salaryPercent,
                    marginTargetRate: this.marginTargetRate,
                    marginMaintenanceRate: this.marginMaintenanceRate,
                    marginInterestRate: this.marginInterestRate,
                    stockIndex: this.stockIndex,
                })
            }, 100)
        }
    },

    data() {
        return {
            startDate: new Date(1990, 1, 1),

            salary: 60000,

            salarySaved: 500,

            marginTargetRate: 50,

            marginMaintenanceRate: 25,

            marginInterestRate: 5,

            stockIndex: 'sp',

            error: false
        }
    }
}
</script>
