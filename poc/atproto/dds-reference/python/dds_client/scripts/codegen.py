#!/usr/bin/env python3
"""Generate Pydantic models from the DDS v1 ATProto lexicons.

Mirrors `packages/client-ts/scripts/codegen.mjs`: walks `lexicons/org.dds-wg.v1/*.json`
and emits modules under `dds_client/gen/org/dds_wg/v1/`. Cross-NSID refs are resolved
relative to the generated package; `com.atproto.repo.strongRef` is emitted as a stub.

This is intentionally not a general-purpose ATProto lexicon-to-pydantic compiler. It
covers exactly the shapes used by `org.dds-wg.v1.*`.
"""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

HERE = Path(__file__).resolve().parent
PKG_ROOT = HERE.parent
REPO_ROOT = PKG_ROOT.parent.parent
LEXICON_ROOT = REPO_ROOT / "lexicons"
OUT_DIR = PKG_ROOT / "dds_client" / "gen"


def pascal(name: str) -> str:
    """userAgent -> UserAgent, foo_bar -> FooBar."""
    parts = re.split(r"[._\-]", name)
    return "".join(p[:1].upper() + p[1:] for p in parts if p)


# Python keywords + pydantic BaseModel attributes that shadow if used as field names.
RESERVED_FIELD_NAMES: set[str] = {
    # Python keywords (subset that could appear in lexicons)
    "from",
    "in",
    "class",
    "type",
    "return",
    "yield",
    "import",
    "as",
    "is",
    "not",
    "and",
    "or",
    "if",
    "else",
    "for",
    "while",
    "with",
    "lambda",
    "global",
    "nonlocal",
    "pass",
    "break",
    "continue",
    "del",
    "try",
    "except",
    "finally",
    "raise",
    "def",
    "async",
    "await",
    # Pydantic v2 BaseModel attributes that cause shadowing warnings/errors
    "json",
    "dict",
    "copy",
    "schema",
    "validate",
    "parse_obj",
    "parse_raw",
    "parse_file",
    "from_orm",
    "model_dump",
    "model_dump_json",
    "model_copy",
    "model_validate",
    "model_construct",
    "model_fields",
    "model_config",
}


def sanitize_field_name(name: str) -> tuple[str, str | None]:
    """Return (python_attr_name, alias). If alias is None, no alias needed."""
    if name in RESERVED_FIELD_NAMES:
        return f"{name}_", name
    return name, None


def nsid_to_module(nsid: str) -> tuple[str, str]:
    """org.dds-wg.v1.statement -> ("dds_client.gen.org.dds_wg.v1.statement", "statement")"""
    parts = nsid.split(".")
    py_parts = [p.replace("-", "_") for p in parts]
    return "dds_client.gen." + ".".join(py_parts), py_parts[-1]


def nsid_to_path(nsid: str) -> Path:
    """org.dds-wg.v1.statement -> .../gen/org/dds_wg/v1/statement.py"""
    parts = nsid.split(".")
    py_parts = [p.replace("-", "_") for p in parts]
    return OUT_DIR.joinpath(*py_parts).with_suffix(".py")


