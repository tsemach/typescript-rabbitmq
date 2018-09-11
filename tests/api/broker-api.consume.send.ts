
import {BrokerExchangeOptions, BrokerQueueOptions} from "../../src";
import Broker from "../../src/broker/broker";

process.env.QUEUE_USERNAME = 'guest';
process.env.QUEUE_PASSWORD = 'guest';
process.env.QUEUE_HOST = 'localhost';
process.env.QUEUE_PORT = '5672';

let config: any = {
  connection: {
    user: process.env.QUEUE_USERNAME,
    pass: process.env.QUEUE_PASSWORD,
    host: process.env.QUEUE_SERVER || 'localhost',
    port: process.env.QUEUE_PORT || '5672',
    timeout: 2000,
    name: "rabbitmq"
  },
  exchanges: [
  ],
  queues: [
  ],
  binding: [
  ],
  logging: {
    adapters: {
      stdOut: {
        level: 3,
        bailIfDebug: true
      }
    }
  }
};

class Sender {
  broker: Broker;
  ison: boolean;

  constructor() {
    this.ison = false;
    this.broker = new Broker(config);
  }

  async init() {
    await this.broker.connect();

    this.broker.addExchange('testX', 'topic', {publishTimeout: 1000, persistent: true, durable: false} as BrokerExchangeOptions);

    return this;
  }
}

async function run() {
  console.log("going to start receiver test");
  let sender = new Sender();
  await sender.init();

  console.log("sender: going to send message ..");
  await sender.broker.send('testX', 'tsemach.tasks', 'this is a tasks');
  await sender.broker.send('testX', 'tsemach.reply', 'this is a reply');
}

run();

