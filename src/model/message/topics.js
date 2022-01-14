const config = {
  prefix: {
    NOTICE: 'notice',
    PROTOCOL: 'protocol',
    POST: 'post',
    CACHE: 'cache'
  },

  SEPARATOR: '/'
}

config.topic = (...args) => `/${args.join(config.SEPARATOR)}`

export default config
