#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Script tái đóng gói plugin.zip cho VBook Extension.
- Loại bỏ prefix thư mục thừa (tomato-vbook-ext/) khỏi tên file trong zip
- Dùng DEFLATE (compress_type=8) tiêu chuẩn
- Cập nhật version lên 9 trong cả plugin.json bên trong và bên ngoài zip
- Copy plugin.zip mới sang ext-me/
"""
import sys, os, zipfile, json, shutil

sys.stdout.reconfigure(encoding='utf-8')

NEW_VERSION = 9
PREFIX_TO_STRIP = "tomato-vbook-ext/"

SRC_EXT_DIR   = r"H:\devc c\TomatoVBookSync\tomato-vbook-ext"
SRC_ZIP_OLD   = r"H:\devc c\ext-me\plugin.zip"
OUT_ZIP       = r"H:\devc c\ext-me\plugin.zip"
OUTER_JSON    = r"H:\devc c\ext-me\plugin.json"

# ── 1. Cập nhật plugin.json bên trong thư mục extension ──────────────────────
inner_json_path = os.path.join(SRC_EXT_DIR, "plugin.json")
with open(inner_json_path, "r", encoding="utf-8") as f:
    inner = json.load(f)

inner["metadata"]["version"] = NEW_VERSION
with open(inner_json_path, "w", encoding="utf-8", newline="\n") as f:
    json.dump(inner, f, ensure_ascii=False, indent=2)
print(f"[OK] plugin.json (extension): version → {NEW_VERSION}")

# ── 2. Đóng gói lại ZIP với cấu trúc flat (không có prefix thư mục) ─────────
tmp_zip = OUT_ZIP + ".tmp"

with zipfile.ZipFile(tmp_zip, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6) as zout:
    for root, dirs, files in os.walk(SRC_EXT_DIR):
        # Bỏ qua thư mục __pycache__
        dirs[:] = [d for d in dirs if d != "__pycache__"]
        for fname in files:
            abs_path = os.path.join(root, fname)
            # Lấy path tương đối so với SRC_EXT_DIR → không có prefix thừa
            rel_path = os.path.relpath(abs_path, SRC_EXT_DIR).replace("\\", "/")
            zout.write(abs_path, rel_path)
            print(f"  + {rel_path}")

os.replace(tmp_zip, OUT_ZIP)
print(f"\n[OK] plugin.zip đã tái đóng gói tại: {OUT_ZIP}")

# ── 3. In lại cấu trúc zip để xác nhận ──────────────────────────────────────
print("\n=== CẤU TRÚC ZIP MỚI ===")
with zipfile.ZipFile(OUT_ZIP, "r") as z:
    for info in z.infolist():
        ctype = "DEFLATE" if info.compress_type == 8 else f"type={info.compress_type}"
        print(f"  [{ctype}] {info.filename} ({info.file_size} bytes)")

# ── 4. Cập nhật plugin.json bên ngoài (ext-me store listing) ─────────────────
with open(OUTER_JSON, "r", encoding="utf-8") as f:
    outer = json.load(f)

outer["data"][0]["version"] = NEW_VERSION
with open(OUTER_JSON, "w", encoding="utf-8", newline="\n") as f:
    json.dump(outer, f, ensure_ascii=False, indent=2)
print(f"\n[OK] plugin.json (ext-me, store): version → {NEW_VERSION}")

print("\n✅ Xong! Sẵn sàng push lên GitHub.")
