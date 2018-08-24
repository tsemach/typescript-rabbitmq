
import amqp = require('amqplib');
//import Promise = require('bluebird');
import uuid = require('uuid');

declare const Buffer;
declare const process;

/**
 * @class class for using rabbitmq.
 *  using:
 *      broker = new Broker(config);
 *      broker.addTaskListener(queue-name, callback);
 *      broker.addEventListener(queue-name, callback);
 *
 *      callback(msg) {
 *          ...
 *      }
 */

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
 *       {name: "work.events.exchange", type: "topic", options: {publishTimeout: 1000, persistent: true, durable: false}}
 *   ],
 *   queues: [
 *       {name: "work.tasks.queue", options: {limit: 1000, queueLimit: 1000}},
 *       {name: "work.events.queue", options: {limit: 1000, queueLimit: 1000}}
 *   ],
 *   binding: [
 *       {exchange: "work.tasks.exchange", target: "work.tasks.queue", keys: "loopback.#"},
 *       {exchange: "work.events.exchange", target: "work.events.queue", keys: "tsemach.#"}
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

class BrokerAsync {

    private config: any;
    private _noAck: boolean;
    private conn: any;
    private ch: any;
    private consumes: Map<string, any>;

    constructor(config: JSON) {
        this.config = config;
        this._noAck = false;
        this.ch = NaN;
        this.consumes = new Map<string, any>();
    }

    get noAck() {
        return this._noAck;
    }

    set noAck(_noAck) {
        this._noAck = _noAck;
    }

    async addConsume(queue, cb) {
        this.consumes.set(queue, cb);
        await this.init();
    }

    async initQueueCB(q_created) {
        console.log("initQueue: q = " +  JSON.stringify(q_created));
        let needed_binding = this.config.binding.filter((b) => {if (b.target === q_created.queue) return b;});

        for(let b of needed_binding) {
            console.log("initQueue: bining - "+JSON.stringify(b));

            await this.ch.bindQueue(b.target, b.exchange, b.keys);

            this.ch.consume(b.target, this.consumes.get(b.target), {noAck: !this.noAck});
            console.log("initQueue: consume - %s is ok",b.target);
        }
    }

    async createQueue(q) {
        console.log("createQueue q = " + JSON.stringify(q));
        let theQ = await this.ch.assertQueue(q.name, q.options);

        await this.initQueueCB.bind(this)(theQ);
    }

    async init() {
        let conn = await amqp.connect('amqp://localhost');
        this.ch = await conn.createChannel();

        try {
            await Promise.all(this.config.exchanges.map((ex) => {this.ch.assertExchange(ex.name, ex.type, ex.options)}));

            console.log("init exchanges ok");
        }
        catch(e) {
            console.log(e);
        }

        for(let v of this.config.queues) {
            await this.createQueue.bind(this)(v);
        }
    }

    send(ex, key, msg, options = null, noAck = true) {

        let _options = {
            persistent: false,
            noAck: noAck,
            timestamp: Date.now(),
            contentEncoding: "utf-8",
            contentType: "application/json",
            headers: {
                messageId: uuid.uuidv1(),
                source: ex + ":" + key
            }
        };

        options = options === null ? _options : options;

        this.ch.publish(ex, key, Buffer.from(msg), options);
    }
}

export default BrokerAsync;