import Razorpay from 'razorpay';
import crypto from 'crypto';

// Factory: instantiate lazily so dotenv is guaranteed loaded
const getRazorpayInstance = () => {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_1234567890',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_1234567890',
  });
};

export const createRazorpayOrder = async (amount, receipt) => {
  try {
    const options = {
      amount: Math.round(amount * 100), // Paise
      currency: 'INR',
      receipt: receipt.substring(0, 40), // Razorpay 40-char limit
      payment_capture: 1,
    };
    const rzp = getRazorpayInstance();
    const order = await rzp.orders.create(options);
    return order;
  } catch (error) {
    console.error('Razorpay Error: ', error);
    throw new Error('Failed to create Razorpay order');
  }
};

export const verifyRazorpaySignature = (orderId, paymentId, signature) => {
  const generatedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'secret_1234567890')
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return generatedSignature === signature;
};

export const verifyWebhookSignature = (requestBody, signature) => {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET || 'secret_1234567890')
    .update(requestBody)
    .digest('hex');
  return expectedSignature === signature;
};
