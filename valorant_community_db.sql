-- =====================================================================
-- Valorant「补位急救站」社群数据库（参考实现）
-- 生成日期：2026-08-30
-- 数据来源：
--   内容层 content_docs  <- hero_content_library.json（7 英雄 + 7 地图的攻略/教学链接，source: official）
--   状态层 submissions  <- 工作台 localStorage 3 条示例投稿 + e2e 实测 1 条真实投稿（e2e_pack.json）
--   状态层 comments     <- 投稿附带的评论（author/text/ts）
--   状态层 likes        <- 点赞行为明细（演示数据；likes 计数字段来自投稿元数据）
-- 对应产品文档「ima vs NoSQL 分层决策」：本文件演示 V1 自建库阶段的内容/状态分层落库方案
-- 语法兼容：SQLite（可用 sqlite3 直接执行）；MySQL 仅需将 AUTOINCREMENT 改为 AUTO_INCREMENT
-- =====================================================================

PRAGMA foreign_keys = ON;

-- 建表前统一清理（子表优先，避免外键约束阻断 DROP，保证本脚本可重复执行）
DROP VIEW  IF EXISTS v_submission_stats;
DROP VIEW  IF EXISTS v_content_docs;
DROP TABLE IF EXISTS likes;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS submissions;
DROP TABLE IF EXISTS content_docs;

-- ------------------------------------------------------------
-- 表1 内容层：攻略文档链接（对应 ima 知识库的 21 条官方内容引用）
-- ------------------------------------------------------------
CREATE TABLE content_docs (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  doc_type   TEXT NOT NULL CHECK (doc_type IN ('hero','map')),   -- 内容类型：英雄攻略 | 地图攻略
  target_id  TEXT NOT NULL,                                      -- 关联对象 id（jett / ascent …，与内容库 JSON 一致）
  title      TEXT NOT NULL,                                      -- 链接标题
  url        TEXT NOT NULL,                                      -- 攻略/教学链接（B站 或 官方 Wiki）
  source     TEXT NOT NULL DEFAULT 'official'                    -- 来源标注：official（官网整理）
);
CREATE INDEX idx_docs_target ON content_docs(target_id);

