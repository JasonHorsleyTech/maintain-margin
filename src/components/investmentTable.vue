<template>
    <div>
        <a class="block py-4 text-purple-500 cursor-pointer hover:text-purple-600" @click.prevent="$emit('back')"
            >&lt; Back</a
        >

        <div class="w-full border border-black mb-64">
            <div class="flex w-full justify-between bg-gray-200 border-b border-black">
                <div
                    v-for="columnKey in visibleTableColumns"
                    :key="columnKey"
                    class="flex-1 text-center border-r border-black last:border-0 relative cursor-pointer group py-2"
                >
                    <p class="w-full">{{ columnNameFor(columnKey).name }}</p>
                    <p
                        class="absolute w-full bg-gray-100 px-8 py-2 rounded-lg shadow
                        transition-fast opacity-0 group-hover:opacity-100 mt-0 group-hover:mt-3"
                        style="left: 50%; transform: translateX(-50%);"
                    >
                        {{ columnNameFor(columnKey).hover }}
                    </p>
                </div>
            </div>
            <div
                v-for="(row, index) in tableData"
                :key="row.date"
                class="flex w-full justify-between cursor-pointer"
                :class="[
                    index % 2 ? 'bg-gray-200 hover:opacity-75' : 'bg-gray-400 hover:opacity-75',
                    highlightedRow == index ? 'font-bold' : 'font-normal'
                ]"
                @click.prevent="highlightedRow = highlightedRow == index ? false : index"
            >
                <div
                    v-for="columnKey in visibleTableColumns"
                    :key="columnKey"
                    class="flex-1 text-center border-r border-black last:border-0 cursor-pointer"
                >
                    <template v-if="columnKey == 'date'">{{ row.date }}</template>
                    <p v-else-if="columnKey == 'monthlySavings'">
                        {{ row.monthlySavings | prettyNumber }}
                    </p>
                    <p v-else-if="columnKey == 'marketChange'">
                        {{ row.marketChange | prettyPercent }}
                    </p>
                    <p v-else-if="columnKey == 'mattress'">
                        {{ row.mattress | prettyNumber }}
                    </p>
                    <p v-else-if="columnKey == 'portfolio'">
                        {{ row.portfolio | prettyNumber }}
                    </p>

                    <p v-else-if="columnKey == 'marginedPortfolio'">
                        {{ row.marginedPortfolio | prettyNumber }}
                    </p>
                    <p v-else-if="columnKey == 'percentOnMargin'" :class="marginDangerColor(row.percentOnMargin)">
                        {{ row.percentOnMargin | prettyPercent }}
                    </p>
                    <p v-else>{{ tableData[index][columnKey] }}</p>
                </div>
            </div>
        </div>
    </div>
</template>
<script>
import SapData from '@/data/StandardAndPoor.js'
import InflationData from '@/data/Inflation.js'

