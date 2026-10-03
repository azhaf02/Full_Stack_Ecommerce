 # PAY-03: Payment Method Selection

## Objective
Allow customers to select Online Payment or Cash on Delivery during checkout.

## Implemented Features
- React payment-selection component.
- ONLINE and COD payment options.
- Required payment-method selection.
- Loading and error messages.
- Payment request and response schemas.
- UUID validation for checkout-session IDs.
- Payment service prepared to save PENDING payments.
- Authenticated `POST /api/payment/select-method` endpoint.

## API Status
`POST /api/payment/select-method` is registered but currently returns HTTP 503.
Payment creation is disabled until checkout and order integration can be securely validated.

## Dependencies
- Safiya: Checkout-session API and authentication integration.
- Rukhsar: Order creation and order ID integration.

## Testing
Five payment-schema tests passed:
1. Invalid payment method.
2. Missing payment method.
3. Valid ONLINE payment.
4. Valid COD payment.
5. Empty checkout-session ID.

Database integration and end-to-end payment tests are pending.

## Security
- Payment endpoints require authentication.
- Checkout-session validity and customer ownership must be verified before saving payments.
- Selecting a payment method must not mark payment successful.
