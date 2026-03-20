"""
BoxTrack — Challan PDF Generator
Canvas-based (not platypus) for full visual control.

Layout:
  ┌─────────────────────────────────────────────┐
  │  DARK HEADER  │  BoxTrack logo text + doc#  │  QR code  │
  ├─────────────────────────────────────────────┤
  │  4-metric strip: Boxes | Duration | Source | Status     │
  ├─────────────────────────────────────────────┤
  │  SESSION DETAILS  (descriptive paragraphs)              │
  ├─────────────────────────────────────────────┤
  │  DETECTION LOG TABLE  (colour-coded conf)               │
  ├─────────────────────────────────────────────┤
  │  FOOTER  generated timestamp + QR note                  │
  └─────────────────────────────────────────────┘
"""

import os, io
from datetime import datetime
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm, mm
from reportlab.lib import colors

CHALLANS_DIR = os.path.join(os.path.dirname(__file__), "..", "challans")
os.makedirs(CHALLANS_DIR, exist_ok=True)

W, H = A4          # 595.27 x 841.89 pt
M    = 1.8 * cm    # margin

# ── colour palette ────────────────────────────────────────────
DARK   = colors.HexColor("#0f172a")
ACCENT = colors.HexColor("#38bdf8")
IND    = colors.HexColor("#818cf8")
GREEN  = colors.HexColor("#4ade80")
YELLOW = colors.HexColor("#facc15")
RED    = colors.HexColor("#f87171")
MUTED  = colors.HexColor("#64748b")
BORDER = colors.HexColor("#e2e8f0")
ALT    = colors.HexColor("#f1f5f9")
TEXT   = colors.HexColor("#1e293b")
WHITE  = colors.white


# ── helpers ───────────────────────────────────────────────────
def _fmt(value) -> str:
    if value is None: return "—"
    if isinstance(value, datetime):
        return value.strftime("%d %b %Y, %H:%M:%S")
    try:
        return datetime.fromisoformat(str(value)).strftime("%d %b %Y, %H:%M:%S")
    except Exception:
        return str(value)

def _duration(session) -> str:
    try:
        s = session.get("started_at")
        e = session.get("ended_at")
        if not s or not e: return "—"
        if not isinstance(s, datetime): s = datetime.fromisoformat(str(s))
        if not isinstance(e, datetime): e = datetime.fromisoformat(str(e))
        secs = int((e - s).total_seconds())
        if secs < 0: return "—"
        return f"{secs // 60}m {secs % 60}s" if secs >= 60 else f"{secs}s"
    except Exception:
        return "—"

def _qr_buf(data: str, px: int = 200):
    try:
        import qrcode
        qr = qrcode.QRCode(version=2, box_size=6, border=2,
                           error_correction=qrcode.constants.ERROR_CORRECT_M)
        qr.add_data(data)
        qr.make(fit=True)
        img = qr.make_image(fill_color="#0f172a", back_color="white")
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        buf.seek(0)
        return buf
    except Exception:
        return None

def _rounded_rect(c, x, y, w, h, r=6, fill=None, stroke=None, lw=0.5):
    """Draw a rounded rectangle on canvas c."""
    if fill:
        c.setFillColor(fill)
    if stroke:
        c.setStrokeColor(stroke)
        c.setLineWidth(lw)
    p = c.beginPath()
    p.moveTo(x + r, y)
    p.lineTo(x + w - r, y)
    p.arcTo(x + w - 2*r, y, x + w, y + 2*r, -90, 90)
    p.lineTo(x + w, y + h - r)
    p.arcTo(x + w - 2*r, y + h - 2*r, x + w, y + h, 0, 90)
    p.lineTo(x + r, y + h)
    p.arcTo(x, y + h - 2*r, x + 2*r, y + h, 90, 90)
    p.lineTo(x, y + r)
    p.arcTo(x, y, x + 2*r, y + 2*r, 180, 90)
    p.close()
    if fill and stroke:
        c.drawPath(p, fill=1, stroke=1)
    elif fill:
        c.drawPath(p, fill=1, stroke=0)
    else:
        c.drawPath(p, fill=0, stroke=1)


