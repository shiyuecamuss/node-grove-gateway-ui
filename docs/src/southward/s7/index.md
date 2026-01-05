---
title: '西门子 S7'
description: 'NG Gateway Siemens S7 南向驱动使用与配置：CPU/TSAP/PDU 协商、S7 地址语法、数据类型映射与最佳实践。'
---

## 1. 协议介绍与常见场景

西门子 S7 协议（常见为 S7Comm over ISO-on-TCP，端口 102）广泛用于 S7-200/300/400/1200/1500/LOGO 等 PLC 的变量读写。

NG Gateway S7 驱动作为 **客户端** 连接 PLC，通过地址表达式读取/写入 PLC 内存区（I/Q/M/DB/T/C 等）。

**典型场景**：

- 读取 DB 区结构体/数组中的过程量（温度、压力、产量）
- 写入控制命令（启停、配方参数）
- 现场多台 PLC：按 PLC 或按网络隔离建多个 Channel

## 2. 配置模型：Channel / Device / Point / Action

可配置字段由 `@ng-gateway-southward/s7/src/metadata.rs` 定义，对应运行时结构 `S7ChannelConfig/S7Point/S7Parameter`。

### 2.1 Channel（通道）配置

Channel 是一个 PLC 连接会话边界：**一个 Channel 对应一个 PLC（或一个 PLC 的一个网络入口）**。

#### 2.1.1 `cpu`（CPU 类型）

用于选择握手/参数差异与默认 TSAP 策略：

- S7200 / S7200Smart / S7300 / S7400 / S71200 / S71500 / Logo0BA8

> 建议：尽量选择真实 CPU 型号；选错会导致握手失败或读写异常。

#### 2.1.2 `host` / `port`

- **`host`**：PLC IP/hostname（不含 schema）
- **`port`**：默认 `102`

#### 2.1.3 `tsap.kind`（TSAP 模式）

S7 连接需要 TSAP（Transport Service Access Point）参数。驱动提供两种方式：

- **`rackSlot`**：通过 `rack` + `slot` 派生 TSAP（最常用）
- **`tsap`**：手动指定 `src/dst` TSAP（与第三方设备/网关适配时更常用）

字段：

- `tsap.rack`：机架（默认 0）
- `tsap.slot`：插槽（默认 1）
- 或 `tsap.src` / `tsap.dst`：0..65535

**什么时候用 rack/slot**：

- S7-1200/1500：通常 rack=0，slot=1（部分机型 slot 可能不同）
- S7-300/400：取决于机架结构与 CPU 插槽

**什么时候用显式 TSAP**：

- 通过第三方网关转发 S7（例如某些工业网关）
- 现场已知对端 TSAP，且 rack/slot 推导不可靠

#### 2.1.4 PDU/AMQ 协商参数（高级调优）

驱动允许指定“希望的协商值”，以在高点位量场景下减少往返次数、提升吞吐：

- **`preferredPduSize`**：期望 PDU 大小（默认 960，允许 128..8192）
- **`preferredAmqCaller`**：期望 AMQ Caller（默认 8，允许 1..255）
- **`preferredAmqCallee`**：期望 AMQ Callee（默认 80，允许 1..255）

**最佳实践**：

- 如果你不确定 PLC 支持能力，保持默认即可（让 PLC 决定）。
- 当点位很多且读写频繁时，可以逐步提高 `preferredPduSize`（比如 960→2048）并观察失败率与平均响应时间。

### 2.2 Device（设备）配置

S7 驱动的 device 驱动配置为空（device 主要承载通用字段：`device_name/device_type/status`）。

**建模建议**：

- 一个 Channel 对应一个 PLC 时，通常只需要一个 Device（代表该 PLC）。
- 如果你希望对同一 PLC 做“业务分组”（例如按产线/工段拆分点位集合），可以建多个 Device（逻辑分组），但它们共享同一连接会话。

### 2.3 Point（点位）配置

Point 的驱动配置字段：

- **`address`**：S7 地址表达式（必填）

地址语法非常关键，见 **进阶文档**。

### 2.4 Action（动作）配置

Action 的驱动配置字段：

- **`address`**：S7 地址表达式（必填）

Action 的输入参数 `S7Parameter` 也携带 `address`，用于“一个动作写多个地址”或“一个动作携带多个参数分别写入不同变量”。

## 3. 数据类型映射表（S7 ↔ DataType）

驱动的类型映射集中在 `@ng-gateway-southward/s7/src/codec.rs`（`S7Codec`）：

### 3.1 读路径（S7DataValue → NGValue）

- Bit：可映射为 `Boolean`（推荐），也可按 `DataType` 做数值/布尔强制转换
- Byte/Word/Int/DWord/DInt/Real：按数值路径转换，并应用 `scale`（如配置）
- String/WString：推荐映射为 `String`
- Date/DateTime/Time/Timer：推荐映射为 `Timestamp`（毫秒）或 `String`

### 3.2 写路径（NGValue → S7DataValue）

写入时驱动会按地址表达式推导 `transport_size`，再把 `NGValue` 转成对应 S7 类型。

> 最佳实践：Point 的 `data_type` 与地址表达式推导出的 transport size 保持语义一致（例如 REAL → Float32，DINT → Int32）。

## 4. 进阶文档

- `S7 地址语法与示例`：见 `./addressing.md`


