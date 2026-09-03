#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
提交前密钥扫描（供 .githooks/pre-commit 调用）

设计要点：
1. 只扫描「本次暂存区新增/修改的行」——不扫历史、不扫未暂存内容。
   因此速度快，也不会因为仓库里遗留的历史问题而阻断日常提交。
2. 命中即退出码 1，git 会中止本次提交。
3. 误报处理：在 .githooks/secrets-allowlist.txt 加路径，或在代码行尾加 `# nosecret`。
4. 紧急绕过：git commit --no-verify（仅限确知安全的场景）
"""

import fnmatch
import io
import os
import re
import subprocess
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

# ---------- 明确密钥特征：命中即高危 ----------
PATTERNS = [
    ("腾讯云 SecretId",      r"AKID-?[A-Za-z0-9_\-]{20,}"),
    ("OpenAI API Key",       r"\bsk-[A-Za-z0-9\-_]{20,}\b"),
    ("GitHub Token",         r"\bgh[pousr]_[A-Za-z0-9]{20,}\b|\bgithub_pat_[A-Za-z0-9_]{20,}\b"),
    ("Google / Gemini Key",  r"\bAIza[A-Za-z0-9\-_]{30,}\b"),
    ("Slack Token",          r"\bxox[baprs]-[A-Za-z0-9\-]{10,}"),
    ("AWS Access Key",       r"\bAKIA[0-9A-Z]{16}\b"),
    ("JWT",                  r"\beyJ[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}"),
    ("私钥内容",              r"-----BEGIN [A-Z ]*PRIVATE KEY-----"),
    ("数据库/Redis 连接串",    r"(?:mongodb|mysql|postgres|redis)(?:\+srv)?://[^\s\"':]+:[^\s\"'@]+@"),
    ("Bearer 令牌",           r"(?i)\bbearer\s+[A-Za-z0-9\-_\.]{25,}"),
]

# ---------- 赋值型：key = "长串值" ----------
ASSIGN = re.compile(
    r"(?i)(api[_-]?key|apikey|secret[_-]?key|secret[_-]?id|access[_-]?token|auth[_-]?token|"
    r"password|passwd|pwd|secret|credential|private[_-]?key)\s*[\"']?\s*[:=]\s*[\"']([^\"'\s]{16,})[\"']"
)

# 命中但只是代码标识符/参数名，视为噪声
NOISE = re.compile(
    r"(?i)^\s*(str|int|bool|float|None|null|true|false|len\(|self\.|c\[|creds?\[|conf\[|config\[|"
    r"os\.environ|os\.getenv|process\.env|localStorage|getElementById|input\()"
)

# ---------- 可疑文件名：内容即使没命中模式也应拦下 ----------
SUSPICIOUS_PATH = [
    r"(^|/)\.env(\.|$)",
    r"(^|/)creds?/",
    r"(^|/)secrets?/",
    r"credential",
    r"\.(pem|key|p12|pfx|keystore|jks)$",
    r"(^|/)id_(rsa|dsa|ecdsa|ed25519)$",
    r"(^|/)\.npmrc$",
    r"(^|/)\.aws/credentials$",
    r"(^|/)\.git-credentials$",
]

ALLOWLIST_FILE = ".githooks/secrets-allowlist.txt"
INLINE_SKIP = re.compile(r"#\s*nosecret\b")


def mask(v, keep=8):
    v = v.strip()
    return (v[:keep] + "…(len=%d)" % len(v)) if len(v) > keep else v


def git(*args, root=None):
    return subprocess.run(["git"] + list(args), cwd=root, capture_output=True)


def get_root():
    r = git("rev-parse", "--show-toplevel")
    return r.stdout.decode("utf-8", "replace").strip() if r.returncode == 0 else os.getcwd()


def load_allowlist(root):
    path = os.path.join(root, ALLOWLIST_FILE)
    rules = []
    if os.path.isfile(path):
        for line in open(path, "r", encoding="utf-8", errors="ignore"):
            line = line.strip()
            if line and not line.startswith("#"):
                rules.append(line)
    return rules


def is_allowlisted(path, rules):
    norm = path.replace("\\", "/")
    return any(fnmatch.fnmatch(norm, r.replace("\\", "/")) for r in rules)


def iter_added_lines(root):
    """解析暂存区 diff，产出 (文件路径, 行号, 新增内容)"""
    out = git("diff", "--cached", "--unified=0", "--diff-filter=ACM", root=root)
    text = out.stdout.decode("utf-8", "replace")
    path, lineno = None, 0
    for line in text.split("\n"):
        if line.startswith("+++ "):
            p = line[4:].strip()
            p = p[2:] if p.startswith("b/") else p
            path = None if p == "/dev/null" else p
            continue
        m = re.match(r"^@@ -\S+ \+(\d+)(?:,\d+)? @@", line)
        if m:
            lineno = int(m.group(1))
            continue
        if path and line.startswith("+") and not line.startswith("+++"):
            yield path, lineno, line[1:]
            lineno += 1


def main():
    root = get_root()
    allow = load_allowlist(root)

    findings = {}   # path -> [(lineno, label, value)]
    path_hits = {}  # path -> [原因]

    # 1) 可疑文件名
    added = git("diff", "--cached", "--name-only", "--diff-filter=AC", root=root)
    for p in added.stdout.decode("utf-8", "replace").split("\n"):
        p = p.strip()
        if not p or is_allowlisted(p, allow):
            continue
        norm = p.replace("\\", "/")
        for pat in SUSPICIOUS_PATH:
            if re.search(pat, norm):
                path_hits.setdefault(p, []).append("文件名可疑（匹配 /%s/）" % pat)
                break

    # 2) 新增行内容
    for path, lineno, content in iter_added_lines(root):
        if path is None or is_allowlisted(path, allow) or INLINE_SKIP.search(content):
            continue
        if len(content) > 4000:      # 超长行（base64 图片等）只扫前段
            content = content[:4000]

        for label, pat in PATTERNS:
            m = re.search(pat, content)
            if m:
                findings.setdefault(path, []).append((lineno, label, mask(m.group(0))))
                break
        else:
            m = ASSIGN.search(content)
            if m and not NOISE.match(m.group(2)):
                findings.setdefault(path, []).append(
                    (lineno, "赋值型密钥", "%s = %s" % (m.group(1), mask(m.group(2))))
                )

    total = sum(len(v) for v in findings.values()) + len(path_hits)
    if total == 0:
        print("✅ 密钥扫描通过，未发现敏感信息")
        return 0

    print("⛔ 提交被拦截：检测到疑似密钥/敏感文件\n")
    for p, reasons in sorted(path_hits.items()):
        print("  📄 %s" % p)
        for r in reasons:
            print("      [文件] %s" % r)
    for p, items in sorted(findings.items()):
        print("  📄 %s" % p)
        for lineno, label, val in items[:10]:
            print("      L%-5d [%s] %s" % (lineno, label, val))
        if len(items) > 10:
            print("      ... 另有 %d 处" % (len(items) - 10))
    print("\n  共 %d 处。处理方式：" % total)
    print("  · 确认为误报 → 在 %s 加一行路径，或在该行末尾加 # nosecret" % ALLOWLIST_FILE)
    print("  · 确实是密钥 → 改为从环境变量 / .env 读取，不要写进代码")
    print("  · 紧急绕过   → git commit --no-verify")
    return 1


if __name__ == "__main__":
    sys.exit(main())
