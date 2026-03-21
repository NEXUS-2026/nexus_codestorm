# WAREgaurd - Challan PDF Generator
# Multi-page: content flows across pages automatically.

import os
import io
from datetime import datetime
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.lib.utils import ImageReader

CHALLANS_DIR = os.path.join(os.path.dirname(__file__), "..", "challans")
os.makedirs(CHALLANS_DIR, exist_ok=True)

W, H     = A4
M        = 1.6 * cm
CW       = W - 2 * M
FOOTER_H = 1.8 * cm
SAFE_Y   = FOOTER_H + 0.6 * cm

DARK    = colors.HexColor("#0f172a")
DARK2   = colors.HexColor("#1e293b")
ACCENT  = colors.HexColor("#38bdf8")
INDIGO  = colors.HexColor("#818cf8")
GREEN   = colors.HexColor("#4ade80")
YELLOW  = colors.HexColor("#facc15")
RED     = colors.HexColor("#f87171")
MUTED   = colors.HexColor("#64748b")
BORDER  = colors.HexColor("#cbd5e1")
ROW_ALT = colors.HexColor("#f1f5f9")
BG_CARD = colors.HexColor("#f8fafc")
TEXT    = colors.HexColor("#0f172a")
WHITE   = colors.white


def _fmt(value):
    if value is None:
        return "--"
    if isinstance(value, datetime):
        return value.strftime("%d %b %Y  %H:%M:%S")
    try:
        return datetime.fromisoformat(str(value)).strftime("%d %b %Y  %H:%M:%S")
    except Exception:
        return str(value)


def _duration(session):
    try:
        s = session.get("started_at")
        e = session.get("ended_at")
        if not s or not e:
            return "--"
        if not isinstance(s, datetime):
            s = datetime.fromisoformat(str(s))
        if not isinstance(e, datetime):
            e = datetime.fromisoformat(str(e))
        secs = int((e - s).total_seconds())
        if secs < 0:
            return "--"
        h, rem = divmod(secs, 3600)
        m, s2  = divmod(rem, 60)
        if h:
            return "%dh %dm %ds" % (h, m, s2)
        if m:
            return "%dm %ds" % (m, s2)
        return "%ds" % s2
    except Exception:
        return "--"


def _qr_buf(data):
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


def _rect(c, x, y, w, h, fill=None, stroke=None, lw=0.5, r=0):
    if fill:
        c.setFillColor(fill)
    if stroke:
        c.setStrokeColor(stroke)
        c.setLineWidth(lw)
    if r:
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
        c.drawPath(p, fill=1 if fill else 0, stroke=1 if stroke else 0)
    else:
        if fill and stroke:
            c.rect(x, y, w, h, fill=1, stroke=1)
        elif fill:
            c.rect(x, y, w, h, fill=1, stroke=0)
        elif stroke:
            c.rect(x, y, w, h, fill=0, stroke=1)


