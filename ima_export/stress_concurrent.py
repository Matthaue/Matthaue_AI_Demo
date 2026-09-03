# -*- coding: utf-8 -*-
"""并发写压测：验证 SQLite 串行化写锁 + CORS 在高并发下是否稳定。

30 个并发 POST 同时写入。若 threading.Lock 失效，SQLite 会抛
"database is locked"；修复前有全局兜底会转成 500 JSON，修复前则是连接直接断开。
"""
import json
import urllib.request
import urllib.error
from concurrent.futures import ThreadPoolExecutor

BASE = "http://127.0.0.1:8000"
ORIGIN = "http://localhost:3000"   # 带跨域头，一并验证并发下的 CORS
N = 30


def post_one(i):
    payload = json.dumps({
        "type": "hero", "target": "jett",
        "text": "并发压测 %d：验证写锁与 CORS 稳定性" % i,
        "author": "压测", "user_id": "u_stress",
    }).encode("utf-8")
    req = urllib.request.Request(
        BASE + "/api/submissions",
        data=payload,
        headers={"Content-Type": "application/json", "Origin": ORIGIN},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            cors = r.headers.get("Access-Control-Allow-Origin")
            body = json.loads(r.read().decode("utf-8"))
            return {"ok": True, "code": r.status, "cors": cors, "id": body.get("item", {}).get("id")}
    except urllib.error.HTTPError as e:
        return {"ok": False, "code": e.code, "detail": e.read().decode("utf-8", "replace")[:200]}
    except Exception as e:
        return {"ok": False, "code": None, "detail": "%s: %s" % (type(e).__name__, e)}


def main():
    print("并发 %d 个 POST 写入（含跨域 Origin 头）..." % N)
    with ThreadPoolExecutor(max_workers=N) as ex:
        results = list(ex.map(post_one, range(N)))

    ok = [r for r in results if r["ok"]]
    bad = [r for r in results if not r["ok"]]
    cors_ok = [r for r in ok if r.get("cors") == "*"]

    print()
    print("  成功: %d/%d" % (len(ok), N))
    print("  成功响应中带 CORS 头: %d" % len(cors_ok))
    print("  唯一投稿 ID 数: %d（应等于成功数，验证无重复插入）" % len({r["id"] for r in ok}))
    if bad:
        print()
        print("  失败样本（前 3 条）:")
        for r in bad[:3]:
            print("    code=%s  %s" % (r["code"], r["detail"]))
    print()
    print("  结论: %s" % ("✓ 并发写安全，CORS 稳定" if len(ok) == N and len(cors_ok) == N
                          else "✗ 存在失败，见上"))


if __name__ == "__main__":
    main()
