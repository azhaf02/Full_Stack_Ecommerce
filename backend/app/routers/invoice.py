
from decimal import Decimal
from io import BytesIO
from xml.sax.saxutils import escape

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import require_role
from app.database import get_db
from app.models.invoice import Invoice
from app.models.order import Order
from app.models.user import User


router = APIRouter(tags=["Invoices"])

customer_only = require_role("customer")


def money(value):
    """Convert a database amount into a consistently formatted value."""
    return Decimal(str(value or 0)).quantize(Decimal("0.01"))


def get_customer_order(order_id: int, user: User, db: Session):
    """Return an order only when it belongs to the logged-in customer."""
    order = (
        db.query(Order)
        .filter(
            Order.id == order_id,
            Order.user_id == user.id,
        )
        .first()
    )

    if order is None:
        raise HTTPException(
            status_code=404,
            detail="Order not found",
        )

    return order


def get_or_create_invoice(order: Order, db: Session):
    """Reuse an existing invoice or create one for the order."""
    invoice = (
        db.query(Invoice)
        .filter(Invoice.order_id == order.id)
        .first()
    )

    if invoice is None:
        invoice = Invoice(
            order_id=order.id,
            invoice_number=f"INV-{order.id:08d}",
            amount=order.total_amount,
            tax=order.tax_amount or Decimal("0.00"),
        )

        try:
            db.add(invoice)
            db.commit()
            db.refresh(invoice)

        except IntegrityError:
            db.rollback()

            invoice = (
                db.query(Invoice)
                .filter(Invoice.order_id == order.id)
                .first()
            )

            if invoice is None:
                raise HTTPException(
                    status_code=409,
                    detail="Invoice generation conflict",
                )

    return invoice


