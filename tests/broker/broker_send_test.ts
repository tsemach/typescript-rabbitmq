#!/usr/bin/env node

import amqp = require('amqplib');
import uuid = require('uuid');

declare const Buffer;

let key;
let message;
let hash: string = '1234'; // uuid.uuidv1();
let sessionId: string = '1234';
let options = {
	persistent: false,
    noAck: true,
    timestamp: Date.now(),
    contentEncoding: "utf-8",
    contentType: "application/json",
	headers: {
		messageId: hash,
        sessionId: sessionId,
        source: ""
	}
};

amqp.connect('amqp://172.17.0.3').then(function(conn) {
    return conn.createChannel().then(function(ch) {
        let ex = 'work.tasks.exchange';
        let ok = ch.assertExchange(ex, 'topic', {durable: false});
        return ok.then(function() {

			key = 'loopback.tasks';
			message = 'Hello World! from task queue';
            options.headers.source = ex + ":" + key;

            ch.publish(ex, key, Buffer.from(message), options);
            console.log(" [x] Sent %s:'%s'", key, message);
            return ch.close();
        });
    }).finally(function() { conn.close(); })
}).catch(console.log);


amqp.connect('amqp://172.17.0.3').then(function(conn) {
    return conn.createChannel().then(function(ch) {
        let ex = 'work.events.exchange';
        let ok = ch.assertExchange(ex, 'topic', {durable: false});
        return ok.then(function() {

			key = 'tsemach.events';
			message = 'Hello World! from event queue';
            options.headers.source = ex + ":" + key;

            ch.publish(ex, key, Buffer.from(message), options);
            console.log(" [x] Sent %s:'%s'", key, message);
            return ch.close();
        });
    }).finally(function() { conn.close(); })
}).catch(console.log);
