import createLogger from 'logging';
import 'mocha';
import { expect } from 'chai';
import { assert } from 'chai';

import Broker from '../../src/broker/broker';
import {BrokerExchangeOptions, BrokerQueueOptions} from "../../src";
const exec = require('child_process').execFileSync;

const logger = createLogger('Borker-Queue-Test');

describe('Broker Exchange Test', () => {

  process.env.QUEUE_HOST = 'localhost';
  process.env.QUEUE_PORT = '5672';

  //exec('docker', ['restart', 'rabbitmq'], {timeout: 10000, stdio: [0, 1, 2]});

  let config: any = {
    connection: {
      user: process.env.QUEUE_USERNAME,
      pass: process.env.QUEUE_PASSWORD,
      host: process.env.QUEUE_HOST,
      port: process.env.QUEUE_PORT,
      timeout: 2000,
      name: "rabbitmq"
    },
    exchanges: [
      {name: "work.tasks.exchange", type: "topic", options: {publishTimeout: 1000, persistent: true, durable: false}},
      {name: "work.reply.exchange", type: "topic", options: {publishTimeout: 1000, persistent: true, durable: false}}
    ],
    queues: [
      {name: "work.tasks.queue", options: {limit: 1000, queueLimit: 1000}},
      {name: "work.reply.queue", options: {limit: 1000, queueLimit: 1000}}
    ],
    binding: [
      {exchange: "work.tasks.exchange", target: "work.tasks.queue", keys: "loopback.#"},
      {exchange: "work.reply.exchange", target: "work.reply.queue", keys: "tsemach.#"}
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

  let a = 0;
  before(() => {
    return new Promise((resolve) => {
      setTimeout(() => {
        a = 1;
        resolve();
      }, 200);
    });
  });

  /**
   */

  it('check broker add queue (assertQueue', async () => {

    console.log(process.env.QUEUE_HOST + process.env.QUEUE_PORT);
    let broker = new Broker(config);
    await broker.connect();

    expect(broker.conn).to.not.equal(null);

    broker.addExchange('test', 'topic', {durable: false} as BrokerExchangeOptions);
    let q = await broker.addQueue('testQ', {durable: true} as BrokerQueueOptions);

    console.log("adding testQ: name = " + JSON.stringify(q));



  });

});