# 补位急救站 · 社群数据后端

零依赖 Python 后端，把工作台的状态层数据从浏览器 localStorage 迁到真正的 SQLite 数据库。

## 快速开始

**方式一（推荐）**：双击 `start_server.bat`
**方式二**：`python server.py`（默认 8000 端口）

首次运行会自动从 `valorant_community_db.sql` 生成 `valorant_community.db`。
启动后浏览器会自动打开 http://127.0.0.1:8000/ —— 后端顺带托管静态页面，
避免 `file://` 打开时的跨域限制。

```
python init_db.py            # 单独生成/重建数据库（--force 覆盖）
python server.py --port 9000 # 换端口
python server.py --no-browser # 不自动开浏览器
```

然后在工作台「社群投稿」页把数据源切到 **🗄️ 后端数据库 SQLite**，点「测试连接」即可。

## 架构：两层分离

对应产品文档「ima vs NoSQL 分层决策」：

| 层 | 表 | 特征 | 未来去向 |
|---|---|---|---|
| 内容层 | `content_docs` | 低频、可缓存、21 条攻略链接 | 可整体迁入 ima 知识库 |
| 状态层 | `submissions` `likes` `comments` | 高频读写、强一致 | 必须独立落库，不进向量库 |

两层在代码里物理分离，可各自替换存储实现而不影响对方。

## 接口一览

全部返回 JSON，已开启 CORS（`Access-Control-Allow-Origin: *`），支持 `file://` 页面直连。

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/health` | 健康检查，返回各表行数与数据库路径 |
| GET | `/api/submissions?user_id=xxx` | 投稿列表，带 `comments` 与当前用户 `liked` 标记 |
| POST | `/api/submissions` | 新建投稿 |
| DELETE | `/api/submissions` | 清空全部投稿与互动数据 |
| POST | `/api/submissions/<id>/like` | 点赞/取消赞，**幂等** |
| POST | `/api/submissions/<id>/comments` | 发表评论 |
| GET | `/api/content_docs?target=jett` | 攻略链接（省略 target 返回全部） |
| GET | `/api/export` | 导出 ima 入库投稿包 |
| POST | `/api/reset` | 重置为初始演示数据 |

### 请求示例

```bash
# 健康检查
curl http://127.0.0.1:8000/api/health

# 新建投稿
curl -X POST http://127.0.0.1:8000/api/submissions \
  -H "Content-Type: application/json" \
  -d '{"type":"hero","target":"skye","text":"斯凯引路之隼可先探点","author":"阿P","user_id":"u_001"}'

# 点赞（连点多次不会重复计数）
curl -X POST http://127.0.0.1:8000/api/submissions/demo-1/like \
  -H "Content-Type: application/json" -d '{"user_id":"u_001","liked":true}'
```

## 两个关键设计

**1. 点赞幂等** —— 靠 `likes` 表的 `UNIQUE(submission_id, user_id)` 约束保证。
计数只在「状态真正发生变化」时增减，不会因重复点击或网络重试而漂移：

```python
if liked and not exists:      # 之前没赞过 → 插入明细 + 计数 +1
elif (not liked) and exists:  # 之前赞过   → 删除明细 + 计数 -1
# 其余情况（重复点赞 / 重复取消）→ 计数不动
```

**2. 降级容错** —— 后端不可用时，工作台自动回落到 localStorage 模式并提示，
功能完全不受影响（与 AI 识别失败降级同一设计原则）。

## 并发与兼容

- `ThreadingHTTPServer` 多线程处理请求
- 写操作用 `threading.Lock` 串行化，避免 SQLite 并发写锁冲突
- 每个请求独立连接，规避 `sqlite3` 跨线程限制
- 静态文件做了目录穿越防护，中文文件名已 URL 解码

**投稿 ID 生成**：`毫秒时间戳(hex) + uuid4 前 8 位`，并在 `UNIQUE` 冲突时自动重试最多 5 次。

> 早期版本用「毫秒时间戳 + 1 位随机字母」，同毫秒并发时只有 26 种取值，
> 30 并发压测实测出现 2 次 `UNIQUE constraint failed`。改用 uuid 段后 30/30 全部成功。

## CORS 跨域处理

响应头（所有响应统一附加，含 4xx / 5xx / 静态文件）：

```
Access-Control-Allow-Origin:  *
Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type
Access-Control-Max-Age:       86400     # 缓存预检 24h，省掉每个 POST 前的一次 OPTIONS 往返
```

**什么时候 CORS 才会生效？** 这点容易搞混：

| 打开方式 | 页面 origin | 是否触发 CORS | 结果 |
|---|---|---|---|
| 访问 `http://127.0.0.1:8000/`（推荐） | `http://127.0.0.1:8000` | 否（同源） | 正常 |
| 双击 HTML（`file://`） | `null` | **是** | `* ` 放行 null origin，可用 |
| 前端部署在其他端口/域名 | 如 `http://localhost:3000` | **是** | 放行 |

也就是说，用本服务自带的静态托管访问工作台时，CORS 其实不参与；
它的价值在于**允许你双击 HTML 也能连后端**，以及未来前端独立部署时无需改后端。

**验证脚本**（真实浏览器，curl 不执行 CORS 策略，只有浏览器才真正拦截）：

| 脚本 | 场景 | 结果 |
|---|---|---|
| `管线脚本/verify_cors.js` | 3000 端口敌对源 → 8000 API | 5/5 通过 |
| `管线脚本/verify_cors_file.js` | `file://` 双击打开 | 5/5 通过 |
| `管线脚本/stress_concurrent.py` | 30 并发写 + 跨域头校验 | 30/30 通过 |

## 错误处理

- **全局异常兜底**：任何未捕获异常都会转成带 CORS 头的 JSON 500（`{"ok":false,"error":"服务端内部错误","detail":"..."}`），
  并在控制台打印完整 traceback。
  > 修复前异常会导致连接直接断开、不返回任何响应，前端只能拿到 `Failed to fetch`，
  > 让人误判成网络故障，实际是服务端异常。
- **输入校验**：所有用户输入经 `_s()` 统一转字符串并限长，非法类型降级为默认值而非抛异常。
  > 修复前传 `{"text":{"a":1}}` 会因 `dict.strip()` 抛 AttributeError，现已返回 400 `技巧内容必填`。
- **404 也有 CORS 头**：重写了 `send_error`，否则跨域下浏览器会先报 CORS 错误，把真正的 404 掩盖掉。

## 数据库怎么打开

`valorant_community.db` 是成品库（表结构 + 数据 + 2 个中文列名视图都在里面）：

- **DB Browser for SQLite**（免费图形界面，推荐演示用）
- VS Code + SQLite 扩展，右键即可浏览
- 命令行：`sqlite3 valorant_community.db`

库内视图：
- `v_submission_stats` —— 投稿总览（点赞数 / 点赞明细数 / 评论数）
- `v_content_docs` —— 攻略链接总览
