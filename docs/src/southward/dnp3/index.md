---
title: 'DNP3'
description: 'NG Gateway DNP3 南向驱动：TCP/UDP/串口连接、主站/从站地址、总召/事件扫描、对象组/索引建模与数据类型映射。'
---

## 1. 协议介绍与常见场景

DNP3（Distributed Network Protocol）常用于电力/水务等 SCADA 场景，支持完整性扫描（Integrity Scan）与事件扫描（Event Scan），并可通过 TCP/UDP/串口运行。

NG Gateway DNP3 驱动作为 **Master** 与 Outstation 通信：

- 周期执行完整性扫描（Class 0/1/2/3）
- 周期执行事件扫描（Class 1/2/3）
- 支持部分下行命令（CROB/模拟量输出/重启等）

## 2. 配置模型：Channel / Device / Point / Action

可配置字段由 `@ng-gateway-southward/dnp3/src/metadata.rs` 定义，对应运行时结构 `Dnp3ChannelConfig/Dnp3Point/Dnp3CommandType`。

### 2.1 Channel（通道）配置

#### 2.1.1 `connection.type`

- tcp：`connection.host/connection.port`
- udp：`connection.host/connection.port`，可选 `connection.localPort`
- serial：`connection.path/baudRate/dataBits/stopBits/parity`

#### 2.1.2 Link Layer 地址

- `localAddr`：主站地址（0..65519）
- `remoteAddr`：从站地址（0..65519）

#### 2.1.3 扫描与超时

- `responseTimeoutMs`：响应超时（默认 5000）
- `integrityScanIntervalMs`：完整性扫描间隔（默认 20000）
- `eventScanIntervalMs`：事件扫描间隔（默认 1000）

### 2.2 Device（设备）配置

驱动层 device 配置为空（device 用于逻辑分组）。

### 2.3 Point（点位）配置

点位通过“对象组 + index”定位：

- `group`：对象组（BinaryInput/AnalogInput/Counter/OctetString 等）
- `index`：索引（从 0 开始）

详细见 `./groups.md`。

### 2.4 Action（动作）配置

动作通过：

- `group`：命令类型（CROB/AnalogOutputCommand/WarmRestart/ColdRestart）
- `index`：目标索引（对重启类命令可忽略/不使用）

## 3. 数据类型映射表（DNP3 ↔ DataType）

驱动的解码转换集中在 `@ng-gateway-southward/dnp3/src/codec.rs`（`Dnp3Codec`）：

- bool → `DataType`（常用 Boolean）
- 数值（f64/u64）→ 按 `data_type + scale` 强制转换
- OctetString：
  - `Binary`：bytes
  - `String`：尝试 UTF-8，失败回退为 Binary

## 4. 进阶文档

- `对象组/索引/命令类型建模与最佳实践`：见 `./groups.md`


