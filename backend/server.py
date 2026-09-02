# -*- coding: utf-8 -*-
"""
Valorant「补位急救站」社群数据后端 —— 零依赖版
=================================================
只用 Python 标准库（http.server + sqlite3 + json），无需 pip install 任何包。

启动：
    python server.py                 # 默认 8000 端口
    python server.py --port 9000     # 指定端口
    python server.py --db 路径/valorant_community.db

启动后：
    浏览器打开 http://127.0.0.1:8000/          直接访问工作台（本服务顺带托管静态页面，
                                               避免 file:// 打开时的跨域限制）
    http://127.0.0.1:8000/api/health           健康检查

接口一览（全部返回 JSON）：
    GET    /api/health                    服务与数据库状态、各表行数
    GET    /api/submissions?user_id=xxx   投稿列表（含 comments 与我是否点过赞 liked）
    POST   /api/submissions               新建投稿
    POST   /api/submissions/<id>/like     点赞/取消赞（幂等，按 likes 明细表去重）
    POST   /api/submissions/<id>/comments 发表评论
    DELETE /api/submissions               清空全部投稿与互动数据
    GET    /api/content_docs?target=jett  攻略/教学链接（内容层，可按 target 过滤）
    GET    /api/export                    导出 ima 入库用的投稿包 JSON
    POST   /api/reset                     重置为初始演示数据（21 链接 + 4 投稿 + 3 评论 + 5 点赞）

设计说明（对应产品文档「ima vs NoSQL 分层决策」）：
    content_docs  = 内容层（低频、可缓存、未来可整体迁入 ima 知识库）
    submissions / likes / comments = 状态层（高频读写、强一致要求，必须独立落库）
    两层在代码里物理分离，各自可独立替换存储实现。
"""

import argparse
import json
import os
import sqlite3
import sys
import threading
import time
import traceback
import uuid
import webbrowser
from contextlib import contextmanager
from datetime import date
from html import escape as html_escape
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs, unquote

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

HERE = os.path.dirname(os.path.abspath(__file__))
# 数据库默认位于上级目录（项目根）；也允许与 server.py 同级
DEFAULT_DB = os.path.join(os.path.dirname(HERE), "valorant_community.db")
if not os.path.exists(DEFAULT_DB):
    DEFAULT_DB = os.path.join(HERE, "valorant_community.db")
# 前端页面目录（上级目录 = 项目根）
WEB_ROOT = os.path.dirname(HERE)

DB_PATH = DEFAULT_DB
PORT = 8000

_db_lock = threading.Lock()


@contextmanager
def db():
    """统一的数据库会话：单线程串行化 + 自动提交 + 确保关闭连接。

    用 threading.Lock 串行化写操作，避免 SQLite 并发写锁冲突；
    每个请求独立连接，天然规避 sqlite3 的 check_same_thread 限制。"""
    c = conn_db()
    try:
        with _db_lock:
            yield c
            c.commit()
    except Exception:
        c.rollback()
        raise
    finally:
        c.close()


# ============================ 数据库访问层 ============================

def conn_db():
    """每个请求独立连接，天然规避 sqlite 跨线程问题"""
    c = sqlite3.connect(DB_PATH, timeout=10)
    c.row_factory = sqlite3.Row
    c.execute("PRAGMA foreign_keys = ON")
    return c


def today():
    return date.today().isoformat()


def row_submission(c, row, user_id=None):
    """把 submissions 行组装成前端所需结构（含 comments 与 liked）"""
    d = dict(row)
    d["demo"] = bool(d.get("demo"))
    d["comments"] = [
        {"author": r["author"], "text": r["text"], "ts": r["ts"]}
        for r in c.execute(
            "SELECT author, text, ts FROM comments WHERE submission_id=? ORDER BY id",
            (d["id"],),
        )
    ]
    if user_id:
        hit = c.execute(
            "SELECT 1 FROM likes WHERE submission_id=? AND user_id=?", (d["id"], user_id)
        ).fetchone()
        d["liked"] = hit is not None
    else:
        d["liked"] = False
    return d


def list_submissions(user_id=None):
    with db() as c:
        rows = c.execute("SELECT * FROM submissions ORDER BY ts, id").fetchall()
        return [row_submission(c, r, user_id) for r in rows]


