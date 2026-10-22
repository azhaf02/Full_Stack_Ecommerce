# ORD-04 test evidence: order status transitions and history

Generated 2026-10-04 02:17 UTC. Everything below was run against a throwaway local database, not the shared one.

## Live API run

The real API server (`uvicorn app.main:app`) was started and called over HTTP with real login tokens (`create_access_token`). Order A is a COD order, Order B an online order with payment still pending.

```text
Order A: ORD-20261004-08299D (id 1, cash on delivery, starts CONFIRMED)
Order B: ORD-20261004-E84C93 (id 2, online payment, still PLACED, payment PENDING)

## 1. Access control
### No login is refused
    PUT /api/admin/orders/1/status   body: {'status': 'PROCESSING'}   (as nobody, no token)
    -> HTTP 401   {'detail': 'Not authenticated'}

### A customer cannot change status
    PUT /api/admin/orders/1/status   body: {'status': 'PROCESSING'}   (as customer)
    -> HTTP 403   {'detail': 'Not enough permissions'}

## 2. Valid transitions are accepted (Order A walks the whole lifecycle)

    PUT /api/admin/orders/1/status   body: {'status': 'PROCESSING', 'remarks': 'moved to PROCESSING'}   (as admin)
    -> HTTP 200   status=PROCESSING  payment_status=PENDING  allowed_next_statuses=['PACKED', 'CANCELLED']


    PUT /api/admin/orders/1/status   body: {'status': 'PACKED', 'remarks': 'moved to PACKED'}   (as admin)
    -> HTTP 200   status=PACKED  payment_status=PENDING  allowed_next_statuses=['SHIPPED']


    PUT /api/admin/orders/1/status   body: {'status': 'SHIPPED', 'remarks': 'moved to SHIPPED'}   (as admin)
    -> HTTP 200   status=SHIPPED  payment_status=PENDING  allowed_next_statuses=['OUT_FOR_DELIVERY']


    PUT /api/admin/orders/1/status   body: {'status': 'OUT_FOR_DELIVERY', 'remarks': 'moved to OUT_FOR_DELIVERY'}   (as admin)
    -> HTTP 200   status=OUT_FOR_DELIVERY  payment_status=PENDING  allowed_next_statuses=['DELIVERED']


    PUT /api/admin/orders/1/status   body: {'status': 'DELIVERED', 'remarks': 'moved to DELIVERED'}   (as admin)
    -> HTTP 200   status=DELIVERED  payment_status=PENDING  allowed_next_statuses=[]

## 3. Invalid and out-of-sequence transitions are rejected
### The assignment's example: DELIVERED to PLACED
    PUT /api/admin/orders/1/status   body: {'status': 'PLACED', 'remarks': 'go back'}   (as admin)
    -> HTTP 409   {'detail': 'An order cannot move from DELIVERED to PLACED'}

### Cancelling a delivered order
    PUT /api/admin/orders/1/status   body: {'status': 'CANCELLED'}   (as admin)
    -> HTTP 409   {'detail': 'An order cannot move from DELIVERED to CANCELLED'}

### Skipping steps (PLACED to SHIPPED)
    PUT /api/admin/orders/2/status   body: {'status': 'SHIPPED'}   (as admin)
    -> HTTP 409   {'detail': 'An order cannot move from PLACED to SHIPPED'}

### A status that does not exist
    PUT /api/admin/orders/2/status   body: {'status': 'TELEPORTED'}   (as admin)
    -> HTTP 422   {'detail': "'TELEPORTED' is not a valid order status"}

### Confirming an online order whose payment has not been verified
    PUT /api/admin/orders/2/status   body: {'status': 'CONFIRMED'}   (as admin)
    -> HTTP 409   {'detail': 'Order ORD-20261004-E84C93 cannot be confirmed: online payment is PENDING, not SUCCESS'}

### An order that does not exist
    PUT /api/admin/orders/99999/status   body: {'status': 'PROCESSING'}   (as admin)
    -> HTTP 404   {'detail': 'Order 99999 not found'}

## 4. Every change is in the history (customer view of Order A)
    previous          new               changed_by  changed_at (UTC)     remarks
    None              PLACED            1           2026-10-04T02:17:24  Order placed
    PLACED            CONFIRMED         1           2026-10-04T02:17:24  Cash on delivery accepted
    CONFIRMED         PROCESSING        9           2026-10-04T02:17:26  moved to PROCESSING
    PROCESSING        PACKED            9           2026-10-04T02:17:26  moved to PACKED
    PACKED            SHIPPED           9           2026-10-04T02:17:26  moved to SHIPPED
    SHIPPED           OUT_FOR_DELIVERY  9           2026-10-04T02:17:26  moved to OUT_FOR_DELIVERY
    OUT_FOR_DELIVERY  DELIVERED         9           2026-10-04T02:17:26  moved to DELIVERED

```

