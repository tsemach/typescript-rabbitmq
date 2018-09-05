import createLogger from 'logging';
const logger = createLogger('Borker-Consume-Test');

import 'mocha';
import { expect } from 'chai';
import { assert } from 'chai';

import Broker from '../../src/broker/broker';
import {BrokerExchangeOptions, BrokerQueueOptions} from "../../src";

describe('Broker Consume Test', () => {

  process.env.QUEUE_HOST = 'localhost';
  process.env.QUEUE_PORT = '5672';

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

  it('check broker add consume', async () => {

    async function testCB(msg) {
      msg.content = msg.content.toString();
      logger.info('[testCB] msg = ' + JSON.stringify(msg, undefined, 2));
      expect(msg.content).to.be.equal('this is a test');
      logger.info('[testCB] end running consume test');
    }

    console.log('host on: ' + process.env.QUEUE_HOST + ':' + process.env.QUEUE_PORT);
    let broker = new Broker(config);
    await broker.connect();

    expect(broker.conn).to.not.equal(null);

    broker.addExchange('testX', 'topic', {durable: false} as BrokerExchangeOptions);
    broker.addQueue('testQ', {durable: true} as BrokerQueueOptions);
    broker.addBinding('testX', 'testQ', 'tsemach.#');
    broker.addConsume('testQ', testCB.bind(this));

    await broker.send('testX', 'tsemach.test', 'this is a test');
  });

});