# -*- coding: utf-8 -*-
"""打包交付物：以 _git_stage 仓库为唯一源，保证 GitHub / 压缩包 / 本地三处一致。

用法：python pack_deliverable.py
"""
import os
import zipfile

ROOT = r"C:\Users\11278\WorkBuddy\2026-08-25-14-34-43"
STAGE = os.path.join(ROOT, "_git_stage", "Matthaue-AI-test")
OUT = r"C:\Users\11278\Desktop\马楷承ai个人作品.zip"
TOP = "马楷承ai个人作品"

README = """马楷承 AI 个人作品 — Valorant「补位急救站」
================================================
【怎么开始看】
1. 双击 补位急救站_workbench.html —— 工作台 Demo，无需安装
2. 播放 ai_demo.mp4 —— 2 分钟操作演示
3. 阅读 WeGame_Agent_产品文档.html —— 完整产品文档（含 ER 图 / 面试话术 / 架构决策）

【想体验"多人共享同一份数据"？】
双击 backend/start_server.bat，浏览器会自动打开：
  → 社群投稿页 → 数据源切到「后端数据库 SQLite」→ 测试连接
之后所有投稿/点赞/评论都读写 valorant_community.db（真正的 SQLite 数据库）。
只需 Python 标准库，不用装任何包。

【目录结构】
  补位急救站_workbench.html    工作台 Demo（可切本机 / 后端两种数据源）
  ai_demo.mp4                  2 分钟演示视频
  WeGame_Agent_产品文档.*       产品文档（md + html，含 ER 图 / 面试话术）
  overview_第六轮_投稿闭环验证.md   投稿→入库闭环验证记录
  overview_第七轮_数据库与ER图.md   数据库接入与数据模型设计记录
  overview_第八轮_CORS与健壮性.md   后端 CORS 与健壮性检查记录（含面试话术）
  backend/                     社群数据后端（零依赖 Python）
    ├─ server.py               REST API 服务（仅用标准库）
    ├─ init_db.py              从 SQL 生成成品数据库
    ├─ start_server.bat        双击启动
    └─ README.md               接口文档 + CORS / 错误处理说明
  valorant_community.db        成品 SQLite 数据库（4 表 2 视图）
  valorant_community_db.sql    建表迁移脚本
  hero_content_library.json    内容库数据（7 英雄 + 7 地图）
  screenshots/                 界面截图 + 数据模型图（含 ER 图 SVG）
  ima知识库内容/                腾讯 ima 知识库 17 条内容 + 管线脚本 + 实测截图

【数据库怎么打开】
valorant_community.db 用 DB Browser for SQLite（免费）或 VS Code + SQLite 扩展直接打开。

【ER 图】
screenshots/er_diagram.svg 是数据模型 ER 图（自包含 SVG，离线可看，可拖进 PPT）。
WeGame_Agent_产品文档.html 已内联渲染该图。

【说明】已排除 COS 上传凭证目录（含密钥，敏感）与 Python 缓存文件。
"""


def main():
    if os.path.exists(OUT):
        os.remove(OUT)

    with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as z:
        z.writestr(TOP + "/README.txt", README)
        for dp, dns, fns in os.walk(STAGE):
            dns[:] = [d for d in dns if d not in (".git", "__pycache__")]
            for f in sorted(fns):
                if f == ".gitignore" or f.endswith((".pyc", ".log")):
                    continue
                full = os.path.join(dp, f)
                z.write(full, TOP + "/" + os.path.relpath(full, STAGE).replace(os.sep, "/"))

    with zipfile.ZipFile(OUT) as z:
        names = z.namelist()
        total = sum(i.file_size for i in z.infolist())
        bad = z.testzip()

    print("压缩包:", OUT)
    print("  文件数: %d  解压后: %.1f MB  压缩包: %.1f MB  完整性: %s"
          % (len(names), total / 1024 / 1024, os.path.getsize(OUT) / 1024 / 1024, bad or "完好"))
    print()
    print("  关键文件在内?")
    for k in ["backend/server.py", "backend/README.md", "screenshots/er_diagram.svg",
              "ai_demo.mp4", "补位急救站_workbench.html"]:
        print("    %s %s" % ("[OK]" if any(n.endswith(k) for n in names) else "[NG]", k))


if __name__ == "__main__":
    main()