def new_sid():
    """生成投稿 ID：毫秒时间戳(hex) + uuid 随机段。

    原实现是「毫秒时间戳 + 1 位随机字母」，同毫秒并发时只有 26 种取值，
    30 并发实测出现 2 次 UNIQUE 冲突（生日悖论）。改用 uuid 段后碰撞概率可忽略。"""
    return "u" + format(int(time.time() * 1000), "x") + uuid.uuid4().hex[:8]


def create_submission(payload):
    # ID 冲突时重试：db() 在异常时会自动 rollback，重试安全
    last = None
    for _ in range(5):
        sid = new_sid()
        try:
            with db() as c:
                c.execute(
                    "INSERT INTO submissions (id, type, target, text, gif, video, author, user_id, ts,"
                    " likes, demo, source) VALUES (?,?,?,?,?,?,?,?,?,0,0,?)",
                    (
                        sid,
                        payload.get("type", "hero"),
                        payload.get("target", ""),
                        payload.get("text", ""),
                        payload.get("gif", "") or "",
                        payload.get("video", "") or "",
                        payload.get("author") or "匿名玩家",
                        payload.get("user_id") or "anonymous",
                        payload.get("ts") or today(),
                        payload.get("source") or "user",
                    ),
                )
                row = c.execute("SELECT * FROM submissions WHERE id=?", (sid,)).fetchone()
                return row_submission(c, row, payload.get("user_id"))
        except sqlite3.IntegrityError as e:
            last = e          # 极小概率撞 ID，换一个重试
            continue
    raise RuntimeError("生成投稿 ID 连续冲突: %s" % last)


def set_like(sub_id, user_id, liked):
    """幂等点赞：以 likes 明细表的 (submission_id,user_id) 唯一约束为准，
    计数只在真正发生变化时增减，避免重复点击导致计数漂移。"""
    with db() as c:
        row = c.execute("SELECT * FROM submissions WHERE id=?", (sub_id,)).fetchone()
        if not row:
            return None
        hit = c.execute(
            "SELECT 1 FROM likes WHERE submission_id=? AND user_id=?", (sub_id, user_id)
        ).fetchone()
        exists = hit is not None
        if liked and not exists:
            c.execute(
                "INSERT INTO likes (submission_id, user_id, ts) VALUES (?,?,?)",
                (sub_id, user_id, today()),
            )
            c.execute("UPDATE submissions SET likes = likes + 1 WHERE id=?", (sub_id,))
        elif (not liked) and exists:
            c.execute(
                "DELETE FROM likes WHERE submission_id=? AND user_id=?", (sub_id, user_id)
            )
            c.execute(
                "UPDATE submissions SET likes = CASE WHEN likes > 0 THEN likes - 1 ELSE 0 END"
                " WHERE id=?",
                (sub_id,),
            )
        new = c.execute("SELECT likes FROM submissions WHERE id=?", (sub_id,)).fetchone()[0]
        return {"likes": new, "liked": bool(liked)}


def add_comment(sub_id, author, text):
    with db() as c:
        row = c.execute("SELECT 1 FROM submissions WHERE id=?", (sub_id,)).fetchone()
        if not row:
            return None
        c.execute(
            "INSERT INTO comments (submission_id, author, text, ts) VALUES (?,?,?,?)",
            (sub_id, author, text, today()),
        )
        return {
            "comments": [
                {"author": r["author"], "text": r["text"], "ts": r["ts"]}
                for r in c.execute(
                    "SELECT author, text, ts FROM comments WHERE submission_id=? ORDER BY id",
                    (sub_id,),
                )
            ]
        }


def clear_submissions():
    with db() as c:
        c.execute("DELETE FROM likes")
        c.execute("DELETE FROM comments")
        c.execute("DELETE FROM submissions")
        return {"cleared": True}


def list_content_docs(target=None, doc_type=None):
    with db() as c:
        sql = "SELECT * FROM content_docs WHERE 1=1"
        args = []
        if target:
            sql += " AND target_id=?"
            args.append(target)
        if doc_type:
            sql += " AND doc_type=?"
            args.append(doc_type)
        sql += " ORDER BY id"
        return [dict(r) for r in c.execute(sql, args).fetchall()]


