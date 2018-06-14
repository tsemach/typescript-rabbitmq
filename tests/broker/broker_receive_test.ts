
import { appRoot } from 'app-root-path';
import Broker from '../../src/broker/broker';

/**
 * @description this module run the broker as a Recevier. It define a configuration object listen to two queues,
 * work.tasks.queue and work.events.queue. this class is a wrapper around the broker waiting for messages come in
 * from both queues and just displaying them on the console.
 *
 * The file broker_send_test.js: is responsible for send messages to those two queues.
 *
 * running: open two terminals and run the following:
 *  1) node  tests/broker/simulate_receive_test.js
 *  2) node tests/broker/broker_send_test.js
 *
 */

declare const process;

let config: any = {
    connection: {
        user: process.env.QUEUE_USERNAME,
        pass: process.env.QUEUE_PASSWORD,
        server: process.env.QUEUE_SERVER,
        port: process.env.QUEUE_PORT,
        timeout: 2000,
        name: "rabbitmq"
    },
    exchanges: [
        {name: "work.tasks.exchange", type: "topic", options: {publishTimeout: 1000, persistent: true, durable: false}},
        {name: "work.events.exchange", type: "topic", options: {publishTimeout: 1000, persistent: true, durable: false}}
    ],
    queues: [
        {name: "work.tasks.queue", options: {limit: 1000, queueLimit: 1000}},
        {name: "work.events.queue", options: {limit: 1000, queueLimit: 1000}}
    ],
    binding: [
        {exchange: "work.tasks.exchange", target: "work.tasks.queue", keys: "loopback.#"},
        {exchange: "work.events.exchange", target: "work.events.queue", keys: "tsemach.#"}
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
        this.broker.addConsume("work.tasks.queue", this.taskCB.bind(this));
        this.broker.addConsume("work.events.queue", this.eventsCB.bind(this));
    }

    receive(ison) {
        this.ison = ison;
    }

    taskCB(msg) {
        if ( ! this.ison ) { return }

        msg.content = {data: "string", content: msg.content.toString()};
        console.log("taskCB: [%s]: taskCB %s:'%s'",
            msg.properties.headers.messageId,
            msg.fields.routingKey,
            msg.content.toString());
        console.log("taskCB: [%s] msg = %s", msg.properties.headers.messageId, JSON.stringify(msg));
        console.log("");
    }

    eventsCB(msg) {
        if ( ! this.ison ) { return }

        msg.content = {data: "string", content: msg.content.toString()};
        console.log("eventCB: [%s]: eventsCB %s:'%s'",
            msg.properties.headers.messageId,
            msg.fields.routingKey,
            msg.content.toString());
        console.log("eventCB: [%s] msg = %s", msg.properties.headers.messageId, JSON.stringify(msg));
        console.log("");
    }
}

let receiver = new Receiver();
receiver.receive(true);

