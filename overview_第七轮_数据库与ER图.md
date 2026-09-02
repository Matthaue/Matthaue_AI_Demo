# 第七轮 · 工作台接入 SQLite 数据库 + 数据模型 ER 图

## 一、本轮做了什么

把工作台从「前端单 Demo」升级为「前端 + 真正能跑的全栈闭环」：

1. **后端**：`backend/server.py` 零依赖 Python（仅标准库 `http.server` + `sqlite3`），9 个 REST 接口、CORS 全开、写操作加锁串行化、顺带托管静态页面
2. **数据库**：`valorant_community.db` 成品库（4 表 2 视图、21 链接 / 4 投稿 / 3 评论 / 5 点赞），配套 `valorant_community_db.sql` 建表脚本
3. **前端**：`DataService` 适配层 + 模式切换 UI（localStorage / SQLite 一键切）；点赞幂等、乐观更新失败回滚
4. **数据模型可视化**：自包含 SVG `screenshots/er_diagram.svg`，产品文档 md（GitHub Mermaid 自动渲染）+ html（内联 SVG 离线可看）双份
5. **面试话术**：新增 3 条数据模型高频追问 → 直接照搬的 30-60 秒话术（为什么 SQLite / 为什么 4 张表 / 怎么扩）

## 二、关键文件变更

| 类型 | 文件 | 说明 |
|---|---|---|
| 新增 | `backend/server.py` | 零依赖后端（~340 行） |
| 新增 | `backend/init_db.py` | 从 SQL 生成成品库 |
| 新增 | `backend/start_server.bat` | 双击启动 |
| 新增 | `backend/README.md` | 接口文档 |
| 新增 | `valorant_community.db` | 成品库（4 表 2 视图） |
| 新增 | `valorant_community_db.sql` | 建表迁移脚本 |
| 新增 | `screenshots/er_diagram.svg` | 自包含 ER 图（680×630） |
| 新增 | `screenshots/06_数据模型ER图.png` | ER 图实拍 |
| 新增 | `screenshots/06b_数据模型整节.png` | 含设计判断表的整节截图 |
| 新增 | `screenshots/07_mermaid_er渲染效果.png` | GitHub README 上实际渲染效果 |
| 新增 | `screenshots/05_后端数据库模式.png` | 工作台后端模式实拍 |
| 改动 | `补位急救站_workbench.html` | `DataService` 适配层、模式切换 UI、降级容错 |
| 改动 | `WeGame_Agent_产品文档.md/html` | 数据架构决策章节扩展（双模架构 / ER 图 / 3 个设计判断 / 3 条面试话术） |
| 改动 | `_git_stage/Matthaue-AI-test/README.md` | 仓库 README 同步更新 |

## 三、关键设计判断

| 判断 | 决策 | 为什么 |
|---|---|---|
| 零依赖后端 | `http.server` + `sqlite3` 不用 Flask/FastAPI | 换台电脑能直接跑，面试官拿到就能看；M0 阶段不引入额外复杂度 |
| 双模数据访问层 | UI 只认 `DataService` 一个接口，localStorage / SQLite 可切换 | 证明"状态层迟早独立成库"不是空话，迁移时业务代码零改动 |
| 点赞幂等 | `UNIQUE(submission_id, user_id)` 独立 likes 表 | 并发写不漂移，连点 3 次稳定 1，取消回 0 |
| 乐观更新 + 失败回滚 | 先动 UI 再发请求，失败回滚并提示 | 避免网络延迟造成"点了没反应" |
| 内容层不建外键 | `content_docs.target_id` 逻辑关联而非外键 | 内容层低频只读 vs 状态层高频读写，更新频率差两个数量级 |
| 计数冗余 | `submissions.likes` 字段 + `likes` 明细表 | 列表按赞排序免 `COUNT(*)`；明细表对账 |

## 四、实测结果