export default {
    name: 'InvestmentTable',

    props: {
        startDate: {
            type: Date,
            required: true
        },

        /**
         * TODO: Collect current year salary on prev step
         */
        salary: {
            type: Number,
            required: true
        },

        salaryPercent: {
            type: Number,
            required: true
        },

        marginTargetRate: {
            type: Number,
            required: true
        },

        marginInterestRate: {
            type: Number,
            required: true
        },

        marginMaintenanceRate: {
            type: Number,
            required: true
        },

        stockIndex: {
            type: String,
            required: true
        }
    },

    filters: {
        prettyNumber: value => {
            let val = (value / 1).toFixed(2).replace(',', '.')
            return `$${val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
        },

        prettyPercent: value => {
            return isNaN(value) ? '--' : `${Math.round(value * 10000) / 100}%`
        }
    },

    computed: {
        selectedIndex() {
            let i = SapData.length
            return SapData.map(week => {
                return {
                    i: i--,
                    date: new Date(week.date),
                    value: week.value
                }
            })
        },

        indexForPeriod() {
            return this.selectedIndex
                .slice()
                .reverse()
                .filter(week => {
                    return week.date >= this.startDate
                })
        },

        marginMaintenancePercent() {
            return this.marginMaintenanceRate / 100
        },

        marginInterestPercent() {
            return this.marginInterestRate / 100
        },

        marginTargetPercent() {
            return this.marginTargetRate / 100
        },

        tableData() {
            // Simple "stick it in a mattress" value
            let mattressValue = 0

            // Medium "stick it all in market" value
            let simplePortfolio = 0

            /* Risky "Try to maintain x% on margin" value of the portfolio */

            // The base portfolio I use for colat
            let ccLiquidPortfolio = 0
            // The portfolio of loaned money
            let ccMarginedPortfolio = 0
            // The total number of DOLLARS I owe
            let ccLoaned = 0
            // Have I gotten a margin call? ( lose game :( )
            let marginCall = false

            // Are we in the first period loop?
            let firstLoop = true

            return this.indexForPeriod.map(currentPeriod => {
                // This is your paycheck per month, assuming you stay in the same income bracket relative to inflation
                let monthlyCheck = (this.getCurrentYearSalary(currentPeriod.date.getFullYear()) / 12) * 0.75

                // This is how much you can save from each monthly check
                let monthlySavings = monthlyCheck * (this.salaryPercent / 100)

                // Previous stock values for last month's period
                let previousPeriod = this.selectedIndex.find(p => p.i == currentPeriod.i - 1) || currentPeriod

                // How much if you stuff it in a mattress? salaryPercent% of your paycheck per period
                mattressValue += monthlySavings

                // How much if you just stick it in the S&P?
                let marketChange = firstLoop ? '--' : currentPeriod.value / previousPeriod.value

                if (!firstLoop) {
                    simplePortfolio *= marketChange
                }
                simplePortfolio += monthlySavings

                // Margin
                if (firstLoop) {
                    ccLiquidPortfolio += monthlySavings
                    ccLoaned = ccLiquidPortfolio * this.marginTargetPercent
                    ccMarginedPortfolio = ccLoaned
                } else if (!marginCall) {
                    ccLiquidPortfolio *= marketChange
                    ccMarginedPortfolio *= marketChange
                    ccLoaned *= 1 + this.marginInterestPercent / 12

                    let loanTarget = this.marginTargetPercent * (ccLiquidPortfolio + monthlySavings)
                    let newLoan = loanTarget - ccLoaned
                    // Take out more money
                    if (newLoan > 0) {
                        ccLiquidPortfolio += monthlySavings
                        ccMarginedPortfolio += newLoan
                        ccLoaned += newLoan
                    }
                    // Need to pay money back (but I can with this months check)
                    else if (loanTarget < monthlySavings) {
                        // Take money from savings
                        monthlySavings -= newLoan
                        // Pay off loan until it's AT target
                        ccLoaned += newLoan
                        // Put remainder into liquid portfolio
                        ccLiquidPortfolio += monthlySavings
                    }
                    // Oh shit, I owe more than I can pay off this month
                    else {
                        ccLiquidPortfolio += monthlySavings
                    }

                    if (ccLiquidPortfolio / this.marginMaintenancePercent < ccLoaned) {
                        console.log('here')
                        marginCall = true
                    }
                } else {
                    ccMarginedPortfolio = '--'
                    ccLiquidPortfolio = '--'
                }

                firstLoop = false
                return {
                    date: `${this.monthToName(currentPeriod.date.getMonth())} 1st ${currentPeriod.date.getFullYear()}`,
                    monthlySavings: monthlySavings,
                    marketChange: marketChange - 1,
                    mattress: mattressValue,
                    portfolio: simplePortfolio,

                    marginedPortfolio: ccLiquidPortfolio + ccMarginedPortfolio - ccLoaned,
                    percentOnMargin: ccLoaned / ccLiquidPortfolio
                }
            })
        },

        baseDollar() {
            return InflationData.find(year => year == this.startDate.getFullYear()).value
        },

        /**
         * Columns in table
         * TODO: Way to toggle some off
         */
        visibleTableColumns() {
            return Object.keys(this.tableData[0])
        }
    },

    methods: {
        monthToName(monthIndex) {
            return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'][monthIndex]
        },

        getCurrentYearSalary(fullYear) {
            let endingInflationKey = InflationData.find(item => item.year == '2020')
            let currentInflationKey = InflationData.find(item => item.year == fullYear)
            return this.salary * (currentInflationKey.value / endingInflationKey.value)
        },

        columnNameFor(columnKey) {
            return (
                this.tableColumnKeys[columnKey] || {
                    name: this.capitalize(columnKey),
                    hover: this.capitalize(columnKey)
                }
            )
        },

        capitalize(value) {
            return !value
                ? ''
                : value
                      .toString()
                      .charAt(0)
                      .toUpperCase() + value.toString().slice(1)
        },

        marginDangerColor(margin) {
            let howFarOff = margin / this.marginInterestPercent
            if (howFarOff > 2) {
                return 'text-red-900'
            } else if (howFarOff > 1.75) {
                return 'text-red-800'
            } else if (howFarOff > 1.5) {
                return 'text-red-700'
            } else if (howFarOff > 1.25) {
                return 'text-red-600'
            } else if (howFarOff > 1) {
                return 'text-red-400'
            } else {
                return 'text-black'
            }
        }
    },

    data() {
        return {
            highlightedRow: false,

            tableColumnKeys: {
                date: {
                    name: 'Date',
                    hover: 'Date'
                },

                monthlySavings: {
                    name: 'Monthly savings',
                    hover: "What's left of your paycheck"
                },

                marketChange: {
                    name: 'Market change',
                    hover: '% change of the stock market'
                },

                mattress: {
                    name: 'Mattress method',
                    hover: 'Stick your money in a mattress'
                },

                portfolio: {
                    name: 'All in market',
                    hover: 'Stick 100% of what you can save into the stock market'
                },

                marginedPortfolio: {
                    name: 'Margined portfolio',
                    hover: 'Investing as much as you can save PLUS attempting to keep your portfolio margined at the targeted amount'
                },

                percentOnMargin: {
                    name: 'Percent on margin',
                    hover: 'What you owe / what you actually have'
                }
            }
        }
    }
}
</script>