INSERT INTO content_docs (doc_type, target_id, title, url, source) VALUES
  ('hero', 'jett', '捷风 入门教学（B站搜索）', 'https://search.bilibili.com/all?keyword=%E6%97%A0%E7%95%8F%E5%A5%91%E7%BA%A6%20%E6%8D%B7%E9%A3%8E%20%E6%95%99%E5%AD%A6', 'official'),
  ('hero', 'jett', 'Jett 官方Wiki（技能数值）', 'https://valorant.fandom.com/wiki/Jett', 'official'),
  ('hero', 'sage', '贤者 入门教学（B站搜索）', 'https://search.bilibili.com/all?keyword=%E6%97%A0%E7%95%8F%E5%A5%91%E7%BA%A6%20%E8%B4%A4%E8%80%85%20%E6%95%99%E5%AD%A6', 'official'),
  ('hero', 'sage', 'Sage 官方Wiki（技能数值）', 'https://valorant.fandom.com/wiki/Sage', 'official'),
  ('hero', 'reyna', '蕾娜 入门教学（B站搜索）', 'https://search.bilibili.com/all?keyword=%E6%97%A0%E7%95%8F%E5%A5%91%E7%BA%A6%20%E8%95%BE%E5%A8%9C%20%E6%95%99%E5%AD%A6', 'official'),
  ('hero', 'reyna', 'Reyna 官方Wiki（技能数值）', 'https://valorant.fandom.com/wiki/Reyna', 'official'),
  ('hero', 'skye', '斯凯 入门教学（B站搜索）', 'https://search.bilibili.com/all?keyword=%E6%97%A0%E7%95%8F%E5%A5%91%E7%BA%A6%20%E6%96%AF%E5%87%AF%20%E6%95%99%E5%AD%A6', 'official'),
  ('hero', 'skye', 'Skye 官方Wiki（技能数值）', 'https://valorant.fandom.com/wiki/Skye', 'official'),
  ('hero', 'fade', '黑梦 入门教学（B站搜索）', 'https://search.bilibili.com/all?keyword=%E6%97%A0%E7%95%8F%E5%A5%91%E7%BA%A6%20%E9%BB%91%E6%A2%A6%20%E6%95%99%E5%AD%A6', 'official'),
  ('hero', 'fade', 'Fade 官方Wiki（技能数值）', 'https://valorant.fandom.com/wiki/Fade', 'official'),
  ('hero', 'sova', '猎枭 入门教学（B站搜索）', 'https://search.bilibili.com/all?keyword=%E6%97%A0%E7%95%8F%E5%A5%91%E7%BA%A6%20%E7%8C%8E%E6%9E%AD%20%E6%95%99%E5%AD%A6', 'official'),
  ('hero', 'sova', 'Sova 官方Wiki（技能数值）', 'https://valorant.fandom.com/wiki/Sova', 'official'),
  ('hero', 'kayo', 'KAY/O 入门教学（B站搜索）', 'https://search.bilibili.com/all?keyword=%E6%97%A0%E7%95%8F%E5%A5%91%E7%BA%A6%20KAY%2FO%20%E6%95%99%E5%AD%A6', 'official'),
  ('hero', 'kayo', 'KAY/O 官方Wiki（技能数值）', 'https://valorant.fandom.com/wiki/KAY/O', 'official'),
  ('map', 'ascent', '亚海悬城 攻略（B站搜索）', 'https://search.bilibili.com/all?keyword=%E6%97%A0%E7%95%8F%E5%A5%91%E7%BA%A6%20%E4%BA%9A%E6%B5%B7%E6%82%AC%E5%9F%8E%20%E6%94%BB%E7%95%A5', 'official'),
  ('map', 'haven', '隐世修所 攻略（B站搜索）', 'https://search.bilibili.com/all?keyword=%E6%97%A0%E7%95%8F%E5%A5%91%E7%BA%A6%20%E9%9A%90%E4%B8%96%E4%BF%AE%E6%89%80%20%E6%94%BB%E7%95%A5', 'official'),
  ('map', 'split', '霓虹町 攻略（B站搜索）', 'https://search.bilibili.com/all?keyword=%E6%97%A0%E7%95%8F%E5%A5%91%E7%BA%A6%20%E9%9C%93%E8%99%B9%E7%94%BA%20%E6%94%BB%E7%95%A5', 'official'),
  ('map', 'icebox', '森寒冬港 攻略（B站搜索）', 'https://search.bilibili.com/all?keyword=%E6%97%A0%E7%95%8F%E5%A5%91%E7%BA%A6%20%E6%A3%AE%E6%9E%97%E5%86%AC%E6%B8%AF%20%E6%94%BB%E7%95%A5', 'official'),
  ('map', 'breeze', '微风岛屿 攻略（B站搜索）', 'https://search.bilibili.com/all?keyword=%E6%97%A0%E7%95%8F%E5%A5%91%E7%BA%A6%20%E5%BE%AE%E9%A3%8E%E5%B2%9B%E5%B1%BF%20%E6%94%BB%E7%95%A5', 'official'),
  ('map', 'lotus', '莲华古城 攻略（B站搜索）', 'https://search.bilibili.com/all?keyword=%E6%97%A0%E7%95%8F%E5%A5%91%E7%BA%A6%20%E8%8E%B2%E5%8D%8E%E5%8F%A4%E5%9F%8E%20%E6%94%BB%E7%95%A5', 'official'),
  ('map', 'pearl', '深海明珠 攻略（B站搜索）', 'https://search.bilibili.com/all?keyword=%E6%97%A0%E7%95%8F%E5%A5%91%E7%BA%A6%20%E6%B7%B1%E6%B5%B7%E6%98%8E%E7%8F%A0%20%E6%94%BB%E7%95%A5', 'official');

-- ------------------------------------------------------------
-- 表2 状态层：社群投稿（点赞计数在 likes 字段，明细见 likes 表）
-- ------------------------------------------------------------
CREATE TABLE submissions (
  id       TEXT PRIMARY KEY,            -- 投稿ID（demo-* 为示例；真实投稿为 u+时间戳）
  type     TEXT NOT NULL CHECK (type IN ('hero','map')),
  target   TEXT NOT NULL,               -- 目标英雄/地图 id
  text     TEXT NOT NULL,               -- 一句话技巧正文
  gif      TEXT DEFAULT '',
  video    TEXT DEFAULT '',
  author   TEXT NOT NULL,               -- 显示署名
  user_id  TEXT NOT NULL,               -- 投稿用户ID
  ts       TEXT NOT NULL,               -- 投稿时间
  likes    INTEGER DEFAULT 0,           -- 点赞计数
  demo     INTEGER DEFAULT 0,           -- 1=示例投稿 0=真实投稿
  source   TEXT NOT NULL DEFAULT 'user' -- 来源标注：user（用户上传）
);
CREATE INDEX idx_subs_target ON submissions(target);

