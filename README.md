# typescript-rabbitmq
A broker client library of using rabbitmq in a typescript code

>This version supporting rabbitmq topic configuration.
Next versions will include support for direct and fanout.
 

##Install
````
npm install --save typescript-rabbitmq
````

##API
##**Create**
**`let broker = new Broker(config);`**

See below about the configuration

##**Connect**
**`broker = await this.broker.connect();`**

This will connect to the rabbit server where the host:port defined in the config.

## **Define Queues Callbacks**
Call to **addConsume** method to add queue callback, for example **`broker.addConsume("work.tasks.queue", (msg) => {..});`**

#####Example of using the broker as a member of user class
````typescript
class Receiver {
  broker: Broker;

  constructor() {
    this.broker = new Broker(config);
  }

  async init() {
    await this.broker.connect();

    this.broker.addConsume("work.tasks.queue", this.taskCB.bind(this));
    this.broker.addConsume("work.reply.queue", this.replyCB.bind(this));
  }

  taskCB(msg) {
    ...
  }

  replyCB(msg) {
    ...
  }
}
```` 

This will call **taskCB** and **replyCB** on messages coming to "work.tasks.queue" and "work.reply.queue" accordingly.


## Configuration

Example of configuration looks like that:
````typescript
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
        {name: "work.reply.exchange", type: "topic", options: {publishTimeout: 1000, persistent: true, durable: false}}
    ],
    queues: [
        {name: "work.tasks.queue", options: {limit: 1000, queueLimit: 1000}},
        {name: "work.reply.queue", options: {limit: 1000, queueLimit: 1000}}
    ],
    binding: [
        {exchange: "work.tasks.exchange", target: "work.tasks.queue", keys: "somekey.#"},
        {exchange: "work.reply.exchange", target: "work.reply.queue", keys: "otherkey.#"}
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
````

- **`exchanges`** define the exchanges you want to use
- **`queues`** define the queues available 
- **`binding`** the binging of queues with exchanges. 

## Broker Exchange, Queue API  

### **`broker::addExchange`** 
Add a specific exchange.

#### arguments
- *name* : [string] - the name of the exchange.
- *type* : [BrokerExchangeType] - one of 'fanout' | 'direct' | 'topic';
- *options* : [BrokerExchangeOptions] - exchange options, see broker_options.ts.

#### usage

````typescript
let broker = new Broker(config);
await broker.connect();

await broker.addExchange('test', 'topic', {durable: false} as BrokerExchangeOptions);
await broker.init();
````

### **`broker::addQueue`** 
Add a specific queue.

#### arguments
- *name* : [string] - the name of the exchange.
- *type* : [BrokerExchangeType] - one of 'fanout' | 'direct' | 'topic';
- *options* : [BrokerExchangeOptions] - exchange options, see broker_options.ts.

#### usage

````typescript
let broker = new Broker(config);
await broker.connect();

broker.addQueue('testQ', {durable: true} as BrokerQueueOptions);
broker.init();
````

### **`broker::bindQueue`** 
Bind an exchange to queue with a route key.

#### arguments
- *exchange* : [string] - the name of the exchange.
- *queue* : [string] -name of a queue to bind to;
- *route* : [string] - the route key string.

#### usage

````typescript
let broker = new Broker(config);
await broker.connect();
    
broker.addBinding('testX', 'testQ', 'tsemach.#');
broker.init();
````







