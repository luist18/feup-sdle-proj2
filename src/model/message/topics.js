const config = {
  prefix: {
    NOTICE: 'notice',
    PROTOCOL: 'protocol',
    POST: 'post'
  },

  SEPARATOR: '/'
}

config.topic = (...args) => `/${args.join(config.SEPARATOR)}`

export default config
