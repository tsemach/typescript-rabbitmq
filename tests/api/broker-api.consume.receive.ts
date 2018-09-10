import {expect} from "chai";
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

class Receiver {
  broker: Broker;
  ison: boolean;

  constructor() {
    this.ison = false;
    this.broker = new Broker(config);
  }

  async init() {
    await this.broker.connect();

    this.broker.addExchange('testX', 'topic', {publishTimeout: 1000, persistent: true, durable: false} as BrokerExchangeOptions);
    this.broker.addQueue('testQ', {limit: 1000, queueLimit: 1000} as BrokerQueueOptions);
    this.broker.addBinding('testX', 'testQ', 'tsemach.#');
    this.broker.addConsume('testQ', this.tasksCB.bind(this));

    return this;
  }

  receive(ison) {
    this.ison = ison;
  }

  tasksCB(msg) {
    if ( ! this.ison ) { return }

    msg.content = {data: "string", content: msg.content.toString()};
    console.log("taskCB: [%s]: taskCB %s:'%s'",
      msg.properties.headers.messageId,
      msg.fields.routingKey,
      msg.content.toString());
    console.log("taskCB: [%s] msg = %s", msg.properties.headers.messageId, JSON.stringify(msg, undefined, 2));
    console.log("");
  }

  replyCB(msg) {
    if ( ! this.ison ) { return }

    msg.content = {data: "string", content: msg.content.toString()};
    console.log("replyCB: [%s]: replyCB %s:'%s'",
      msg.properties.headers.messageId,
      msg.fields.routingKey,
      msg.content.toString());
    console.log("replyCB: [%s] msg = %s", msg.properties.headers.messageId, JSON.stringify(msg, undefined, 2));
    console.log("");
  }
}

async function run() {
  console.log("going to start receiver test");
  let receiver = new Receiver();
  await receiver.init();
  receiver.receive(true);
}

run();