# ── section: header band ──────────────────────────────────────
def _draw_header(c, session, qr_buf, y_top):
    """Returns y after header."""
    hh = 3.2 * cm
    x0, y0 = M, y_top - hh
    bw = W - 2 * M

    _rounded_rect(c, x0, y0, bw, hh, r=8, fill=DARK)

    # Brand name
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 22)
    c.drawString(x0 + 16, y0 + hh - 30, "BoxTrack")

    # Subtitle
    c.setFillColor(ACCENT)
    c.setFont("Helvetica", 9)
    c.drawString(x0 + 16, y0 + hh - 44, "Warehouse Packing Challan")

    # Doc number + issued
    sid = str(session.get("_id", ""))
    doc_num = f"CHN-{sid[-8:].upper()}"
    c.setFillColor(IND)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(x0 + 16, y0 + 22, f"Document No: {doc_num}")
    c.drawString(x0 + 16, y0 + 11, f"Issued: {datetime.now().strftime('%d %b %Y, %H:%M')}")

    # QR code (top-right of header)
    qr_size = hh - 10
    if qr_buf:
        from reportlab.lib.utils import ImageReader
        qr_buf.seek(0)
        qr_x = x0 + bw - qr_size - 10
        qr_y = y0 + 5
        c.drawImage(ImageReader(qr_buf), qr_x, qr_y, width=qr_size, height=qr_size,
                    preserveAspectRatio=True, mask='auto')
    else:
        c.setFillColor(MUTED)
        c.setFont("Helvetica", 7)
        c.drawRightString(x0 + bw - 10, y0 + hh / 2, sid[-12:])

    return y0 - 0.4 * cm


# ── section: metrics strip ────────────────────────────────────
def _draw_metrics(c, session, y_top):
    boxes    = str(session.get("final_count", "—"))
    dur      = _duration(session)
    source   = "Live Camera" if session.get("source_type") == "live" else "Uploaded Video"
    status   = session.get("status", "—").upper()
    status_c = GREEN if status == "COMPLETED" else YELLOW

    bw   = W - 2 * M
    cw   = bw / 4
    mh   = 1.8 * cm
    y0   = y_top - mh

    _rounded_rect(c, M, y0, bw, mh, r=6, fill=ALT, stroke=BORDER, lw=0.5)

    items = [
        (boxes,  "TOTAL BOXES",  ACCENT),
        (dur,    "DURATION",     IND),
        (source, "SOURCE",       MUTED),
        (status, "STATUS",       status_c),
    ]
    for i, (val, lbl, col) in enumerate(items):
        cx = M + i * cw + cw / 2
        # divider
        if i > 0:
            c.setStrokeColor(BORDER)
            c.setLineWidth(0.5)
            c.line(M + i * cw, y0 + 6, M + i * cw, y0 + mh - 6)
        # value
        c.setFillColor(col)
        c.setFont("Helvetica-Bold", 16)
        c.drawCentredString(cx, y0 + mh - 26, val)
        # label
        c.setFillColor(MUTED)
        c.setFont("Helvetica", 7)
        c.drawCentredString(cx, y0 + 8, lbl)

    return y0 - 0.5 * cm


