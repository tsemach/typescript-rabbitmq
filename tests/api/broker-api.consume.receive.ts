

import { BrokerExchangeOptions, BrokerQueueOptions } from '../../src';

//import Broker from 'typescript-rabbitmq';
import { Broker } from '../../src';

/**
 * @description this module run the broker as a Recevier. It define a configuration object listen to two queues,
 * work.tasks.queue and work.reply.queue. this class is a wrapper around the broker waiting for messages come in
 * from both queues and just displaying them on the console.
 *
 * The file broker_send_test.js: is responsible for send messages to those two queues.
 *
 * running: open two terminals and run the following:
 *  1) node  tests/broker/simulate_receive_test.js
 *  2) node tests/broker/broker_send_test.js
 */

declare const process;

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
    {name: "work.tasks.exchange", type: "topic", options: {publishTimeout: 1000, persistent: true, durable: false}},
    {name: "textX", type: "topic", options: {publishTimeout: 1000, persistent: true, durable: false}}
  ],
  queues: [
    {name: "work.tasks.queue", options: {limit: 1000, queueLimit: 1000}},
    {name: "testQ", options: {limit: 1000, queueLimit: 1000}}
  ],
  binding: [
    {exchange: "work.tasks.exchange", target: "work.tasks.queue", keys: "loopback.#"},
    {exchange: "testX", target: "testQ", keys: "tsemach.#"}
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

    await this.broker.addExchange('service-a.exchange', 'topic', {publishTimeout: 1000, persistent: true, durable: false} as BrokerExchangeOptions);
    await this.broker.addQueue('service-a.queue', {limit: 1000, queueLimit: 1000} as BrokerQueueOptions);
    await this.broker.addBinding('service-a.exchange', 'service-a.queue', 'tsemach.component');

    this.broker.addConsume("service-a.queue", this.tasksCB.bind(this), false);

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

