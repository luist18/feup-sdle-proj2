const config = {
  prefix: {
    NOTICE: 'notice',
    PROTOCOL: 'protocol',
    POST: 'post',
    CACHE: 'cache',
    PROFILE: 'profile'
  },

  SEPARATOR: '/'
}

config.topic = (...args) => `/${args.join(config.SEPARATOR)}`

export default config