# ── section: session details (descriptive) ────────────────────
def _draw_details(c, session, y_top):
    sid      = str(session.get("_id", "—"))
    batch    = session.get("batch_id", "—")
    operator = session.get("operator_id", "—")
    started  = _fmt(session.get("started_at"))
    ended    = _fmt(session.get("ended_at"))
    count    = session.get("final_count", 0)
    status   = session.get("status", "—")
    source   = "Live Camera Feed" if session.get("source_type") == "live" else "Uploaded Video File"
    dur      = _duration(session)

    bw = W - 2 * M

    # Section heading
    c.setFillColor(MUTED)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(M, y_top, "SESSION DETAILS")
    c.setStrokeColor(BORDER)
    c.setLineWidth(0.5)
    c.line(M, y_top - 3, M + bw, y_top - 3)

    y = y_top - 14

    # Descriptive paragraph
    desc = (
        f"This challan certifies that packing session {sid} was conducted by operator "
        f"{operator} under batch {batch}. The session commenced at {started} and concluded "
        f"at {ended}, with a total duration of {dur}. The AI-powered BoxTrack system "
        f"detected a final count of {count} box{'es' if count != 1 else ''} using "
        f"{source}. Session status: {status.upper()}."
    )

    # Word-wrap the description
    c.setFillColor(TEXT)
    c.setFont("Helvetica", 8.5)
    max_w = bw - 4
    words = desc.split()
    line, lines = "", []
    for w in words:
        test = (line + " " + w).strip()
        if c.stringWidth(test, "Helvetica", 8.5) < max_w:
            line = test
        else:
            lines.append(line)
            line = w
    if line: lines.append(line)

    for ln in lines:
        c.drawString(M + 2, y, ln)
        y -= 13

    y -= 6

    # Key-value grid (2 columns)
    fields = [
        ("Session ID",   sid),
        ("Batch ID",     batch),
        ("Operator",     operator),
        ("Started At",   started),
        ("Ended At",     ended),
        ("Duration",     dur),
        ("Final Count",  f"{count} boxes"),
        ("Source Type",  source),
        ("Status",       status.upper()),
    ]

    col_w = bw / 2 - 4
    row_h = 18
    rows_per_col = (len(fields) + 1) // 2
    table_h = rows_per_col * row_h + 4

    _rounded_rect(c, M, y - table_h, bw, table_h, r=6, fill=colors.HexColor("#f8fafc"), stroke=BORDER, lw=0.5)

    for idx, (label, value) in enumerate(fields):
        col = idx // rows_per_col
        row = idx % rows_per_col
        rx = M + col * (bw / 2) + 8
        ry = y - 14 - row * row_h

        # alternating row bg
        if row % 2 == 1:
            _rounded_rect(c, M + col * (bw / 2) + 2, ry - 4, bw / 2 - 4, row_h, r=3, fill=ALT)

        c.setFillColor(MUTED)
        c.setFont("Helvetica", 8)
        c.drawString(rx, ry, label)
        c.setFillColor(TEXT)
        c.setFont("Helvetica-Bold", 8)
        c.drawString(rx + 3.5 * cm, ry, value)

    # column divider
    c.setStrokeColor(BORDER)
    c.setLineWidth(0.5)
    c.line(M + bw / 2, y - 4, M + bw / 2, y - table_h + 4)

    return y - table_h - 0.5 * cm


