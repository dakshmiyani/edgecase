import { verifyWebhookSignature } from '../../integrations/razorpay/razorpay.service.js';
import { webhookProcessingQueue } from '../queue/queues/retry.queue.js';

export const handleRazorpayWebhook = async (req, res) => {
  // Capture signature correctly dependent on header case
  const signature = req.headers['x-razorpay-signature'];
  
  if (!signature) {
    return res.status(400).send('Missing signature');
  }

  // To verify signature, we need the raw body. 
  // Standard Express json parser returns an object, but Razorpay needs string format.
  // We assume req.rawBody is attached if custom middleware is used, or we stringify req.body
  const rawBody = req.rawBody || JSON.stringify(req.body);

  const isValid = verifyWebhookSignature(rawBody, signature);
  if (!isValid) {
    console.error('Webhook signature verification failed', { signature });
    return res.status(400).send('Invalid signature');
  }

  // Rapid acknowledgement to gateway
  res.status(200).send('OK');

  // Push to queue for async processing to ensure strict isolation
  await webhookProcessingQueue.add('process-webhook', {
    payload: req.body
  }, {
    // Generate deterministic id based on event to avoid duplicate webhook processing
    jobId: `webhook_${req.body.event}_${req.body.payload?.payment?.entity?.id || Date.now()}`
  });
};
