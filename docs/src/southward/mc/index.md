---
title: '三菱 MC'
description: 'NG Gateway Mitsubishi MC 协议南向驱动：PLC 系列、批量读写/帧大小/并发调优、MC 地址语法与数据类型映射。'
---

## 1. 协议介绍与常见场景

三菱 PLC 的 MC 协议（MELSEC Communication Protocol）常用于对三菱 PLC（A/QnA/Q/L/iQ-R 等）进行寄存器/线圈（设备）读写。不同系列在帧格式与批量能力上存在差异。

NG Gateway MC 驱动作为客户端连接 PLC，通过 MC 地址（如 `D100`、`X1A0`、`D20.2`）进行批量读写，并把结果映射为统一的 `DataType/NGValue`。

## 2. 配置模型：Channel / Device / Point / Action

### 2.1 Channel（通道）配置

MC 的 Channel 配置（可编辑字段）由 `@ng-gateway-southward/mc/src/metadata.rs` 定义，对应运行时结构 `McChannelConfig`：

- **`host`**：PLC IP/hostname
- **`port`**：端口（默认 5001，视现场 PLC/网关配置而定）
- **`series`**：PLC 系列（A / QnA / Q/L / iQ-R）
- **`maxPointsPerBatch`**：单批最大点数（用于批量读写规划）
- **`maxBytesPerFrame`**：单帧最大字节数（用于防止帧过大）
- **`concurrentRequests`**：并发请求数（默认 1，建议谨慎提高）

**为什么需要 series**：

- 不同系列对应不同的帧变体与批量上限（驱动内部会据此选择 frame variant 与限制）。

### 2.2 Device（设备）配置

驱动层 device 配置为空（device 用于逻辑分组）。

### 2.3 Point（点位）配置

Point 驱动配置字段：

- **`address`**：MC 地址（必填）
- **`stringLenBytes`**：字符串长度（字节，可选，仅当 `data_type=String` 需要固定长度时使用）

地址语法详见 `./addressing.md`。

### 2.4 Action（动作）配置

Action 驱动配置字段：

- **`address`**：MC 地址（必填，用于写入目标）

当前版本 Action 的参数列表仍在完善中；建议优先使用 WritePoint 对点位写入，或将动作封装为“写固定地址”的命令。

## 3. 数据类型映射表（MC ↔ DataType）

值编解码逻辑位于 `@ng-gateway-southward/mc/src/codec.rs`（`McCodec`）：

### 3.1 读路径（bytes → NGValue）

- 数值类型使用 **little-endian** 解码（符合 MC 二进制规范）
- `String`：按 bytes 解释为 UTF-8/ASCII（具体由上层处理/约定）
- `Binary`：原样 bytes
- `Timestamp`：按 i64 little-endian（毫秒）

### 3.2 写路径（NGValue → bytes）

写入同样按 little-endian 编码；建议 `data_type` 与目标设备的真实存储类型一致，否则会出现“写进去读不回来/值不对”。

## 4. 进阶文档

- `MC 地址语法与十进制/十六进制规则`：见 `./addressing.md`
- `批量读写/帧大小/并发调参`：见 `./batching.md`


