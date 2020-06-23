const _ = require('lodash')

module.exports = {
  purge: [],
  theme: {
    extend: {},
  },
  variants: {
    opacity: ['responsive', 'hover', 'focus', 'group-hover'],
    margin: ['responsive', 'hover', 'focus', 'group-hover'],
    borderWidth: ['responsive', 'first', 'last', 'hover', 'focus'],
  },
  plugins: [

    /**
     * New transition speed utilities
     * 
     * transition-${speed}
     * speeds: ['fast', 'medium', 'slow']
     */
    function ({ addUtilities }) {

      const transitionUtility = {}
      _.map([
        { prefix: 'fast', speed: '0.3s' },
        { prefix: 'medium', speed: '0.6s' },
        { prefix: 'slow', speed: '1s' },
      ], ({ prefix, speed }) => {
        transitionUtility[`.transition-${prefix}`] = {
          'transition': `${speed}`
        }
      })

      addUtilities(transitionUtility)
    },
  ],
}
