import createLogger from 'logging';
const logger = createLogger('broker');

import amqp = require('amqplib');
import uuidv4 = require('uuid/v4');
import {isUndefined} from "util";
import {BrokerExchangeOptions, BrokerQueueOptions} from "./broker_options";

declare const Buffer;
declare const process;

/**
 * example of config object:
 *
 * let config: any = {
 *   connection: {
 *       user: process.env.QUEUE_USERNAME,
 *       pass: process.env.QUEUE_PASSWORD,
 *       server: process.env.QUEUE_SERVER,
 *       port: process.env.QUEUE_PORT,
 *       timeout: 2000,
 *       name: "rabbitmq"
 *   },
 *   exchanges: [
 *       {name: "work.tasks.exchange", type: "topic", options: {publishTimeout: 1000, persistent: true, durable: false}},
 *       {name: "work.reply.exchange", type: "topic", options: {publishTimeout: 1000, persistent: true, durable: false}}
 *   ],
 *   queues: [
 *       {name: "work.tasks.queue", options: {limit: 1000, queueLimit: 1000}},
 *       {name: "work.reply.queue", options: {limit: 1000, queueLimit: 1000}}
 *   ],
 *   binding: [
 *       {exchange: "work.tasks.exchange", target: "work.tasks.queue", keys: "loopback.#"},
 *       {exchange: "work.reply.exchange", target: "work.reply.queue", keys: "tsemach.#"}
 *   ],
 *   logging: {
 *       adapters: {
 *           stdOut: {
 *               level: 3,
 *               bailIfDebug: true
 *           }
 *       }
 *   }
 * };
 *
 * @type {{connection: {user: any; pass: any; server: any; port: any; timeout: number; name: string}; exchanges: {name: string; type: string; options: {publishTimeout: number; persistent: boolean; durable: boolean}}[]; queues: {name: string; options: {limit: number; queueLimit: number}}[]; binding: {exchange: string; target: string; keys: string}[]; logging: {adapters: {stdOut: {level: number; bailIfDebug: boolean}}}}}
 */

type BrokerExchangeType = 'fanout' | 'direct' | 'topic';

export class Broker {
  private config: any;
  private _noAck = false;
  private _conn: any = null;
  private ch: any = NaN;
  private consumes = new Map<string, any>();

  constructor(config: JSON) {
    this.config = config;
  }

  get noAck() {
    return this._noAck;
  }

  set noAck(_noAck) {
    this._noAck = _noAck;
  }

  get conn() {
    return this._conn;
  }

  get channel() {
    return this.ch;
  }

  async connect() {
    if (this._conn !== null) {
      logger.info("[connect] looks like broker is already connected, skip");

      return;
    }

    if (!this.config.connection.host) {
      throw "rabbitMQ host name is undefined! unable to connect";
    }

    if (!this.config.connection.port) {
      this.config.connection.port = 5672;
    }

    let url = `amqp://${this.config.connection.host}:${this.config.connection.port}`;
    try {
      logger.info(`[connect] going to connect to ${this.config.connection.host}:${this.config.connection.port}`);

      this._conn = await amqp.connect(url);
      this.ch = await this._conn.createChannel();

      this._conn.on("error", (err) => {
        this._conn = null;
        if (err.message !== "connection closing") {
          logger.error("[Broker-AMQP] conn error", err.message);
        }
      });
      this._conn.on("close", () => {
        this._conn = null;
        logger.error("[Brokeurlr-AMQP] reconnecting ..");

        setTimeout(this.connect, 1000);
      });
      logger.info(`[connect] connected to ${this.config.connection.host}:${this.config.connection.port} is ok!`);
    }
    catch (e) {
      logger.info('ERROR! [connect] on trying to connection to ' + url);
      this._conn = null;
      setTimeout(this.connect, 1000);
    }
  }

  async addConsume(queue, cb) {
    this.consumes.set(queue, cb);
    await this.init();
  }

  private async initQueueCB(q_created) {
    logger.info("initQueueCB: q = " + JSON.stringify(q_created));
    let needed_binding = this.config.binding.filter((b) => {
      if (b.target === q_created.queue) return b;
    });

    for (let b of needed_binding) {
      logger.info("initQueueCB: bining - " + JSON.stringify(b));

      await this.ch.bindQueue(b.target, b.exchange, b.keys);

      this.ch.consume(b.target, this.consumes.get(b.target), {noAck: !this.noAck});
      logger.info(`initQueueCB: consume - ${b.target} is ok`);
    }
  }

  private async createQueue(q) {
    logger.info("createQueue q = " + JSON.stringify(q));
    let theQ = await this.ch.assertQueue(q.name, q.options);

    await this.initQueueCB.bind(this)(theQ);
  }

  async init() {
    await this.connect();
    try {
      await Promise.all(this.config.exchanges.map((ex) => {
        this.ch.assertExchange(ex.name, ex.type, ex.options)
      }));

      logger.info("init exchanges ok");
    }
    catch (e) {
      logger.info(e);
    }

    for (let v of this.config.queues) {
      await this.createQueue.bind(this)(v);
    }
  }

  addExchange(name: string, type: BrokerExchangeType, options: BrokerExchangeOptions) {
    this.config.exchanges.push({name, type, options});
  }

  addQueue(name: string, options: BrokerQueueOptions) {
    this.config.queues.push({name, options});
  }

  addBinding(exchange, target, keys) {
    this.config.binding.push({exchange: exchange, target: target, keys: keys});
  }

  send(ex, key, msg, options = null, noAck = true) {

    let _options = {
      persistent: false,
      noAck: noAck,
      timestamp: Date.now(),
      contentEncoding: "utf-8",
      contentType: "application/json",
      headers: {
          messageId: uuidv4(),
          source: ex + ":" + key
      }
    };
    options = options === null ? _options : options;
    this.ch.publish(ex, key, Buffer.from(msg), options);
  }
}

export default Broker;