def export_pack():
    """导出与前端一致的 ima 入库投稿包"""
    with db() as c:
        rows = c.execute("SELECT * FROM submissions ORDER BY ts, id").fetchall()
        entries = []
        for r in rows:
            entries.append(
                {
                    "type": r["type"],
                    "target": r["target"],
                    "text": r["text"],
                    "gif": r["gif"] or "",
                    "video": r["video"] or "",
                    "source": r["source"] or "user",
                    "user_id": r["user_id"],
                    "author": r["author"],
                    "ts": r["ts"],
                    "likes": r["likes"],
                    "comments": [
                        {"author": x["author"], "text": x["text"], "ts": x["ts"]}
                        for x in c.execute(
                            "SELECT author, text, ts FROM comments WHERE submission_id=? ORDER BY id",
                            (r["id"],),
                        )
                    ],
                }
            )
        return {
            "kb": "valorantHeroKnow",
            "exported": today(),
            "note": "社群投稿包：每条含来源标注(source: official|user)与完整元数据(user_id/ts/likes/comments)。"
            "用户上传条目经人工审核后，按 ima 条目模板写入腾讯 ima 共享知识库 valorantHeroKnow；"
            "demo 数据入库前请剔除。本包由后端从 SQLite 直接导出。",
            "entries": entries,
        }


def rebuild_db(sql_path):
    """用建表脚本重建演示数据（21 链接 + 4 投稿 + 3 评论 + 5 点赞）

    注意：重建期间必须临时关闭外键约束——脚本是「先删父表 submissions 再删子表
    comments/likes」的顺序，开启外键时 DROP 父表会被子表引用阻断（IntegrityError）。"""
    with db() as c:
        c.execute("PRAGMA foreign_keys = OFF")
        try:
            c.executescript(open(sql_path, encoding="utf-8").read())
        finally:
            c.execute("PRAGMA foreign_keys = ON")
    return {"reset": True, "counts": db_stats()}


def db_stats():
    with db() as c:
        def n(t):
            return c.execute("SELECT COUNT(*) FROM " + t).fetchone()[0]
        return {
            "content_docs": n("content_docs"),
            "submissions": n("submissions"),
            "comments": n("comments"),
            "likes": n("likes"),
        }


# ============================ HTTP 服务 ============================

