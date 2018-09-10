
export interface BrokerExchangeOptions {
  publishTimeout: number;
  persistent: boolean;
  durable: boolean;
  autoDelete: boolean;
  alternateExchange: string;
  arguments: any;
}

export interface BrokerQueueOptions {
  exclusive: boolean;
  durable: boolean;
  autoDelete: boolean;
  arguments: any;
  limit: number;
  queueLimit: number;
}

export let defaultConfig = {
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