class ModuleEmitter:
    """Emits a single .py module for one lexicon JSON."""

    def __init__(self, lexicon: dict[str, Any]):
        self.lexicon = lexicon
        self.nsid: str = lexicon["id"]
        self.defs: dict[str, Any] = lexicon["defs"]
        # Track imports we need: full module path -> alias
        self.imports: dict[str, str] = {}
        self.body_lines: list[str] = []
        self.exports: list[str] = []
        # local frag refs already emitted as forward declarations
        self.declared_classes: set[str] = set()

    def emit(self) -> str:
        for name, defn in self.defs.items():
            self._emit_def(name, defn)
        return self._render()

    def _alias_for(self, module: str) -> str:
        if module in self.imports:
            return self.imports[module]
        # Make a short, unique alias: take last 2 path components
        parts = module.rsplit(".", 2)
        alias = "_" + "_".join(p.replace("-", "_") for p in parts[-2:])
        n = 1
        candidate = alias
        while candidate in self.imports.values():
            n += 1
            candidate = f"{alias}{n}"
        self.imports[module] = candidate
        return candidate

    def _ref_type(self, ref: str) -> str:
        """Resolve a `ref` string to a Python type expression."""
        if ref == "com.atproto.repo.strongRef":
            alias = self._alias_for("dds_client.gen.com.atproto.repo.strong_ref")
            return f"{alias}.Main"
        if ref.startswith("#"):
            return pascal(ref[1:])
        if "#" in ref:
            nsid, frag = ref.split("#", 1)
            module, _ = nsid_to_module(nsid)
            alias = self._alias_for(module)
            return f"{alias}.{pascal(frag)}"
        module, _ = nsid_to_module(ref)
        alias = self._alias_for(module)
        return f"{alias}.Main"

    def _union_type(self, refs: list[str]) -> str:
        parts = [self._ref_type(r) for r in refs]
        if len(parts) == 1:
            return parts[0]
        return "Union[" + ", ".join(parts) + "]"

    def _type_expr(self, schema: dict[str, Any]) -> str:
        """Translate a lexicon field schema to a Python type expression."""
        t = schema.get("type")
        if t == "string":
            return "str"
        if t == "integer":
            return "int"
        if t == "boolean":
            return "bool"
        if t == "unknown":
            return "Any"
        if t == "bytes":
            return "bytes"
        if t == "cid-link":
            return "str"
        if t == "blob":
            return "Any"
        if t == "array":
            inner = self._type_expr(schema["items"])
            return f"list[{inner}]"
        if t == "ref":
            return self._ref_type(schema["ref"])
        if t == "union":
            return self._union_type(schema["refs"])
        if t == "object":
            return "dict[str, Any]"  # inline object: rarely used; flatten
        raise ValueError(f"Unsupported field type: {schema!r}")

    def _emit_class(self, class_name: str, type_id: str, obj: dict[str, Any], doc: str = ""):
        required = set(obj.get("required", []))
        properties = obj.get("properties", {})
        lines: list[str] = []
        lines.append(f"class {class_name}(BaseModel):")
        body_doc = doc.strip() or f"Generated from {self.nsid}#{class_name}."
        # escape any pre-existing triple-quotes in the doc text
        body_doc = body_doc.replace('"""', '\\"\\"\\"')
        lines.append(f'    """{body_doc}"""')
        lines.append('    model_config = ConfigDict(populate_by_name=True, extra="allow")')
        lines.append(f'    type_: str = Field("{type_id}", alias="$type")')
        for prop_name, prop_schema in properties.items():
            field_type = self._type_expr(prop_schema)
            field_doc = prop_schema.get("description")
            py_name, alias = sanitize_field_name(prop_name)
            if prop_name in required:
                if alias:
                    lines.append(f'    {py_name}: {field_type} = Field(..., alias="{alias}")')
                else:
                    lines.append(f"    {py_name}: {field_type}")
            else:
                if alias:
                    lines.append(
                        f'    {py_name}: Optional[{field_type}] = Field(None, alias="{alias}")'
                    )
                else:
                    lines.append(f"    {py_name}: Optional[{field_type}] = None")
            if field_doc:
                # inline docstring after field — but Python doesn't really support per-field docstrings.
                # use a trailing comment to keep the source readable.
                lines[-1] += f"  # {field_doc[:80]}"
        lines.append("")
        self.body_lines.extend(lines)
        self.declared_classes.add(class_name)
        self.exports.append(class_name)

    def _emit_def(self, name: str, defn: dict[str, Any]):
        t = defn.get("type")
        if t == "record":
            record_obj = defn["record"]
            cls_name = "Main" if name == "main" else pascal(name)
            type_id = self.nsid if name == "main" else f"{self.nsid}#{name}"
            self._emit_class(cls_name, type_id, record_obj, defn.get("description", ""))
            if cls_name == "Main":
                self.body_lines.append("Record = Main\n")
                self.exports.append("Record")
        elif t == "object":
            cls_name = "Main" if name == "main" else pascal(name)
            type_id = self.nsid if name == "main" else f"{self.nsid}#{name}"
            self._emit_class(cls_name, type_id, defn, defn.get("description", ""))
        elif t == "query" or t == "procedure":
            # Skip XRPC method scaffolding for now: we issue these through DDSClient with
            # the underlying atproto.Client. Just expose a NSID constant.
            const_name = pascal(name).upper() if name == "main" else pascal(name).upper()
            self.body_lines.append(
                f'{("MAIN_NSID" if name == "main" else const_name + "_NSID")} = "{self.nsid}"\n'
            )
        elif t == "token":
            tok = "MAIN" if name == "main" else pascal(name).upper()
            self.body_lines.append(f'{tok} = "{self.nsid}"\n')
            self.exports.append(tok)
        else:
            # Unsupported (subscription, array-at-top, etc.) — skip with a note
            self.body_lines.append(f"# Skipped def {name!r} of unsupported type {t!r}\n")

    def _render(self) -> str:
        header = [
            '"""GENERATED CODE — DO NOT EDIT.',
            "",
            f"Source: lexicons/{self.nsid.replace('.', '/')}.json",
            'Regenerate with `python scripts/codegen.py`.',
            '"""',
            "from __future__ import annotations",
            "",
            "from typing import Any, Optional, Union",
            "",
            "from pydantic import BaseModel, ConfigDict, Field",
            "",
        ]
        for module, alias in sorted(self.imports.items(), key=lambda x: x[1]):
            header.append(f"from {module} import *  # noqa: F401,F403  -- runtime guard")
            # We want a namespaced alias, so additionally import the module itself
        # Replace the * import block with proper module imports
        header = header[: -len(self.imports)] if self.imports else header
        for module, alias in sorted(self.imports.items(), key=lambda x: x[1]):
            header.append(f"from {module.rsplit('.', 1)[0]} import {module.rsplit('.', 1)[1]} as {alias}")
        if self.imports:
            header.append("")
        if self.exports:
            export_list = ", ".join(f'"{e}"' for e in sorted(set(self.exports)))
            header.append(f"__all__ = [{export_list}]")
            header.append("")
        return "\n".join(header) + "\n" + "\n".join(self.body_lines).rstrip() + "\n"


