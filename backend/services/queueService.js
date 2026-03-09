const Bull = require("bull");
const logger = require("../utils/logger");

/**
 * Queue service for handling heavy/background jobs
 */
class QueueService {
  constructor() {
    this.queues = {};
  }

  /**
   * Create or get a queue
   */
  getQueue(name) {
    if (!this.queues[name]) {
      this.queues[name] = new Bull(name, {
        redis: {
          host: process.env.REDIS_HOST || "127.0.0.1",
          port: parseInt(process.env.REDIS_PORT, 10) || 6379,
          password: process.env.REDIS_PASSWORD || undefined,
        },
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 2000,
          },
        },
      });

      this.queues[name].on("failed", (job, err) => {
        logger.error(`Queue [${name}] job ${job.id} failed: ${err.message}`);
      });

      this.queues[name].on("completed", (job) => {
        logger.info(`Queue [${name}] job ${job.id} completed`);
      });
    }
    return this.queues[name];
  }

  /**
   * Add job to email queue
   */
  async addEmailJob(data) {
    const queue = this.getQueue("email");
    return queue.add(data, { priority: data.priority || 2 });
  }

  /**
   * Add job to analytics processing queue
   */
  async addAnalyticsJob(data) {
    const queue = this.getQueue("analytics");
    return queue.add(data, { priority: 3 });
  }

  /**
   * Add job to image processing queue
   */
  async addImageJob(data) {
    const queue = this.getQueue("image-processing");
    return queue.add(data, { priority: 2 });
  }

  /**
   * Add job to inventory update queue
   */
  async addInventoryJob(data) {
    const queue = this.getQueue("inventory");
    return queue.add(data, { priority: 1 }); // High priority
  }

  /**
   * Process email queue
   */
  processEmailQueue(handler) {
    const queue = this.getQueue("email");
    queue.process(5, handler); // 5 concurrent workers
  }

  /**
   * Get queue stats
   */
  async getQueueStats(name) {
    const queue = this.getQueue(name);
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);
    return { waiting, active, completed, failed, delayed };
  }

  /**
   * Close all queues gracefully
   */
  async closeAll() {
    const promises = Object.values(this.queues).map((q) => q.close());
    await Promise.all(promises);
    logger.info("All queues closed");
  }
}

module.exports = new QueueService();