def build_invoice_pdf(order: Order, invoice: Invoice, user: User):
    """Generate the invoice PDF in memory."""
    buffer = BytesIO()

    document = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=18 * mm,
        leftMargin=18 * mm,
        topMargin=18 * mm,
        bottomMargin=18 * mm,
    )

    styles = getSampleStyleSheet()

    styles.add(
        ParagraphStyle(
            name="VioraTitle",
            parent=styles["Title"],
            fontSize=24,
            leading=30,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#2f3e30"),
            spaceAfter=6,
        )
    )

    styles.add(
        ParagraphStyle(
            name="VioraSubtitle",
            parent=styles["Heading2"],
            fontSize=15,
            leading=20,
            textColor=colors.HexColor("#2f3e30"),
            spaceBefore=8,
            spaceAfter=10,
        )
    )

    styles.add(
        ParagraphStyle(
            name="SmallText",
            parent=styles["Normal"],
            fontSize=9,
            leading=13,
        )
    )

    story = []

    story.append(Paragraph("VIORA", styles["VioraTitle"]))
    story.append(
        Paragraph(
            "INVOICE",
            ParagraphStyle(
                name="InvoiceHeading",
                parent=styles["Heading2"],
                alignment=TA_CENTER,
                textColor=colors.HexColor("#666666"),
                spaceAfter=18,
            ),
        )
    )

    issued_date = (
        invoice.issued_at.strftime("%d %B %Y")
        if invoice.issued_at
        else "Not available"
    )

    invoice_details = [
        [
            Paragraph("<b>Invoice Number</b>", styles["Normal"]),
            Paragraph(escape(str(invoice.invoice_number)), styles["Normal"]),
        ],
        [
            Paragraph("<b>Order Number</b>", styles["Normal"]),
            Paragraph(escape(str(order.order_number)), styles["Normal"]),
        ],
        [
            Paragraph("<b>Issue Date</b>", styles["Normal"]),
            Paragraph(escape(issued_date), styles["Normal"]),
        ],
    ]

    details_table = Table(
        invoice_details,
        colWidths=[45 * mm, 115 * mm],
    )

    details_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f7f7f3")),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#dddddd")),
            ("INNERGRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#dddddd")),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("LEFTPADDING", (0, 0), (-1, -1), 9),
            ("RIGHTPADDING", (0, 0), (-1, -1), 9),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ])
    )

    story.append(details_table)
    story.append(Spacer(1, 18))

    story.append(Paragraph("BILL TO", styles["VioraSubtitle"]))
    story.append(
        Paragraph(
            f"<b>{escape(str(user.name or 'Customer'))}</b><br/>"
            f"{escape(str(user.email or ''))}",
            styles["Normal"],
        )
    )

    story.append(Spacer(1, 18))
    story.append(Paragraph("ORDER ITEMS", styles["VioraSubtitle"]))

    item_rows = [
        [
            "Product ID",
            "Variant ID",
            "Quantity",
            "Unit Price",
            "Line Total",
        ]
    ]

    for item in order.items:
        unit_price = money(item.unit_price)
        line_total = money(unit_price * item.quantity)

        item_rows.append([
            str(item.product_id),
            str(item.variant_id if item.variant_id is not None else "-"),
            str(item.quantity),
            f"Rs. {unit_price:,.2f}",
            f"Rs. {line_total:,.2f}",
        ])

    items_table = Table(
        item_rows,
        repeatRows=1,
        colWidths=[
            28 * mm,
            28 * mm,
            22 * mm,
            38 * mm,
            40 * mm,
        ],
    )

    items_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2f3e30")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#dddddd")),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("ALIGN", (2, 1), (-1, -1), "RIGHT"),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ])
    )

    story.append(items_table)
    story.append(Spacer(1, 18))

    subtotal = money(order.subtotal)
    discount = money(order.discount_amount)
    tax = money(invoice.tax)
    shipping = money(order.shipping_cost)
    total = money(invoice.amount)

    totals_data = [
        ["Subtotal", f"Rs. {subtotal:,.2f}"],
        ["Discount", f"Rs. {discount:,.2f}"],
        ["Tax", f"Rs. {tax:,.2f}"],
        ["Shipping", f"Rs. {shipping:,.2f}"],
        ["Grand Total", f"Rs. {total:,.2f}"],
    ]

    totals_table = Table(
        totals_data,
        colWidths=[115 * mm, 41 * mm],
        hAlign="RIGHT",
    )

    totals_table.setStyle(
        TableStyle([
            ("ALIGN", (1, 0), (1, -1), "RIGHT"),
            ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
            ("LINEABOVE", (0, -1), (-1, -1), 1, colors.HexColor("#2f3e30")),
            ("TOPPADDING", (0, 0), (-1, -1), 7),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ])
    )

    story.append(totals_table)
    story.append(Spacer(1, 20))

    story.append(Paragraph("PAYMENT DETAILS", styles["VioraSubtitle"]))
    story.append(
        Paragraph(
            f"<b>Payment Method:</b> "
            f"{escape(str(order.payment_method or 'Not available'))}<br/>"
            f"<b>Payment Status:</b> "
            f"{escape(str(order.payment_status or 'Not available'))}",
            styles["Normal"],
        )
    )

    story.append(Spacer(1, 28))
    story.append(
        Paragraph(
            "Thank you for shopping with VIORA!",
            ParagraphStyle(
                name="InvoiceFooter",
                parent=styles["Normal"],
                alignment=TA_CENTER,
                textColor=colors.HexColor("#2f3e30"),
                fontSize=11,
            ),
        )
    )

    document.build(story)

    buffer.seek(0)
    return buffer


@router.get("/api/orders/{order_id}/invoice")
def get_order_invoice(
    order_id: int,
    user: User = Depends(customer_only),
    db: Session = Depends(get_db),
):
    order = get_customer_order(order_id, user, db)
    invoice = get_or_create_invoice(order, db)

    return {
        "invoice_id": invoice.id,
        "invoice_number": invoice.invoice_number,
        "issued_at": invoice.issued_at,
        "order_id": order.id,
        "order_number": order.order_number,
        "customer_id": order.user_id,
        "customer_name": user.name,
        "customer_email": user.email,
        "subtotal": order.subtotal,
        "discount_amount": order.discount_amount,
        "tax_amount": invoice.tax,
        "shipping_cost": order.shipping_cost,
        "total_amount": invoice.amount,
        "payment_method": order.payment_method,
        "payment_status": order.payment_status,
        "items": [
            {
                "product_id": item.product_id,
                "variant_id": item.variant_id,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "line_total": item.unit_price * item.quantity,
            }
            for item in order.items
        ],
    }


@router.get("/api/orders/{order_id}/invoice/pdf")
def download_order_invoice_pdf(
    order_id: int,
    user: User = Depends(customer_only),
    db: Session = Depends(get_db),
):
    order = get_customer_order(order_id, user, db)
    invoice = get_or_create_invoice(order, db)

    pdf_buffer = build_invoice_pdf(order, invoice, user)

    filename = f"{invoice.invoice_number}.pdf"

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        },
    )