# ── section: detection log ────────────────────────────────────
def _draw_log(c, logs, y_top):
    if not logs:
        return y_top

    bw   = W - 2 * M
    cols = [0.8*cm, bw - 0.8*cm - 2.8*cm - 2.8*cm, 2.8*cm, 2.8*cm]
    hdrs = ["#", "Timestamp", "Box Count", "Confidence"]
    rh   = 16   # row height

    # Section heading
    c.setFillColor(MUTED)
    c.setFont("Helvetica-Bold", 8)
    shown = min(len(logs), 50)
    c.drawString(M, y_top, f"DETECTION LOG  ·  {shown} of {len(logs)} entries")
    c.setStrokeColor(BORDER)
    c.setLineWidth(0.5)
    c.line(M, y_top - 3, M + bw, y_top - 3)

    y = y_top - 14

    # Header row
    _rounded_rect(c, M, y - rh + 2, bw, rh, r=4, fill=DARK)
    c.setStrokeColor(ACCENT)
    c.setLineWidth(1)
    c.line(M, y - rh + 2, M + bw, y - rh + 2)

    x = M
    for i, (hdr, cw) in enumerate(zip(hdrs, cols)):
        c.setFillColor(WHITE)
        c.setFont("Helvetica-Bold", 8)
        if i == 0 or i >= 2:
            c.drawCentredString(x + cw / 2, y - 10, hdr)
        else:
            c.drawString(x + 4, y - 10, hdr)
        x += cw

    y -= rh

    # Data rows
    for idx, log in enumerate(logs[-50:]):
        conf = float(log.get("confidence", 0))
        conf_c = GREEN if conf >= 0.8 else YELLOW if conf >= 0.5 else RED
        bg = ALT if idx % 2 == 1 else WHITE

        _rounded_rect(c, M, y - rh + 2, bw, rh, r=0, fill=bg)

        x = M
        vals = [
            str(idx + 1),
            _fmt(log.get("timestamp")),
            str(log.get("box_count", "—")),
            f"{conf:.2f}",
        ]
        for i, (val, cw) in enumerate(zip(vals, cols)):
            if i == 0:
                c.setFillColor(MUTED); c.setFont("Helvetica", 8)
                c.drawCentredString(x + cw / 2, y - 10, val)
            elif i == 1:
                c.setFillColor(TEXT); c.setFont("Helvetica", 8)
                c.drawString(x + 4, y - 10, val)
            elif i == 2:
                c.setFillColor(ACCENT); c.setFont("Helvetica-Bold", 8)
                c.drawCentredString(x + cw / 2, y - 10, val)
            else:
                c.setFillColor(conf_c); c.setFont("Helvetica-Bold", 8)
                c.drawCentredString(x + cw / 2, y - 10, val)
            x += cw

        # row border
        c.setStrokeColor(BORDER)
        c.setLineWidth(0.3)
        c.line(M, y - rh + 2, M + bw, y - rh + 2)

        y -= rh

    # outer box
    total_h = (shown + 1) * rh
    c.setStrokeColor(BORDER)
    c.setLineWidth(0.5)
    c.rect(M, y_top - 14 - total_h + 2, bw, total_h)

    return y - 0.5 * cm


# ── section: footer ───────────────────────────────────────────
def _draw_footer(c, session, has_qr):
    sid = str(session.get("_id", ""))
    c.setStrokeColor(BORDER)
    c.setLineWidth(0.5)
    c.line(M, 1.4 * cm, W - M, 1.4 * cm)

    c.setFillColor(MUTED)
    c.setFont("Helvetica", 7)
    qr_note = "  ·  Scan QR to open session in BoxTrack" if has_qr else ""
    c.drawCentredString(W / 2, 0.9 * cm, f"BoxTrack Warehouse Management System{qr_note}")
    c.drawCentredString(W / 2, 0.4 * cm, f"Session ID: {sid}  ·  CONFIDENTIAL — For internal use only")


# ── main entry ────────────────────────────────────────────────
def generate_challan(session: dict, logs: list) -> str:
    session_id  = str(session.get("_id", "unknown"))
    filename    = f"challan_{session_id}.pdf"
    output_path = os.path.abspath(os.path.join(CHALLANS_DIR, filename))

    # Use machine's LAN IP so phones on the same network can scan and open the session
    try:
        import socket
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
    except Exception:
        local_ip = "localhost"

    session_url = f"http://{local_ip}:5173/sessions?id={session_id}"
    qr_buf = _qr_buf(session_url)

    c = canvas.Canvas(output_path, pagesize=A4)
    c.setTitle(f"BoxTrack Challan — {session.get('batch_id', session_id)}")
    c.setAuthor("BoxTrack System")
    c.setSubject("Warehouse Packing Challan")

    y = H - M
    y = _draw_header(c, session, qr_buf, y)
    y = _draw_metrics(c, session, y)
    y = _draw_details(c, session, y)

    # page break if not enough room for log
    if logs and y < 6 * cm:
        c.showPage()
        y = H - M

    if logs:
        y = _draw_log(c, logs, y)

    _draw_footer(c, session, qr_buf is not None)

    c.save()
    return output_path