class Handler(SimpleHTTPRequestHandler):
    """API + 静态页面。继承 SimpleHTTPRequestHandler 复用静态文件能力。"""

    # ---------- 工具 ----------
    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        # 缓存预检结果 24h：否则每个 POST（非简单请求）都要先多一次 OPTIONS 往返
        self.send_header("Access-Control-Max-Age", "86400")

    def _json(self, obj, code=200):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self._cors()
        self.end_headers()
        self.wfile.write(body)

    # ---------- 健壮性：任何响应都必须带 CORS 头 ----------
    def send_response(self, code, message=None):
        # 标记响应已开始，供 handle_one_request 判断是否还能补发错误响应
        self._resp_started = True
        super().send_response(code, message)

    def send_error(self, code, message=None, explain=None):
        """重写，让 404 等错误响应也带 CORS 头。

        不能简单转发给基类——基类内部会自己走完 send_response + end_headers，
        没有插入自定义响应头的机会。跨域场景下缺 CORS 头会让浏览器报 CORS 错误，
        把真正的 404 掩盖掉，排查时极易误导。"""
        self._resp_started = True
        try:
            shortmsg, longmsg = self.responses[code]
        except KeyError:
            shortmsg, longmsg = "???", "???"
        msg = message or shortmsg
        exp = explain or longmsg
        body = (
            "<!DOCTYPE html><html lang='zh'><head><meta charset='utf-8'>"
            "<title>%(code)d %(msg)s</title></head><body>"
            "<h1>%(code)d %(msg)s</h1><p>%(exp)s</p></body></html>"
        ) % {
            "code": code,
            "msg": html_escape(str(msg)),
            "exp": html_escape(str(exp)),
        }
        body = body.encode("utf-8", "replace")
        self.send_response(code, msg)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self._cors()
        self.send_header("Connection", "close")
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(body)

    def handle_one_request(self):
        """全局异常兜底。

        未捕获异常会导致连接直接断开、不返回任何响应，前端 fetch 只能拿到
        'Failed to fetch'，用户会误判成网络/服务崩溃。这里统一转成带 CORS 头的
        JSON 500，让前端能拿到真实错误信息。"""
        self._resp_started = False
        try:
            super().handle_one_request()
        except (ConnectionResetError, BrokenPipeError, TimeoutError):
            self.close_connection = True          # 客户端已断开，无需响应
        except Exception as e:
            err = "%s: %s" % (type(e).__name__, e)
            sys.stdout.write("  [500] %s\n" % err)
            sys.stdout.write("  " + traceback.format_exc().replace("\n", "\n  ").rstrip() + "\n")
            if not self._resp_started:
                try:
                    self._json({"ok": False, "error": "服务端内部错误", "detail": err}, 500)
                except Exception:
                    pass
            self.close_connection = True

    def _body(self):
        length = int(self.headers.get("Content-Length") or 0)
        if not length:
            return {}
        try:
            raw = json.loads(self.rfile.read(length).decode("utf-8"))
        except Exception:
            return {}
        return raw if isinstance(raw, dict) else {}

    @staticmethod
    def _s(v, default="", maxlen=2000):
        """安全取字符串：非字符串输入一律降级为 default，绝不抛异常。

        直接从 JSON 取值后调 .strip() 是常见崩溃点——客户端传 {"text":{"a":1}}
        这类结构就会抛 AttributeError。所有用户输入都必须过这一层。"""
        if isinstance(v, str):
            return v.strip()[:maxlen]
        if isinstance(v, (int, float)) and not isinstance(v, bool):
            return str(v)[:maxlen]
        return default

    def log_message(self, fmt, *args):
        # 精简日志：只打印 API 调用
        msg = fmt % args
        if "/api/" in msg:
            sys.stdout.write("  " + msg + "\n")

    # ---------- 路由 ----------
    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    FAVICON = (
        "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'>"
        "<rect width='64' height='64' rx='13' fill='#FE4553'/>"
        "<path d='M13 15h12l7 24 7-24h12L36 49H27z' fill='#fff'/></svg>"
    ).encode("utf-8")

    def do_GET(self):
        u = urlparse(self.path)
        p, q = u.path, parse_qs(u.query)

        # 浏览器自动请求，不管会刷一条 404 日志，直接内联一个红 V 图标
        if p == "/favicon.ico":
            self.send_response(200)
            self.send_header("Content-Type", "image/svg+xml")
            self.send_header("Content-Length", str(len(self.FAVICON)))
            self._cors()
            self.end_headers()
            self.wfile.write(self.FAVICON)
            return

        if p == "/api/health":
            return self._json(
                {
                    "ok": True,
                    "service": "valorant-community-api",
                    "mode": "sqlite",
                    "db": os.path.basename(DB_PATH),
                    "db_path": DB_PATH,
                    "counts": db_stats(),
                }
            )

        if p == "/api/submissions":
            return self._json(
                {"ok": True, "items": list_submissions(q.get("user_id", [None])[0])}
            )

        if p == "/api/content_docs":
            return self._json(
                {
                    "ok": True,
                    "items": list_content_docs(
                        q.get("target", [None])[0], q.get("type", [None])[0]
                    ),
                }
            )

        if p == "/api/export":
            return self._json(export_pack())

        # 其余走静态文件（工作台 HTML / 截图等）
        return self._serve_static(p)

    def do_POST(self):
        p = urlparse(self.path).path
        b = self._body()
        S = self._s          # 所有用户输入都过这层，杜绝类型错误导致的 500

        if p == "/api/submissions":
            text = S(b.get("text"))
            if not text:
                return self._json({"ok": False, "error": "技巧内容必填"}, 400)
            if S(b.get("type"), "hero") not in ("hero", "map"):
                return self._json({"ok": False, "error": "type 只能是 hero 或 map"}, 400)
            item = create_submission(
                {
                    "type": S(b.get("type"), "hero", 16),
                    "target": S(b.get("target"), "", 64),
                    "text": text,
                    "gif": S(b.get("gif"), "", 500),
                    "video": S(b.get("video"), "", 500),
                    "author": S(b.get("author"), "匿名玩家", 32),
                    "user_id": S(b.get("user_id"), "anonymous", 64),
                    "source": S(b.get("source"), "user", 16),
                }
            )
            return self._json({"ok": True, "item": item})

        parts = p.strip("/").split("/")  # api / submissions / <id> / like|comments
        if len(parts) == 4 and parts[0] == "api" and parts[1] == "submissions":
            sid, action = parts[2], unquote(parts[3])
            if action == "like":
                r = set_like(sid, S(b.get("user_id"), "anonymous", 64), bool(b.get("liked", True)))
                if r is None:
                    return self._json({"ok": False, "error": "投稿不存在"}, 404)
                return self._json({"ok": True, **r})
            if action == "comments":
                ctext = S(b.get("text"))
                if not ctext:
                    return self._json({"ok": False, "error": "评论内容必填"}, 400)
                r = add_comment(sid, S(b.get("author"), "匿名玩家", 32), ctext)
                if r is None:
                    return self._json({"ok": False, "error": "投稿不存在"}, 404)
                return self._json({"ok": True, **r})

        if p == "/api/reset":
            sql = os.path.join(os.path.dirname(HERE), "valorant_community_db.sql")
            if not os.path.exists(sql):
                return self._json({"ok": False, "error": "找不到 valorant_community_db.sql"}, 400)
            return self._json({"ok": True, **rebuild_db(sql)})

        return self._json({"ok": False, "error": "not found: " + p}, 404)

    def do_DELETE(self):
        p = urlparse(self.path).path
        if p == "/api/submissions":
            return self._json({"ok": True, **clear_submissions()})
        return self._json({"ok": False, "error": "not found: " + p}, 404)

    # ---------- 静态文件 ----------
    def _serve_static(self, path):
        if path in ("/", ""):
            path = "/补位急救站_workbench.html"
        # 浏览器会把中文文件名做 URL 编码（%E8%A1%A5...），必须解码后才能命中磁盘文件，
        # 否则中文路径的资源（工作台 HTML、截图等）一律 404。
        safe = unquote(path.lstrip("/"))
        # 防目录穿越
        full = os.path.abspath(os.path.join(WEB_ROOT, safe))
        if not full.startswith(os.path.abspath(WEB_ROOT)) or not os.path.isfile(full):
            self.send_error(404, "not found")
            return
        ext = os.path.splitext(full)[1].lower()
        ctype = {
            ".html": "text/html; charset=utf-8",
            ".htm": "text/html; charset=utf-8",
            ".js": "application/javascript; charset=utf-8",
            ".css": "text/css; charset=utf-8",
            ".json": "application/json; charset=utf-8",
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".svg": "image/svg+xml",
            ".db": "application/octet-stream",
        }.get(ext, "application/octet-stream")
        with open(full, "rb") as f:
            data = f.read()
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self._cors()
        self.end_headers()
        self.wfile.write(data)