INSERT INTO submissions (id, type, target, text, gif, video, author, user_id, ts, likes, demo, source) VALUES
  ('demo-1', 'hero', 'jett', '捷风 E 上升气流可以卡在箱子沿，先 E 再 Q 穿烟能拿到更高的枪线视角', '', '', '阿P的枪线笔记', 'u_demo_001', '2026-08-20', 23, 1, 'user'),
  ('demo-2', 'map', 'ascent', '亚海悬城守方开局直接关 B 门，对方只能从中路和 A 主推，信息压力小一半', '', '', '老图手', 'u_demo_002', '2026-08-21', 17, 1, 'user'),
  ('demo-3', 'hero', 'sage', '贤者的墙可以横在 A 短垫脚上箱，配合大招读条更稳，队友别站在墙后吃枪线', '', '', '冰墙工程师', 'u_demo_003', '2026-08-22', 31, 1, 'user'),
  ('u1787646950187', 'hero', 'jett', '实测投稿：捷风大招切刀瞬间可以先用 Q 位移拉身位再出刀，命中率明显更高', '', '', '自动化测试员', 'u_mt8eu65uftnc', '2026-08-25', 1, 0, 'user');

-- ------------------------------------------------------------
-- 表3 状态层：评论明细
-- ------------------------------------------------------------
CREATE TABLE comments (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  submission_id TEXT NOT NULL REFERENCES submissions(id),
  author        TEXT NOT NULL,
  text          TEXT NOT NULL,
  ts            TEXT NOT NULL
);
CREATE INDEX idx_cmt_sub ON comments(submission_id);

INSERT INTO comments (submission_id, author, text, ts) VALUES
  ('demo-1', '路过的青铜', '试了一下真的能白拿视角，学会了', '2026-08-21'),
  ('demo-3', '瓦学十级', '补充：墙别急着立，等对面道具交了再立更赚', '2026-08-23'),
  ('u1787646950187', '我', '自动化测试评论：这条投稿来自端到端测试', '2026-08-25');

-- ------------------------------------------------------------
-- 表4 状态层：点赞明细（幂等：同一用户对同一投稿只允许一次）
-- ------------------------------------------------------------
CREATE TABLE likes (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  submission_id TEXT NOT NULL REFERENCES submissions(id),
  user_id       TEXT NOT NULL,
  ts            TEXT NOT NULL,
  UNIQUE (submission_id, user_id)
);
CREATE INDEX idx_like_sub ON likes(submission_id);

INSERT INTO likes (submission_id, user_id, ts) VALUES
  ('demo-1', 'u_like_0001', '2026-08-20'),
  ('demo-1', 'u_like_0002', '2026-08-21'),
  ('demo-2', 'u_like_0003', '2026-08-21'),
  ('demo-3', 'u_like_0004', '2026-08-22'),
  ('u1787646950187', 'u_mt8eu65uftnc', '2026-08-25');

-- ------------------------------------------------------------
-- 视图1：投稿总览（署名 / 时间 / 点赞计数 / 点赞明细数 / 评论数）
-- 说明：点赞计数来自 submissions.likes（前端展示用），点赞明细数来自 likes 表（对账用），
--       两者不一致时说明计数与明细存在漂移，可用于数据校验
-- ------------------------------------------------------------
CREATE VIEW v_submission_stats AS
SELECT
  s.id           AS submission_id,
  s.type         AS 类型,
  s.target       AS 对象id,
  s.author       AS 署名,
  s.user_id      AS 用户ID,
  s.ts           AS 投稿时间,
  s.likes        AS 点赞计数,
  (SELECT COUNT(*) FROM likes    l WHERE l.submission_id = s.id) AS 点赞明细数,
  (SELECT COUNT(*) FROM comments c WHERE c.submission_id = s.id) AS 评论数,
  s.demo         AS 是否示例,
  s.source       AS 来源标注,
  s.text         AS 投稿内容
FROM submissions s;

-- ------------------------------------------------------------
-- 视图2：攻略链接总览（中文列名，便于演示时直接查看）
-- ------------------------------------------------------------
CREATE VIEW v_content_docs AS
SELECT id, target_id AS 对象id, doc_type AS 类型, title AS 标题, url AS 链接, source AS 来源
FROM content_docs;