- **10 个 REST 接口**：health、submissions CRUD、点赞幂等、评论写入、导出、重置、内容层查询、静态托管
- **真实浏览器端到端**（Playwright + Chrome）：切到后端模式显示「已连接 · 链接 21 · 投稿 4 · 评论 3 · 点赞 5」，点赞后前端 1→2、数据库 likes 5→6 真实写回，**页面 JS 错误 0**
- **中文路径修复**：URL 编码的中文文件名 404 问题（`urlparse` 未解码），通过 `unquote(path)` 修复
- **目录穿越防护**：`../../etc/passwd` 等恶意路径全部拦截
- **HTML 标签闭合校验**：无未闭合
- **Mermaid 语法**：用 mermaid@11 官方解析器 parse + render 通过，GitHub 上会正常显示

## 五、踩过的坑

1. **非贪婪正则替换 .er-figure 时 `</div>` 错配**：把后面 `details > div.flow` 里的 `</div>` 当作 .er-figure 闭合，导致 div 高度撑到 2106px。修法：放弃 regex，用 `find('<div class="er-figure">')` + `find('</div>', a)` 精确锚点切片
2. **URL 编码中文路径 404**：第一次 GET `/` 时返回 0 字节，根因是 `urlparse` 没解码。修法：服务端取 `path` 后先 `unquote`
3. **favicon 404**：工作台 HTML 引用 favicon.ico 但后端没处理。后端兜底返回 inline SVG（红 V）
4. **TEXT/INT 列与注释重叠**：第一版 ER 图在 submissions 表里同时放「字段名 + TEXT/INT 类型 + 注释」三列，渲染时三列文字互相重叠。改版：只保留「字段名 + 含义/约束」两列，类型与视图说明统一放底部图例

## 六、面试可直接讲的话术

**Q：为什么工作台要自己写后端，不用现成 BaaS？**

> "**结论：M0 阶段我需要一个真数据库演示，但不想为演示付服务器钱。** 写一个 340 行的零依赖后端，面试官拿到 zip 双击 `start_server.bat` 就能跑，数据真实写到 SQLite——比放个 BaaS 注册链接更有说服力。**这套代码本身是 disposable 的**：M1 真上线时换成托管 MySQL/Postgres，`server.py` 改连接串即可，业务代码零改动。"

**Q：为什么点赞要拆成 likes 表，不用数组？**

> "**结论：拆表是为了让数据库帮我们保证幂等。** 数组在内存里看着方便，但并发场景下 A 写完 B 覆盖 A 的写入、计数漂移、踩内存。`UNIQUE(submission_id, user_id)` 是数据库级别的强约束，无论多少请求同时来，状态只有 0/1 两个值。**代价是每次查点赞要 JOIN**，所以我同时存了 `submissions.likes` 冗余字段用于排序，明细表用于对账。"

**Q：数据库怎么选？**

> "**SQLite 适合 M0 的理由：零运维、单文件、随项目走。** M1 上 WeGame 平台前会迁移到 MySQL/Postgres，迁移成本只集中在 `server.py` 的连接层，UI 和 SQL 写法几乎不用改。这就是为什么我把后端抽象成 `DataService` 而不是把 SQL 写死在 UI 里。"

## 七、可复用经验

1. **同步交付物三件套**：GitHub 仓库 / 桌面压缩包 / 本地文件，用 staging 仓库作为唯一打包源，避免内容漂移
2. **HTML 块替换**：处理多层嵌套的 HTML 块时，用 `find(开锚点) + find(闭锚点, start)` 切片比非贪婪 regex 更稳
3. **Mermaid 验证**：上线前用 mermaid 官方解析器在真实浏览器里 parse + render 一遍，避免 GitHub 上渲染成原始代码
4. **零依赖后端价值**：换台电脑能跑这件事在面试场景里溢价极高
5. **数据层最小可观测闭环**：4 张表（内容/投稿/点赞/评论）= 一个完整业务闭环；扩表标准是「能否减少 JOIN 或支持独立扩展」
