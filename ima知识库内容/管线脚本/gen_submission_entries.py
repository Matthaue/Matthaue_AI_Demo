# -*- coding: utf-8 -*-
"""把工作台导出的投稿包 JSON 转换为 ima 入库条目（Markdown，含来源标注 + 元数据）。

用法:
    python gen_submission_entries.py community_tips_pack.json [输出目录]

输入 JSON 结构（工作台「导出投稿包」产出）:
    { "kb": "valorantHeroKnow", "entries": [ {type,target,text,gif,video,
        source: "user"|"official", user_id, author, ts, likes, comments:[{author,text,ts}] } ] }

输出: 输出目录下每投稿一个 .md 文件，文件名带「社群投稿」前缀，可直接经
create_media → COS 上传 → add_knowledge 写入 ima。
"""
import json
import os
import sys

HERO_NAMES = {"jett": "捷风 Jett", "sage": "贤者 Sage", "reyna": "蕾娜 Reyna",
              "skye": "斯凯 Skye", "fade": "黑梦 Fade", "sova": "猎枭 Sova", "kayo": "KAY/O"}
MAP_NAMES = {"ascent": "亚海悬城 Ascent", "haven": "隐世修所 Haven", "split": "霓虹町 Split",
             "icebox": "森寒冬港 Icebox", "breeze": "微风岛屿 Breeze", "lotus": "莲华古城 Lotus",
             "pearl": "深海明珠 Pearl"}


def target_name(typ, tid):
    table = HERO_NAMES if typ == "hero" else MAP_NAMES
    return table.get(tid, tid)


def build_entry(t):
    typ = t.get("type", "hero")
    tid = t.get("target", "")
    tname = target_name(typ, tid)
    source = t.get("source", "user")
    src_label = "官网整理" if source == "official" else "用户上传"
    lines = []
    lines.append(f"# 社群投稿 · {'英雄' if typ == 'hero' else '地图'}技巧 · {tname}")
    lines.append("")
    lines.append(f"> 本条为玩家投稿（{src_label}），已经人工审核后入库。内容非官方来源，仅供参考。" if source == "user"
                 else "> 本条为官方整理内容，来源可追溯至官方 Wiki / 官方教学。")
    lines.append("")
    lines.append("## 技巧内容")
    lines.append("")
    lines.append(t.get("text", ""))
    lines.append("")
    lines.append("## 关联对象")
    lines.append("")
    lines.append(f"- 类型：{'英雄' if typ == 'hero' else '地图'}（{typ}）")
    lines.append(f"- 目标：{tname}（id: {tid}）")
    lines.append("")
    lines.append("## 来源与元数据")
    lines.append("")
    lines.append("| 字段 | 值 |")
    lines.append("|---|---|")
    lines.append(f"| 来源标注 | {src_label}（source: {source}） |")
    if source == "user":
        lines.append(f"| 用户ID | {t.get('user_id', '')} |")
    lines.append(f"| 投稿时间 | {t.get('ts', '')} |")
    if source == "user":
        lines.append(f"| 点赞数 | {t.get('likes', 0)} |")
        lines.append(f"| 评论数 | {len(t.get('comments', []))} |")
    if t.get("author"):
        lines.append(f"| 署名 | {t.get('author', '')} |")
    lines.append("")
    comments = t.get("comments", [])
    if source == "user" and comments:
        lines.append("## 评论")
        lines.append("")
        for c in comments:
            lines.append(f"- {c.get('author', '匿名')}：{c.get('text', '')}（{c.get('ts', '')}）")
        lines.append("")
    links = []
    if t.get("gif"):
        links.append(f"- 动图：{t['gif']}")
    if t.get("video"):
        links.append(f"- 视频：{t['video']}")
    if links:
        lines.append("## 附加链接")
        lines.append("")
        lines.extend(links)
        lines.append("")
    lines.append("---")
    lines.append(f"条目类型：社群投稿 | 来源：{src_label} | 审核状态：已入库 | 更新：{t.get('ts', '')}")
    return "\n".join(lines)


def main():
    pack_path = sys.argv[1]
    out_dir = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(pack_path), "ima_submissions")
    os.makedirs(out_dir, exist_ok=True)
    with open(pack_path, encoding="utf-8") as f:
        pack = json.load(f)
    entries = pack["entries"] if isinstance(pack, dict) else pack
    skip = 0
    for i, t in enumerate(entries):
        if t.get("demo"):
            skip += 1
            continue  # 示例数据不入库
        fn = f"社群投稿_{'英雄' if t.get('type') == 'hero' else '地图'}_{target_name(t.get('type', ''), t.get('target', ''))}_{t.get('ts', '')}.md"
        with open(os.path.join(out_dir, fn), "w", encoding="utf-8") as f:
            f.write(build_entry(t))
        print(f"{fn}\t{os.path.getsize(os.path.join(out_dir, fn))}B")
    print(f"done: {len(entries) - skip} 条生成，{skip} 条示例已跳过")


if __name__ == "__main__":
    main()