def main():
    global DB_PATH, PORT
    ap = argparse.ArgumentParser(description="补位急救站社群数据后端（零依赖）")
    ap.add_argument("--port", type=int, default=8000)
    ap.add_argument("--db", default=DEFAULT_DB)
    ap.add_argument("--no-browser", action="store_true", help="启动后不自动打开浏览器")
    args = ap.parse_args()

    DB_PATH = os.path.abspath(args.db)
    PORT = args.port

    if not os.path.exists(DB_PATH):
        print("× 找不到数据库文件：", DB_PATH)
        print("  请先运行 init_db.py 生成 valorant_community.db")
        sys.exit(1)

    print("=" * 62)
    print("  Valorant 补位急救站 · 社群数据后端（零依赖 / 标准库）")
    print("=" * 62)
    print("  数据库：", DB_PATH)
    print("  各表行数：", db_stats())
    print("  服务地址： http://127.0.0.1:%d/" % PORT)
    print("  接口示例： http://127.0.0.1:%d/api/health" % PORT)
    print("  停止服务： Ctrl + C")
    print("=" * 62)

    if not args.no_browser:
        try:
            webbrowser.open("http://127.0.0.1:%d/" % PORT)
        except Exception:
            pass

    ThreadingHTTPServer.allow_reuse_address = True
    srv = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print("\n已停止")
        srv.server_close()


if __name__ == "__main__":
    main()
