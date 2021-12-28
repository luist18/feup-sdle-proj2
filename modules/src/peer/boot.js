import libp2p from 'libp2p'
import kadDHT from 'libp2p-kad-dht'
import TCP from 'libp2p-tcp'
import Mplex from 'libp2p-mplex'
import Gossipsub from 'libp2p-gossipsub'
import { NOISE } from '@chainsafe/libp2p-noise'

export default async function boot(port = 0) {
  const peer = await libp2p.create({
    addresses: {
      listen: [`/ip4/0.0.0.0/tcp/${port}`]
    },
    modules: {
      transport: [TCP],
      streamMuxer: [Mplex],
      connEncryption: [NOISE],
      pubsub: Gossipsub,
      // we add the DHT module that will enable Peer and Content Routing
      dht: kadDHT
    },
    config: {
      dht: {
        // dht must be enabled
        enabled: true
      }
    }
  })

  return peer
}
