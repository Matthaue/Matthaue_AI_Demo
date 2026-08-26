# -*- coding: utf-8 -*-
"""从 hero_content_library.json 生成 ima 入库用的 markdown 条目（每英雄/每地图一条）"""
import json
import os

SRC = r'C:\Users\11278\WorkBuddy\2026-08-25-14-34-43\hero_content_library.json'
OUT = r'C:\Users\11278\WorkBuddy\2026-08-25-14-34-43\ima_export'

with open(SRC, encoding='utf-8') as f:
    lib = json.load(f)

meta = lib['meta']
os.makedirs(OUT, exist_ok=True)

# ---------- README ----------
readme = (
    "# valorantHeroKnow — 无畏契约补位急救内容库\n\n"
    "本知识库是「补位急救站」（WeGame Agent 个人 AI 作品 Demo）的内容源，供产品侧经 ima OpenAPI 检索。\n\n"
    "## 库结构\n"
    "- **英雄条目**（规划 10 个，当前 3 个）：每个英雄一个条目，含定位、Q/C/E/X 技能速记、速记提示、教学视频链接\n"
    "- **地图条目**（7 张图）：每张图一个条目，含特点一句话、本图速记提示、攻略视频链接\n"
    "- **社群投稿**：玩家在工作台提交的技巧，经人工审核后追加入库（条目名带「社群投稿」前缀）\n\n"
    "## 使用方式\n"
    "产品端通过 ima OpenAPI 检索：识别到英雄「捷风」+ 地图「亚海悬城」时，检索对应两个条目组装 30 秒速记卡。\n\n"
    "## 数据状态\n"
    f"- 版本：{meta['patch']}\n"
    "- 更新日期：2026-08-25\n"
    "- 注意：技能数值与译名为草稿，需对照官方 Wiki（valorant.fandom.com）校对后定稿\n"
)
with open(os.path.join(OUT, 'README_内容库说明.md'), 'w', encoding='utf-8') as f:
    f.write(readme)

# ---------- 英雄条目 ----------
for h in lib['heroes']:
    lines = [
        f"# {h['name_cn']} {h['name_en']} — {h['role']}",
        "",
        f"> {h['one_liner']}",
        "",
        "## 技能速记（加载界面 30 秒版）",
        "",
        "| 键位 | 技能 | 消耗 | 一句话说明 |",
        "|---|---|---|---|",
    ]
    for key in ['Q', 'C', 'E', 'X']:
        s = h['skills'][key]
        lines.append(f"| {key} | {s['name']} | {s['cost']} | {s['desc']} |")
    lines += ["", "## 速记提示"]
    for i, t in enumerate(h['quick_tips'], 1):
        lines.append(f"{i}. {t}")
    lines += ["", "## 教学视频"]
    for v in h['videos']:
        lines.append(f"- [{v['title']}]({v['url']})")
    lines += ["", "## 内容来源", h['source'], ""]
    lines.append(f"---")
    lines.append(f"条目类型：英雄 | ID: {h['id']} | 版本: {meta['patch']} | 更新: 2026-08-25")
    fn = f"英雄_{h['name_cn']}_{h['name_en']}.md"
    with open(os.path.join(OUT, fn), 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))

# ---------- 地图条目 ----------
for m in lib['maps']:
    lines = [
        f"# {m['name_cn']} {m['name_en']} — 地图速记",
        "",
        f"> {m['one_liner']}",
        "",
        "## 本图速记提示",
    ]
    for i, t in enumerate(m['tips'], 1):
        lines.append(f"{i}. {t['text']}")
    lines += ["", "## 攻略视频"]
    for v in m['videos']:
        lines.append(f"- [{v['title']}]({v['url']})")
    lines += ["", "---"]
    lines.append(f"条目类型：地图 | ID: {m['id']} | 更新: 2026-08-25")
    fn = f"地图_{m['name_cn']}_{m['name_en']}.md"
    with open(os.path.join(OUT, fn), 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))

for fn in sorted(os.listdir(OUT)):
    p = os.path.join(OUT, fn)
    print(f"{os.path.getsize(p)}\t{fn}")
