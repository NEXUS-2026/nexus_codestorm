from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from datetime import datetime
import os

CHALLANS_DIR = os.path.join(os.path.dirname(__file__), "..", "challans")
os.makedirs(CHALLANS_DIR, exist_ok=True)


def generate_challan(session: dict, logs: list[dict]) -> str:
    session_id = session.get("_id", "unknown")
    filename = f"challan_{session_id}.pdf"
    output_path = os.path.abspath(os.path.join(CHALLANS_DIR, filename))

    doc = SimpleDocTemplate(output_path, pagesize=A4,
                            leftMargin=2*cm, rightMargin=2*cm,
                            topMargin=2*cm, bottomMargin=2*cm)
    styles = getSampleStyleSheet()
    elements = []

    # Title
    elements.append(Paragraph("Warehouse Packing Challan", styles["Title"]))
    elements.append(Spacer(1, 0.5*cm))

    # Session info
    info_data = [
        ["Session ID", session_id],
        ["Batch ID", session.get("batch_id", "-")],
        ["Operator", session.get("operator_id", "-")],
        ["Started At", _fmt_dt(session.get("started_at"))],
        ["Ended At", _fmt_dt(session.get("ended_at"))],
        ["Final Box Count", str(session.get("final_count", "-"))],
        ["Status", session.get("status", "-")],
    ]
    info_table = Table(info_data, colWidths=[5*cm, 10*cm])
    info_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), colors.lightgrey),
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("PADDING", (0, 0), (-1, -1), 6),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 1*cm))

    # Detection log (last 50)
    if logs:
        elements.append(Paragraph("Detection Log (last 50 entries)", styles["Heading2"]))
        elements.append(Spacer(1, 0.3*cm))
        log_data = [["#", "Timestamp", "Box Count", "Confidence"]]
        for i, log in enumerate(logs[-50:], 1):
            log_data.append([
                str(i),
                _fmt_dt(log.get("timestamp")),
                str(log.get("box_count", "-")),
                f"{log.get('confidence', 0):.2f}",
            ])
        log_table = Table(log_data, colWidths=[1*cm, 7*cm, 4*cm, 4*cm])
        log_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2563EB")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("GRID", (0, 0), (-1, -1), 0.3, colors.grey),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F3F4F6")]),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("PADDING", (0, 0), (-1, -1), 5),
        ]))
        elements.append(log_table)

    elements.append(Spacer(1, 1*cm))
    elements.append(Paragraph(
        f"Generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        styles["Normal"]
    ))

    doc.build(elements)
    return output_path


def _fmt_dt(value) -> str:
    if value is None:
        return "-"
    if isinstance(value, datetime):
        return value.strftime("%Y-%m-%d %H:%M:%S")
    return str(value)
