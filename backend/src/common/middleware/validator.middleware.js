import { body, validationResult } from 'express-validator';

/**
 * Middleware to check validation results and return errors.
 */
export function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
}

/**
 * Middleware to reject unexpected fields in the request body.
 * @param {string[]} allowedFields - List of allowed field names
 */
export function allowOnly(...allowedFields) {
  return (req, res, next) => {
    const bodyKeys = Object.keys(req.body || {});
    const unexpected = bodyKeys.filter((k) => !allowedFields.includes(k));

    if (unexpected.length > 0) {
      return res.status(400).json({
        error: 'Unexpected fields',
        fields: unexpected,
      });
    }
    next();
  };
}

// ─── Pre-built validators ───

export const validateRegistration = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('phone').isMobilePhone().withMessage('Valid phone number required'),
  body('role').optional().isIn(['user', 'merchant', 'admin']).withMessage('Invalid role'),
  allowOnly('email', 'phone', 'role'),
  handleValidation,
];

export const validateOTPSend = [
  body('identifier').notEmpty().trim().withMessage('Email or phone required'),
  allowOnly('identifier'),
  handleValidation,
];

export const validateOTPVerify = [
  body('user_token_id').notEmpty().trim().withMessage('User token required'),
  body('otp').isLength({ min: 6, max: 6 }).isNumeric().withMessage('6-digit OTP required'),
  allowOnly('user_token_id', 'otp'),
  handleValidation,
];

export const validateMerchantMap = [
  body('merchant_user_id').notEmpty().trim().withMessage('Merchant user ID required'),
  body('user_token_id').notEmpty().trim().withMessage('User token required'),
  allowOnly('merchant_user_id', 'user_token_id'),
  handleValidation,
];

export const validateRevoke = [
  body('field').notEmpty().trim().withMessage('Field name required'),
  allowOnly('field'),
  handleValidation,
];