class PageWriter:
    def __init__(self, c, session):
        self.c       = c
        self.session = session
        self.page    = 1
        self.y       = H - M

    def need_break(self, height):
        return self.y - height < SAFE_Y

    def new_page(self):
        self._draw_footer()
        self.c.showPage()
        self.page += 1
        self.y = H - M
        self._draw_page_header()

    def ensure(self, height):
        if self.need_break(height):
            self.new_page()

    def _draw_page_header(self):
        sid   = str(self.session.get("_id", ""))
        batch = self.session.get("batch_id", "--")
        hh    = 0.9 * cm
        _rect(self.c, M, self.y - hh, CW, hh, fill=DARK, r=4)
        self.c.setFillColor(WHITE)
        self.c.setFont("Helvetica-Bold", 9)
        self.c.drawString(M + 10, self.y - hh + 8, "WAREgaurd")
        self.c.setFillColor(MUTED)
        self.c.setFont("Helvetica", 8)
        self.c.drawCentredString(
            M + CW / 2, self.y - hh + 8,
            "Batch: %s  |  Session: ...%s" % (batch, sid[-10:])
        )
        self.c.setFillColor(INDIGO)
        self.c.setFont("Helvetica", 8)
        self.c.drawRightString(M + CW - 8, self.y - hh + 8, "Page %d" % self.page)
        self.y -= hh + 0.4 * cm

    def _draw_footer(self):
        sid = str(self.session.get("_id", ""))
        self.c.setStrokeColor(BORDER)
        self.c.setLineWidth(0.4)
        self.c.line(M, FOOTER_H, W - M, FOOTER_H)
        self.c.setFillColor(MUTED)
        self.c.setFont("Helvetica", 7)
        self.c.drawString(
            M, FOOTER_H - 9,
            "WAREgaurd Warehouse Management System  |  Session: %s  |  CONFIDENTIAL" % sid
        )
        self.c.drawRightString(
            W - M, FOOTER_H - 9,
            "Page %d  |  Generated %s" % (
                self.page, datetime.now().strftime("%d %b %Y %H:%M"))
        )

    def finish(self):
        self._draw_footer()


def _draw_header(pw, qr_buf):
    c   = pw.c
    HH  = 3.4 * cm
    QR  = HH - 10
    y0  = pw.y - HH
    sid = str(pw.session.get("_id", ""))

    _rect(c, M, y0, CW, HH, fill=DARK, r=8)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 26)
    c.drawString(M + 18, y0 + HH - 36, "WAREgaurd")
    c.setFillColor(ACCENT)
    c.setFont("Helvetica", 9)
    c.drawString(M + 18, y0 + HH - 50, "Warehouse Packing Challan")
    c.setFillColor(INDIGO)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(M + 18, y0 + 22, "Document No:  CHN-%s" % sid[-8:].upper())
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 8)
    c.drawString(M + 18, y0 + 11,
                 "Issued:  %s" % datetime.now().strftime("%d %b %Y, %H:%M"))

    if qr_buf:
        qr_buf.seek(0)
        c.drawImage(
            ImageReader(qr_buf), M + CW - QR - 8, y0 + 4,
            width=QR, height=QR, preserveAspectRatio=True, mask="auto"
        )

    pw.y = y0 - 0.5 * cm


def _draw_metrics(pw):
    c      = pw.c
    MH     = 2.0 * cm
    pw.ensure(MH + 0.5 * cm)
    y0     = pw.y - MH
    cw     = CW / 4
    status = pw.session.get("status", "--").upper()

    _rect(c, M, y0, CW, MH, fill=BG_CARD, stroke=BORDER, lw=0.5, r=6)

    items = [
        (str(pw.session.get("final_count", "--")), "TOTAL BOXES", ACCENT),
        (_duration(pw.session),                    "DURATION",    INDIGO),
        (
            "Live Camera" if pw.session.get("source_type") == "live"
            else "Uploaded Video",
            "SOURCE", MUTED
        ),
        (status, "STATUS", GREEN if status == "COMPLETED" else YELLOW),
    ]

    for i, (val, lbl, col) in enumerate(items):
        cx = M + i * cw + cw / 2
        if i > 0:
            c.setStrokeColor(BORDER)
            c.setLineWidth(0.4)
            c.line(M + i * cw, y0 + 6, M + i * cw, y0 + MH - 6)
        c.setFillColor(col)
        c.setFont("Helvetica-Bold", 15)
        c.drawCentredString(cx, y0 + MH - 24, val)
        c.setFillColor(MUTED)
        c.setFont("Helvetica", 7)
        c.drawCentredString(cx, y0 + 7, lbl)

    pw.y = y0 - 0.6 * cm