STRONGREF_STUB = '''"""Stub for com.atproto.repo.strongRef.

The official lexicon ships with the atproto Python SDK, but our DDS-generated modules
import it as a local sibling. This file lets the generated tree be self-contained.
"""
from __future__ import annotations

from pydantic import BaseModel, ConfigDict


class Main(BaseModel):
    model_config = ConfigDict(extra="allow")
    uri: str
    cid: str


__all__ = ["Main"]
'''


def write_init_files():
    """Create __init__.py at every level of the generated tree."""
    for d in OUT_DIR.rglob("*"):
        if d.is_dir():
            init = d / "__init__.py"
            if not init.exists():
                init.write_text("")
    # also at OUT_DIR itself
    (OUT_DIR / "__init__.py").write_text("")


def main() -> int:
    if not LEXICON_ROOT.exists():
        print(f"No lexicon dir at {LEXICON_ROOT}", flush=True)
        return 1
    # Wipe & recreate OUT_DIR
    if OUT_DIR.exists():
        for p in sorted(OUT_DIR.rglob("*"), reverse=True):
            if p.is_file():
                p.unlink()
            elif p.is_dir():
                p.rmdir()
        OUT_DIR.rmdir()
    OUT_DIR.mkdir(parents=True)

    # com.atproto.repo.strongRef stub
    stub_path = OUT_DIR / "com" / "atproto" / "repo" / "strong_ref.py"
    stub_path.parent.mkdir(parents=True, exist_ok=True)
    stub_path.write_text(STRONGREF_STUB)

    lex_files = sorted(LEXICON_ROOT.rglob("*.json"))
    print(f"Generating {len(lex_files)} lexicons -> {OUT_DIR}")
    for path in lex_files:
        with path.open() as f:
            lex = json.load(f)
        emitter = ModuleEmitter(lex)
        code = emitter.emit()
        out_path = nsid_to_path(lex["id"])
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(code)

    write_init_files()
    print(f"Done. Generated tree at {OUT_DIR}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
