
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

}