def _draw_session_info(pw):
    c       = pw.c
    session = pw.session
    ROW_H   = 20
    LABEL_W = 3.2 * cm
    COL_W   = CW / 2

    sid      = str(session.get("_id", "--"))
    batch    = session.get("batch_id", "--")
    operator = session.get("operator_id", "--")
    started  = _fmt(session.get("started_at"))
    ended    = _fmt(session.get("ended_at"))
    dur      = _duration(session)
    count    = session.get("final_count", 0)
    source   = ("Live Camera Feed" if session.get("source_type") == "live"
                else "Uploaded Video File")
    status   = session.get("status", "--").upper()

    left_fields = [
        ("Session ID",  sid),
        ("Batch ID",    batch),
        ("Operator ID", operator),
        ("Source",      source),
        ("Status",      status),
    ]
    right_fields = [
        ("Started At",  started),
        ("Ended At",    ended),
        ("Duration",    dur),
        ("Final Count", "%d box%s" % (count, "es" if count != 1 else "")),
        ("Document No", "CHN-%s" % sid[-8:].upper()),
    ]

    rows    = max(len(left_fields), len(right_fields))
    TABLE_H = rows * ROW_H + 10
    pw.ensure(14 + TABLE_H + 0.6 * cm)

    c.setFillColor(MUTED)
    c.setFont("Helvetica-Bold", 7.5)
    c.drawString(M, pw.y, "SESSION DETAILS")
    c.setStrokeColor(BORDER)
    c.setLineWidth(0.4)
    c.line(M, pw.y - 3, M + CW, pw.y - 3)
    y = pw.y - 14

    _rect(c, M, y - TABLE_H, CW, TABLE_H, fill=BG_CARD, stroke=BORDER, lw=0.5, r=6)
    c.setStrokeColor(BORDER)
    c.setLineWidth(0.4)
    c.line(M + COL_W, y - 4, M + COL_W, y - TABLE_H + 4)

    for col_idx, fields in enumerate((left_fields, right_fields)):
        x_base = M + col_idx * COL_W + 10
        for row_idx, (label, value) in enumerate(fields):
            ry = y - 14 - row_idx * ROW_H
            if row_idx % 2 == 0:
                _rect(c, M + col_idx * COL_W + 2, ry - 5,
                      COL_W - 4, ROW_H, fill=ROW_ALT)
            c.setStrokeColor(BORDER)
            c.setLineWidth(0.25)
            c.line(M + col_idx * COL_W + 4, ry - 5,
                   M + (col_idx + 1) * COL_W - 4, ry - 5)
            c.setFillColor(MUTED)
            c.setFont("Helvetica", 8)
            c.drawString(x_base, ry, label)
            c.setFillColor(TEXT)
            c.setFont("Helvetica-Bold", 8)
            max_w = COL_W - LABEL_W - 16
            val_str = value
            while val_str and c.stringWidth(val_str, "Helvetica-Bold", 8) > max_w:
                val_str = val_str[:-4] + "..."
            c.drawString(x_base + LABEL_W, ry, val_str)

    pw.y = y - TABLE_H - 0.6 * cm


