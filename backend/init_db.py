# -*- coding: utf-8 -*-
"""
从 valorant_community_db.sql 生成成品数据库 valorant_community.db

用法：
    python init_db.py              # 生成/重建数据库
    python init_db.py --force      # 已存在时强制覆盖重建

说明：
    · 数据库是"成品库"：表结构 + 数据 + 视图全部落库，可用 DB Browser for SQLite
      或 VS Code SQLite 扩展直接打开查看。
    · 若 valorant_community.db 已存在且未带 --force，脚本会提示保留并直接退出。
"""

import argparse
import os
import sqlite3
import sys

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SQL_PATH = os.path.join(ROOT, "valorant_community_db.sql")
DB_PATH = os.path.join(ROOT, "valorant_community.db")

# 便捷视图：中文列名，方便直接打开查看 / 面试演示
VIEWS = """
DROP VIEW IF EXISTS v_submission_stats;
CREATE VIEW v_submission_stats AS
SELECT
  s.id      AS 投稿ID,
  s.type    AS 类型,
  s.target  AS 对象id,
  s.author  AS 署名,
  s.user_id AS 用户ID,
  s.ts      AS 投稿时间,
  s.likes   AS 点赞计数,
  (SELECT COUNT(*) FROM likes    l WHERE l.submission_id = s.id) AS 点赞明细数,
  (SELECT COUNT(*) FROM comments c WHERE c.submission_id = s.id) AS 评论数,
  s.demo    AS 是否示例,
  s.source  AS 来源标注,
  s.text    AS 投稿内容
FROM submissions s;

DROP VIEW IF EXISTS v_content_docs;
CREATE VIEW v_content_docs AS
SELECT id, target_id AS 对象id, doc_type AS 类型, title AS 标题, url AS 链接, source AS 来源
FROM content_docs;
"""


def build(force=False):
    if not os.path.exists(SQL_PATH):
        print("× 找不到 SQL 脚本：", SQL_PATH)
        return 1

    if os.path.exists(DB_PATH) and not force:
        print("✓ 数据库已存在：", DB_PATH)
        print("  如需重建（会覆盖当前数据），请加 --force 参数。")
        return 0

    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)

    sql = open(SQL_PATH, encoding="utf-8").read()
    conn = sqlite3.connect(DB_PATH)
    conn.executescript(sql)
    conn.executescript(VIEWS)
    conn.commit()

    cur = conn.cursor()
    print("=" * 56)
    print("  数据库生成成功：", DB_PATH)
    print("=" * 56)
    for t in ("content_docs", "submissions", "comments", "likes"):
        print("  %-14s %d 行" % (t, cur.execute("SELECT COUNT(*) FROM " + t).fetchone()[0]))
    print("  视图：v_submission_stats / v_content_docs")
    print("=" * 56)
    conn.close()
    return 0


def main():
    ap = argparse.ArgumentParser(description="生成 valorant_community.db")
    ap.add_argument("--force", action="store_true", help="已存在时强制重建")
    args = ap.parse_args()
    raise SystemExit(build(args.force))


if __name__ == "__main__":
    main()
