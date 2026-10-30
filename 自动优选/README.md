# 每日自动优选

本机联通与 SA6400 电信各运行一个独立任务，使用临时 Mihomo 实例测完整代理链路。不会修改正在使用的 Clash/Mihomo 配置、规则、端口或进程。

## 当前默认策略

- 北京时间：联通 03:10，电信 04:10。当天未完成时，每小时补跑；Windows 也在用户登录后检查。Windows 任务使用当前用户的登录会话，关机或注销期间不运行，恢复登录后补跑。
- 自动读取面板的后端列表，后端数量不固定。每个后端、运营商、IP 和端口独立记分。
- 每天筛选约 32 个新 IP、6 种 HTTPS 端口；优先复测历史优胜和当前节点，再选出约 6 个候选做完整链路测试。
- 每个候选测 3 次代理延迟、2 次完整 8 MiB 下载；当日表现最好的两个候选再各测一次 32 MiB。完整跑完四个后端，每条线路每天约 640 MiB，加上握手和重试流量。
- Cloudflare 测速源拒绝请求时，使用官方 PowerToys 发布文件的指定字节段作为备用源；严格验证 HTTP 206、Content-Range 与实际字节数。可用 `fallback_download_url` 更换备用大文件地址，不使用带有效期的签名链接作为持久配置。
- 两条线路运行前检查出口 ASN。线路不符或无法确定时停止，不上传错误运营商成绩。
- 按北京时间每天去重，保留近 30 天；成功率优先，其次比较下载速度的较低四分位，再比较延迟的较高分位。下载字节不足、超时都记失败，测速源拒绝访问则跳过该后端批次。
- 至少积累 3 个不同日期的成绩，当天也必须完整成功、通过 32 MiB 大段确认、历史成功率至少 80%，才能参与自动替换。大段测速源拒绝时仍保留已经完成的小段成绩，但不赋予晋升资格。同一运营商的入选节点不重复 IP。维持原有节点数量，候选不足时保留原列表。
- “最优”是近期测试中相对较好的结果，不保证全天速度和延迟。旧记录未在当天复测时不直接晋升。

## 保存位置与 KV 调用

历史通过 Cloudflare 官方 KV 管理 API，写入对应后端原 KV 的 `optimizer-history:unicom` 或 `optimizer-history:telecom`；每天每个后端、运营商批量写一次，不逐次测速写入。正常四个后端共 8 次历史写入/日，分散在各账号；入选节点改变时才额外更新 `config`。

代理、订阅与面板普通请求不读取这些历史。原有额度监控与 80% 切换策略不变。通过管理 API 更新配置后，现有后端实例缓存最多约 5 分钟重新加载。

本机运行目录为 `%LOCALAPPDATA%\CFNextOptimizer`，任务名 `CFNext-Unicom-Daily`。NAS 目录为 `/volume1/docker/cfnext-optimizer`，DSM 任务名 `CFNext-Telecom-Daily`，使用普通用户运行。日志滚动保留，状态文件防止同日重复测试；临时 Mihomo 配置和进程在每个后端测完后清理。

## 需要填写的配置

`config.example.json` 是不含凭据的 NAS 配置示例。本机配置由 `install-windows.ps1` 生成。

| 字段 | 内容 |
| --- | --- |
| `panel`、`entry` | 前端 HTTPS 地址与登录路径 |
| `carrier` | `unicom` 或 `telecom` |
| `time` | 每日开始时间，北京时间 |
| `expected_asns` | 本线路可接受的真实出口 ASN |
| `source_address` | 可选；NAS 多网卡或双栈环境下，绑定实际电信网口的 IPv4 地址，避免运营商识别走另一条出口 |
| `network_probe` | NAS 使用 `curl` 做公网 ASN 检查，绑定上述网口；本机默认使用 Python |
| `mihomo` | 独立测速内核的绝对路径 |
| `password_file`、`storage_file`、`state_file` | 当前账号可读写的私有运行文件路径 |

面板密码和 KV 凭据不得填入仓库。`runner.py --config ... --set-password` 从标准输入读取密码；`--set-storage` 从标准输入读取以下结构的 JSON：

```json
{"后端UUID":{"account":"账号ID","namespace":"原KV命名空间ID","token":"具有该KV读写权限的API Token"}}
```

Windows 凭据使用当前用户 DPAPI 加密；NAS 运行目录权限 0700，凭据文件 0600。已有账号重建项目并保留 UUID/KV 时可继续复用映射；新增后端或更换 KV、UUID 时，需要在私有凭据文件中增加对应条目，不需要修改程序。`--check` 仅验证登录和 KV 读取，`--run-now` 提前执行今天的任务，仍然按天去重。

## 通常无需修改

`ports` 默认包含 443、2053、2083、2087、2096、8443；`screen_ips=32`、`candidates_per_backend=6`、`unified_delay=true`、`download_timeout=45`。首次部署安装脚本会生成本机配置；NAS 安装程序通过标准输入接收私有配置和凭据，使用 DSM 原生任务调度器注册任务。
