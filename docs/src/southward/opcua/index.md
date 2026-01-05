---
title: 'OPC UA'
description: 'NG Gateway OPC UA 南向驱动使用与配置：连接/认证/安全策略、订阅 vs 周期读、NodeId 建模、数据类型映射与最佳实践。'
---

## 1. 协议介绍与常见场景

OPC UA（OPC Unified Architecture）是面向工业自动化的机器到机器通信协议，由 OPC Foundation 维护。它提供统一的信息模型、可扩展的数据类型系统与内建安全机制（证书、加密、签名）。

NG Gateway OPC UA 驱动作为 **客户端** 访问多种 OPC UA Server，例如：

- KEPServerEX、Industrial Gateway OPC Server、Prosys Simulation Server、Ignition
- 设备内置 OPC UA Server（例如部分 PLC/控制器）

## 2. 配置模型：Channel / Device / Point / Action

可配置字段由 `@ng-gateway-southward/opcua/src/metadata.rs` 定义，对应运行时结构 `OpcUaChannelConfig/OpcUaPoint/OpcUaParameter`。

### 2.1 Channel（通道）配置

Channel 是 OPC UA 会话边界：一个 Channel 对应一个 OPC UA Server（或一个 endpoint）。

#### 2.1.1 应用身份

- **`applicationName`**：客户端应用名（必填）
- **`applicationUri`**：客户端应用 URI（必填）

这些字段会参与 UA 的应用描述与证书/信任链体系（尤其是证书认证模式）。

#### 2.1.2 `url`（Endpoint URL）

示例：

- `opc.tcp://192.168.1.10:4840`
- `opc.tcp://server-hostname:4840`

> 说明：驱动 UI 允许 `opc.tcp/http/https` scheme，但工业现场最常见是 `opc.tcp`。

#### 2.1.3 `auth.kind`（认证方式）

- **anonymous**：匿名（最常用）
- **userPassword**：用户名密码
- **issuedToken**：颁发令牌（token 字符串）
- **certificate**：证书方式（`privateKey` + `certificate`）

证书内容通常以 PEM 字符串存储（具体格式与 `opcua` crate 解析一致）。

#### 2.1.4 安全策略与安全模式

- **`securityPolicy`**：如 None / Basic256Sha256 / Aes256Sha256RsaPss ...
- **`securityMode`**：None / Sign / SignAndEncrypt

**最佳实践**：

- 生产环境建议至少 `Sign`，优先 `SignAndEncrypt`。
- 如果 Server 只开放某些 policy/mode 组合，请按 Server 的 endpoint 配置对齐。

#### 2.1.5 采集模式：`readMode`

- **Subscribe（订阅）**：驱动创建 Subscription + MonitoredItems，Server 推送变化（推荐）
- **Read（周期采集）**：按采集周期主动 Read（适合少量点或 Server 不支持订阅/限制订阅）

> 注意：Subscribe 模式更“事件驱动”，对高频变化点位更高效，但要关注 subscription 的批量与保活参数。

#### 2.1.6 会话与保活参数

- **`sessionTimeout`**：会话超时（ms，默认 30000）
- **`keepAliveInterval`**：保活间隔（ms，默认 30000）
- **`maxFailedKeepAliveCount`**：最大失败保活次数（默认 3）
- **`subscribeBatchSize`**：订阅批量大小（默认 256）

**调参建议**：

- 点位很多时，适当增大 `subscribeBatchSize` 能减少 create/modify 请求次数，但过大可能触发服务端限制。
- `keepAliveInterval` 不要太小（会增加 Server 压力），也不要太大（故障检测慢）；默认值通常是合理起点。

### 2.2 Device（设备）配置

OPC UA 驱动的 device 驱动配置为空（device 用于逻辑分组：`device_name/device_type/status`）。

建模建议：

- 你可以把“一个生产线/一个工段/一个子系统”建模为一个 Device，用于组织点位与北向主题路由。

### 2.3 Point（点位）配置

- **`nodeId`**：OPC UA NodeId 字符串（必填）

NodeId 的格式与选取方式见 `./nodeid.md`。

### 2.4 Action（动作）配置

Action 的驱动配置也使用 `nodeId`，用于写入或调用特定节点（当前版本主要覆盖写节点值场景）。

## 3. 数据类型映射表（OPC UA Variant ↔ DataType）

类型映射集中在 `@ng-gateway-southward/opcua/src/codec.rs`（`OpcUaCodec`）：

### 3.1 读路径（Variant → NGValue）

- 数值型 Variant（SByte/Int16/Int32/Int64/Float/Double 等）：
  - 先转为 f64 再按 `DataType` 与 `scale` 做强制转换
- `Variant::Boolean`：按 `DataType` 与 `scale` 转换（推荐 `Boolean`）
- `Variant::String`：
  - `DataType::String`：直接输出字符串
  - `DataType::Timestamp`：尝试解析 RFC3339
  - `DataType::Binary`：尝试解析 hex 字符串
- `Variant::ByteString`：推荐映射为 `Binary`
- `Variant::DateTime`：推荐映射为 `Timestamp` 或 `String`
- **数组（Variant::Array）**：当前版本不支持，会返回空（点位不会产生值）

> 重要：如果你需要数组/结构体，建议在 Server 侧提供标量节点，或在边缘侧扩展“结构体/数组”到 JSON 的映射能力。

### 3.2 写路径（NGValue → Variant）

写入时按 Point 的 `data_type` 做强制转换并生成 Variant；`Timestamp` 会转换为 UA `DateTime`（如果时间戳非法则写入失败）。

## 4. 进阶文档

- `NodeId 语法与如何从 Server 浏览获取`：见 `./nodeid.md`
- `安全策略/证书/认证最佳实践`：见 `./security.md`