## Automated tests for status rules and the admin endpoint

`python -m pytest tests/test_order_service.py tests/test_order_api.py -k "transition or status or admin or history or lifecycle or hook"` -> **36 passed, 32 deselected in 2.25s**

```text
PASS tests/test_order_service.py::test_every_status_has_a_rule
PASS tests/test_order_service.py::test_invalid_transitions_are_rejected_and_nothing_is_logged[DELIVERED-PLACED]
PASS tests/test_order_service.py::test_invalid_transitions_are_rejected_and_nothing_is_logged[PLACED-SHIPPED]
PASS tests/test_order_service.py::test_invalid_transitions_are_rejected_and_nothing_is_logged[PLACED-DELIVERED]
PASS tests/test_order_service.py::test_invalid_transitions_are_rejected_and_nothing_is_logged[PACKED-CANCELLED]
PASS tests/test_order_service.py::test_invalid_transitions_are_rejected_and_nothing_is_logged[SHIPPED-CANCELLED]
PASS tests/test_order_service.py::test_invalid_transitions_are_rejected_and_nothing_is_logged[DELIVERED-RETURNED]
PASS tests/test_order_service.py::test_invalid_transitions_are_rejected_and_nothing_is_logged[REFUNDED-PLACED]
PASS tests/test_order_service.py::test_invalid_transitions_are_rejected_and_nothing_is_logged[CANCELLED-CONFIRMED]
PASS tests/test_order_service.py::test_unknown_status_is_rejected
PASS tests/test_order_service.py::test_cancelled_paid_order_goes_through_refund_and_payment_status_follows
PASS tests/test_order_service.py::test_allowed_next_statuses
PASS tests/test_order_service.py::test_hooks_run_with_old_and_new_status
PASS tests/test_order_service.py::test_hooks_do_not_run_when_the_change_is_rejected
PASS tests/test_order_service.py::test_a_failing_hook_can_be_rolled_back_with_the_status_change
PASS tests/test_order_service.py::test_paid_online_order_offers_confirm_and_cancel_in_lifecycle_order
PASS tests/test_order_service.py::test_next_options_follow_the_lifecycle[CONFIRMED-expected0]
PASS tests/test_order_service.py::test_next_options_follow_the_lifecycle[PROCESSING-expected1]
PASS tests/test_order_service.py::test_next_options_follow_the_lifecycle[PACKED-expected2]
PASS tests/test_order_service.py::test_next_options_follow_the_lifecycle[SHIPPED-expected3]
PASS tests/test_order_service.py::test_next_options_follow_the_lifecycle[OUT_FOR_DELIVERY-expected4]
PASS tests/test_order_service.py::test_next_options_follow_the_lifecycle[REFUNDED-expected5]
PASS tests/test_order_service.py::test_return_steps_are_blocked_for_the_plain_status_route
PASS tests/test_order_api.py::test_customers_cannot_use_admin_routes
PASS tests/test_order_api.py::test_admins_cannot_use_customer_routes
PASS tests/test_order_api.py::test_a_failing_hook_rolls_the_cancellation_back
PASS tests/test_order_api.py::test_admin_moves_an_order_forward_and_it_is_logged
PASS tests/test_order_api.py::test_admin_cannot_skip_steps_or_use_an_unknown_status
PASS tests/test_order_api.py::test_admin_cannot_confirm_an_unpaid_online_order
PASS tests/test_order_api.py::test_return_steps_cannot_be_done_through_the_status_route
PASS tests/test_order_api.py::test_admin_runs_a_return_through_to_the_refund
PASS tests/test_order_api.py::test_admin_rejects_a_return_and_the_order_goes_back_to_delivered
PASS tests/test_order_api.py::test_admin_return_route_validation
PASS tests/test_order_api.py::test_order_status_route_is_blocked_while_a_return_is_open
PASS tests/test_order_api.py::test_admin_response_lists_what_can_be_chosen_next
PASS tests/test_order_api.py::test_admin_history_records_every_change_in_order
```

Run all tests: `cd backend && python -m pytest`.
