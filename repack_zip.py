#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Script tái đóng gói plugin.zip cho VBook Extension.
- Loại bỏ prefix thư mục thừa (tomato-vbook-ext/) khỏi tên file trong zip
- Dùng DEFLATE (compress_type=8) tiêu chuẩn
- Cập nhật version lên 10 trong cả plugin.json bên trong và bên ngoài zip
- Ghi đè vào plugin.zip và plugin.json trong repo này
"""
import sys
import os
import zipfile
import json

# Fix Windows console encoding khi in ký tự tiếng Việt
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

NEW_VERSION = 11
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Xác định các đường dẫn tương đối để chạy di động
SRC_EXT_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "TomatoVBookSync", "tomato-vbook-ext"))
OUT_ZIP = os.path.join(BASE_DIR, "plugin.zip")
OUTER_JSON = os.path.join(BASE_DIR, "plugin.json")

# ── 1. Cập nhật plugin.json bên trong thư mục extension ──────────────────────
inner_json_path = os.path.join(SRC_EXT_DIR, "plugin.json")
if os.path.exists(inner_json_path):
    with open(inner_json_path, "r", encoding="utf-8") as f:
        inner = json.load(f)
    inner["metadata"]["version"] = NEW_VERSION
    with open(inner_json_path, "w", encoding="utf-8", newline="\n") as f:
        json.dump(inner, f, ensure_ascii=False, indent=2)
    print(f"[OK] plugin.json (extension): version → {NEW_VERSION}")
else:
    print(f"[-] Khong tim thay {inner_json_path}")

# ── 2. Đóng gói lại ZIP với cấu trúc flat (không có prefix thư mục) ─────────
tmp_zip = OUT_ZIP + ".tmp"
if os.path.exists(SRC_EXT_DIR):
    with zipfile.ZipFile(tmp_zip, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6) as zout:
        for root, dirs, files in os.walk(SRC_EXT_DIR):
            dirs[:] = [d for d in dirs if d != "__pycache__" and not d.startswith(".")]
            for fname in files:
                if fname.startswith("."):
                    continue
                abs_path = os.path.join(root, fname)
                rel_path = os.path.relpath(abs_path, SRC_EXT_DIR).replace("\\", "/")
                zout.write(abs_path, rel_path)
                print(f"  + {rel_path}")

    if os.path.exists(OUT_ZIP):
        os.remove(OUT_ZIP)
    os.rename(tmp_zip, OUT_ZIP)
    print(f"\n[OK] plugin.zip đã tái đóng gói tại: {OUT_ZIP}")
else:
    print(f"[-] Khong tim thay thu muc nguon: {SRC_EXT_DIR}")

# ── 3. In lại cấu trúc zip để xác nhận ──────────────────────────────────────
if os.path.exists(OUT_ZIP):
    print("\n=== CẤU TRÚC ZIP MỚI ===")
    with zipfile.ZipFile(OUT_ZIP, "r") as z:
        for info in z.infolist():
            ctype = "DEFLATE" if info.compress_type == 8 else f"type={info.compress_type}"
            print(f"  [{ctype}] {info.filename} ({info.file_size} bytes)")

# ── 4. Cập nhật plugin.json bên ngoài (ext-me store listing) ─────────────────
if os.path.exists(OUTER_JSON):
    with open(OUTER_JSON, "r", encoding="utf-8") as f:
        outer = json.load(f)

    outer["data"][0]["version"] = NEW_VERSION
    with open(OUTER_JSON, "w", encoding="utf-8", newline="\n") as f:
        json.dump(outer, f, ensure_ascii=False, indent=2)
    print(f"\n[OK] plugin.json (ext-me, store): version → {NEW_VERSION}")

print("\n✅ Xong! Sẵn sàng push lên GitHub.")
