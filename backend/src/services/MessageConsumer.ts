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
    this.logger.debug("Listening to queue", { queue: this.queue });
    await this.channel.consume(
      this.queue,
      async (msg) => {
        this.logger.info("New message received", { queue: this.queue, msg });
        if (!msg) return;

        try {
          const content = JSON.parse(msg.content.toString());
          const success = await onMessage(content);
          if (success) {
            this.logger.info("Message processed, acknowledging...", { queue: this.queue, msg });
            this.channel.ack(msg);
          } else {
            this.logger.info("Message failed, not acknowledging...", { queue: this.queue, msg });
            this.channel.nack(msg, false, false);
          }
        } catch (err: unknown) {
          this.logger.info("Message failed, not acknowledging...", { queue: this.queue, msg, err });
          this.channel.nack(msg, false, false);
        }
      },
      { noAck: false },
    );
  }
}
