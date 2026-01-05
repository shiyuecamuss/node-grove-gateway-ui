---
title: 'Ethernet-IP'
description: 'NG Gateway Ethernet/IP 南向驱动：连接/slot/timeout 配置、Tag 建模、数据类型映射与限制（数组/结构体）。'
---

## 1. 协议介绍与常见场景

EtherNet/IP 基于 CIP（Common Industrial Protocol），常用于 Rockwell/Allen-Bradley 等 PLC 的变量（Tag）读写。默认端口通常为 44818。

NG Gateway Ethernet/IP 驱动以客户端方式连接 PLC，并以 Tag 名称进行读写。

## 2. 配置模型：Channel / Device / Point / Action

可配置字段由 `@ng-gateway-southward/ethernet-ip/src/metadata.rs` 定义，对应运行时结构 `EthernetIpChannelConfig/EthernetIpPoint/EthernetIpParameter`。

### 2.1 Channel（通道）配置

- **`host`**：PLC 地址（IPv4/hostname）
- **`port`**：默认 44818
- **`timeout`**：请求超时（ms，默认 2000）
- **`slot`**：槽号（默认 0）

slot 的语义取决于 PLC 型号/机架结构；若不确定，保持默认并用一个已知 Tag 验证读写。

### 2.2 Device（设备）配置

驱动层 device 配置为空（device 用于逻辑分组）。

### 2.3 Point（点位）配置

- **`tagName`**：Tag 名称（必填），例如：
  - `MyTag`
  - `Program:Main.MyTag`

### 2.4 Action（动作）配置

Action 的驱动配置同样使用 `tagName`，用于写入或执行特定 Tag 相关操作（当前版本主要覆盖写 Tag 值）。

## 3. 数据类型映射表（CIP PlcValue ↔ NGValue）

驱动的值映射位于 `@ng-gateway-southward/ethernet-ip/src/codec.rs`：

| PlcValue | NGValue |
| --- | --- |
| Bool | Boolean |
| Sint | Int8 |
| Int | Int16 |
| Dint | Int32 |
| Lint | Int64 |
| Usint | UInt8 |
| Uint | UInt16 |
| Udint | UInt32 |
| Ulint | UInt64 |
| Real | Float32 |
| Lreal | Float64 |
| String | String |

当前版本对结构体/数组等复杂类型会报错。

## 4. 进阶文档

- `Tag 语法、数组/结构体限制与建模建议`：见 `./tag.md`


