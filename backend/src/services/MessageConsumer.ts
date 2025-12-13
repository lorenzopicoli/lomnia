import amqp, { type Channel, type ChannelModel } from "amqplib";
import { EnvVar, getEnvVarOrError } from "../helpers/envVars";
import { Logger } from "./Logger";

export class MessageConsumer {
  private logger = new Logger("MessageConsumer");
  private constructor(
    // private connection: ChannelModel,
    private channel: Channel,
    private queue: string,
  ) {}

  static async init(_queue: string) {
    const url = getEnvVarOrError(EnvVar.AMQP_URL);

    const _connection: ChannelModel = await amqp.connect(url);
    const _channel: Channel = await _connection.createChannel();

    return new MessageConsumer(_channel, _queue);
  }

  async listen(onMessage: (msg: unknown) => Promise<boolean>) {
    await this.channel.assertQueue(this.queue, { durable: true });
    this.logger.info("Listening to queue", { queue: this.queue });
    await this.channel.consume(
      this.queue,
      async (msg) => {
        if (!msg) return;

        try {
          const content = JSON.parse(msg.content.toString());
          this.logger.debug("New message received", { queue: this.queue, content });
          const success = await onMessage(content);
          if (success) {
            this.logger.debug("Message processed, acknowledging...", { queue: this.queue, content });
            this.channel.ack(msg);
          } else {
            this.logger.debug("Message failed, not acknowledging...", { queue: this.queue, msg: msg.fields });
            this.channel.nack(msg, false, true);
          }
        } catch (err: unknown) {
          this.logger.debug("Message failed, not acknowledging...", { queue: this.queue, msg: msg.fields, err });
          this.channel.nack(msg, false, true);
        }
      },
      { noAck: false },
    );
  }
}
