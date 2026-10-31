# PAY-03: Payment Method Selection

## Objective

Allow customers to select a valid payment method during checkout and securely store the payment with PENDING status.

## Supported Payment Methods

- ONLINE
- COD (Cash on Delivery)

## Payment Flow

1. Customer starts checkout.
2. Checkout session is validated.
3. Checkout session must:
   - Exist.
   - Have `active` status.
   - Not be expired.
   - Belong to the currently logged-in customer.
4. Checkout creates the order using `POST /api/orders`.
5. The generated `order_id` is provided to the Payment flow.
6. Customer selects ONLINE or COD.
7. Payment is created or updated with `PENDING` status.
8. Selecting a payment method does not mark the payment as SUCCESS.
9. ONLINE payment becomes SUCCESS only after actual payment verification.

## API

### POST /api/payment/select-method

Request:

```json
{
  "checkout_session_id": "550e8400-e29b-41d4-a716-446655440000",
  "order_id": 1,
  "method": "ONLINE"
}