\# Cart \& Checkout



\## Shipping Method Selection



The checkout page loads active shipping methods from the backend using:



`GET /api/shipping-methods`



The available shipping methods are read from the `shipping\_methods` database table.



\### Shipping Methods



Each shipping method provides:



\- `id` — Shipping method ID

\- `name` — Shipping method name

\- `cost` — Shipping cost

\- `estimated\_days` — Estimated delivery time

\- `status` — Active/inactive status



The checkout currently supports:



\- Standard Delivery

\- Express Delivery

\- Same Day Delivery



\## Shipping Cost Calculation



When the customer selects a shipping method, the selected shipping cost is added to the checkout total:



`Total = Subtotal - Discount + Shipping Cost`



The frontend displays the updated total based on the selected shipping method.



\## Shipping Validation



A shipping method must be selected before the customer can continue to the review step.



If no shipping method is selected, checkout displays:



`Please select a shipping method.`



\## Order Pricing



The final shipping cost is calculated on the backend by the server-side order pricing service.



The frontend does not send prices, totals, or shipping costs when creating an order.



The order request sends:



\- `address\_id`

\- `shipping\_method\_id`

\- `payment\_method`

\- `items`



The backend reads the selected shipping method from the database and calculates the final order total.



\## Order Total



The server calculates:



`Total = Subtotal + Shipping Cost`



Tax and discount are currently zero until the shared pricing engine is integrated.



\## API Flow



```text

Checkout Page

&#x20;    |

&#x20;    | GET /api/shipping-methods

&#x20;    v

Shipping Methods

&#x20;    |

&#x20;    | Customer selects method

&#x20;    v

Updated Checkout Total

&#x20;    |

&#x20;    | POST /api/orders

&#x20;    v

Server-side Order Pricing

&#x20;    |

&#x20;    v

Final Order Total


## CHK-06: Checkout-to-Order Handoff

### Create checkout session

`POST /api/checkout/session`

Authentication: customer bearer token required.

Request body:

```json
{
  "address_id": 1,
  "shipping_method_id": 1,
  "coupon_code": null
}
```

The session endpoint revalidates the checkout on the server. Product availability, prices, coupon discount, shipping cost, and final total must come from the validated checkout review, not client-supplied totals.

Successful response includes:

- `checkout_reference_id`: reference for the pending checkout.
- `session_id`: checkout session identifier.
- `status`: session status.
- `expires_at`: session expiry.
- `checkout`: validated review snapshot, including items, coupon, and summary totals.

The checkout session stores the server-generated review snapshot for the Payment handoff. Session lifetime is 30 minutes.

### Payment handoff contract

The frontend should retain `checkout_reference_id` and pass it to the Payment module. The Payment module should use the reference to retrieve or validate the pending checkout; it must not trust totals supplied by the browser.


## CHK-07: Checkpoint 3 Integration � Cart + Checkout + Address + Shipping

### Expected customer flow

Cart with coupon ? Address ? Shipping ? Review ? Order handoff

### Verification status

- Frontend production build: PASS (`npm.cmd --prefix frontend run build`).
- Checkout review and order creation without a coupon: MANUALLY VERIFIED.
- Coupon application and discounted checkout: PENDING VERIFICATION.
- Full Cart-to-Checkout integration: PENDING FINAL VERIFICATION.
- Cart API integration: Depends on the Cart module owner; Cart implementation is outside this assigned scope.
- Mentor sign-off: PENDING.

### Integration requirements

- Checkout must use actual cart items, not hard-coded demo items.
- Address and shipping selections must be retained through review.
- Prices, discounts, shipping costs, and totals must be validated server-side.
- Order handoff must use the server-generated `checkout_reference_id`.
- Cart implementation remains the responsibility of the Cart module owner.

### Submission status

The frontend production build passes, and the no-coupon checkout/order flow has been manually verified. Coupon testing, full Cart-to-Checkout integration verification, and mentor sign-off remain pending. Do not mark Checkpoint 3 complete until the outstanding checks are confirmed.
