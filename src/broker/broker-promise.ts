
import amqp = require('amqplib');
import Promise = require('bluebird');
import uuidv4 = require('uuid/v4');

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
class Broker {

    private config: any;
    private _noAck: boolean;
    private ch: any;
    private consumes: Map<string, any>;

    constructor(config: JSON) {
        this.config = config;
        this._noAck = false;
        this.ch = NaN;
        this.consumes = new Map();
    }

    get noAck() {
        return this._noAck;
    }

    set noAck(_noAck) {
        this._noAck = _noAck;
    }

    addConsume(queue, cb) {
        this.consumes.set(queue, cb);
        this.init();
    }

    initConsumeCB(queue) {
        console.log("initConsumeCB: queue = " + JSON.stringify(queue));
        return this.ch.consume(queue[0], this.consumes.get(queue[0]), {noAck: !this.noAck});
    }

    initBindCB(b) {
        return this.ch.bindQueue(b.target, b.exchange, b.keys).then(() => {return b.target});
    }

    initQueuesCB() {
        console.log("initQueuesCB is called");

        let initQueue = function (q_created) {
            console.log("initQueue: q = " +  JSON.stringify(q_created));
            let needed_binding = this.config.binding.filter((b) => {if (b.target === q_created.queue) return b;});

            return Promise.all(needed_binding.map(this.initBindCB.bind(this))).then(this.initConsumeCB.bind(this))
        };

        let createQueue = function(q) {
            console.log("createQueue: q name is " + q.name);
            return this.ch.assertQueue(q.name, q.options).then(initQueue.bind(this));
        };

        return Promise.all(this.config.queues.map((q) => createQueue.bind(this)(q)));
    }

    initExchangesCB(ch) {
        this.ch = ch;
        this.config.exchanges.map((ex) => {console.log("got ex = %s", JSON.stringify(ex))});

        return Promise.all(this.config.exchanges.map((ex) => {ch.assertExchange(ex.name, ex.type, ex.options)}))
            .then(() => {
                console.log("init exchanges ok");
            })
            .catch((err) => {console.log(err)});
    };

    initCB(conn) {
        console.log('connect ok!');

        process.once('SIGINT', function () {
            conn.close();
        });

        let isok = conn.createChannel().then(this.initExchangesCB.bind(this));

        return isok.then(this.initQueuesCB.bind(this));
     }

    init() {
        amqp.connect('amqp://172.17.0.3').then(this.initCB.bind(this));

        return this;
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