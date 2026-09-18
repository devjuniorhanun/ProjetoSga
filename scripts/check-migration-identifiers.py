#!/usr/bin/env python3
"""Audita nomes explícitos e nomes implícitos comuns de índices/foreign keys."""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1] / "back" / "database" / "migrations"
problems = []

for path in sorted(ROOT.glob("*.php")):
    text = path.read_text(errors="ignore")
    table_match = re.search(r"Schema::create\(\s*['\"]([^'\"]+)", text)
    if not table_match:
        continue
    table = table_match.group(1)

    for match in re.finditer(r"foreignId\(\s*['\"]([^'\"]+)['\"]\s*\)(.*?)->constrained\(([^)]*)\)", text, re.S):
        column, _, args = match.groups()
        if not args.strip():
            name = f"{table}_{column}_foreign"
            if len(name) > 64:
                problems.append((path.name, name))

    for kind in ("index", "unique"):
        pattern = rf"->({kind})\(\s*\[([^\]]+)\](?:\s*,\s*['\"]([^'\"]+)['\"])?\s*\)"
        for match in re.finditer(pattern, text, re.S):
            cols = re.findall(r"['\"]([^'\"]+)['\"]", match.group(2))
            explicit = match.group(3)
            name = explicit or f"{table}_{'_'.join(cols)}_{kind}"
            if len(name) > 64:
                problems.append((path.name, name))

if problems:
    print("Nomes acima de 64 caracteres encontrados:")
    for filename, name in problems:
        print(f"- {filename}: {name} ({len(name)})")
    sys.exit(1)

print("OK: nenhum nome de índice/foreign key auditado ultrapassa 64 caracteres.")