def _draw_log(pw, logs):
    if not logs:
        return

    c      = pw.c
    ROW_H  = 17
    COLS   = [0.7 * cm, CW - 0.7 * cm - 2.6 * cm - 2.6 * cm, 2.6 * cm, 2.6 * cm]
    HDRS   = ["#", "Timestamp", "Boxes", "Confidence"]
    ALIGNS = ["C", "L", "C", "C"]

    def _cell(text, x, y, w, align, font, size, color):
        c.setFillColor(color)
        c.setFont(font, size)
        if align == "C":
            c.drawCentredString(x + w / 2, y, text)
        else:
            c.drawString(x + 5, y, text)

    def _draw_table_header(y_pos):
        _rect(c, M, y_pos - ROW_H + 3, CW, ROW_H, fill=DARK2, r=4)
        c.setStrokeColor(ACCENT)
        c.setLineWidth(0.8)
        c.line(M, y_pos - ROW_H + 3, M + CW, y_pos - ROW_H + 3)
        x = M
        for hdr, cw_, align in zip(HDRS, COLS, ALIGNS):
            _cell(hdr, x, y_pos - 10, cw_, align, "Helvetica-Bold", 8, WHITE)
            x += cw_
        return y_pos - ROW_H

    pw.ensure(14 + ROW_H * 3)
    c.setFillColor(MUTED)
    c.setFont("Helvetica-Bold", 7.5)
    c.drawString(M, pw.y, "DETECTION LOG  -  %d entries" % len(logs))
    c.setStrokeColor(BORDER)
    c.setLineWidth(0.4)
    c.line(M, pw.y - 3, M + CW, pw.y - 3)
    pw.y -= 14

    pw.y = _draw_table_header(pw.y)

    for idx, log in enumerate(logs):
        if pw.y - ROW_H < SAFE_Y:
            pw.new_page()
            pw.y = _draw_table_header(pw.y)

        conf   = float(log.get("confidence", 0))
        conf_c = GREEN if conf >= 0.75 else YELLOW if conf >= 0.5 else RED
        bg     = ROW_ALT if idx % 2 == 0 else WHITE

        _rect(c, M, pw.y - ROW_H + 3, CW, ROW_H, fill=bg)
        c.setStrokeColor(BORDER)
        c.setLineWidth(0.25)
        c.line(M, pw.y - ROW_H + 3, M + CW, pw.y - ROW_H + 3)

        vals = [
            str(idx + 1),
            _fmt(log.get("timestamp")),
            str(log.get("box_count", "--")),
            "%.2f" % conf,
        ]
        clrs = [MUTED, TEXT, ACCENT, conf_c]
        fnts = ["Helvetica", "Helvetica", "Helvetica-Bold", "Helvetica-Bold"]

        x = M
        for val, cw_, align, col, fnt in zip(vals, COLS, ALIGNS, clrs, fnts):
            _cell(val, x, pw.y - 10, cw_, align, fnt, 8, col)
            x += cw_

        pw.y -= ROW_H

    pw.y -= 0.5 * cm


def _draw_summary(pw, logs):
    c       = pw.c
    session = pw.session
    SH      = 1.1 * cm

    pw.ensure(SH + 0.6 * cm)
    y0 = pw.y - SH
    _rect(c, M, y0, CW, SH, fill=DARK, r=6)

    count    = session.get("final_count", 0)
    avg_conf = (sum(l.get("confidence", 0) for l in logs) / len(logs)) if logs else 0
    batch    = session.get("batch_id", "--")
    operator = session.get("operator_id", "--")
    dur      = _duration(session)

    summary = (
        "Batch: %s   |   Operator: %s   |   Total Boxes: %s   |   "
        "Duration: %s   |   Avg Confidence: %.2f"
        % (batch, operator, count, dur, avg_conf)
    )
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 7.5)
    c.drawCentredString(M + CW / 2, y0 + SH / 2 - 3, summary)
    pw.y = y0 - 0.4 * cm


def generate_challan(session, logs):
    session_id  = str(session.get("_id", "unknown"))
    output_path = os.path.abspath(
        os.path.join(CHALLANS_DIR, "challan_%s.pdf" % session_id)
    )

    try:
        import socket
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
    except Exception:
        local_ip = "localhost"

    qr_buf = _qr_buf("http://%s:5173/sessions?id=%s" % (local_ip, session_id))

    cv = canvas.Canvas(output_path, pagesize=A4)
    cv.setTitle("WAREgaurd Challan - %s" % session.get("batch_id", session_id))
    cv.setAuthor("WAREgaurd System")
    cv.setSubject("Warehouse Packing Challan")

    pw = PageWriter(cv, session)
    _draw_header(pw, qr_buf)
    _draw_metrics(pw)
    _draw_session_info(pw)
    _draw_log(pw, logs)
    _draw_summary(pw, logs)
    pw.finish()

    cv.save()
    return output_path
