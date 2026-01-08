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

Action 用于封装一组“写入 Tag”的操作；**Action 本身不承载协议细节配置**。

- **关键语义**：Ethernet/IP 的写入目标 Tag 必须配置在 **Action 的 `inputs(Parameter)` 上**，即每个参数都通过 `Parameter.driver_config.tagName` 指定要写入的 Tag。
- **为什么这样设计**：一个 Action 往往需要写多个 Tag（例如一次下发多个设定值），Action 只是“操作集合”的抽象；真正可配置的协议字段必须落在 Parameter 本体上。

参数级驱动配置字段（每个 input parameter）：

- **`tagName`**：Tag 名称（必填），例如 `Program:Main.MyTag`

::::
tip 兼容性说明
历史版本可能把 Tag 编码在 `Action.command` 里。当前版本仍会在**单参数动作且缺少 tagName**时回退到 `Action.command`（并输出 warn），但该用法已废弃，请尽快迁移到 `Parameter.driver_config.tagName`。
::::

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

### 3.1 Point / Action Parameter 的 DataType 选择建议

- **对齐原则**：`data_type` 应与 PLC Tag 的真实类型一致（Bool/Int/Dint/Real/String...）。否则可能出现写入失败或数值截断。
- **当前不支持的 DataType**：
  - `Binary` / `Timestamp`：当前驱动不支持与 CIP 的直接映射（会返回 CodecError）

| PLC Tag 类型（CIP） | 推荐 DataType | 备注 |
| --- | --- | --- |
| BOOL | Boolean | 最常见 |
| SINT | Int8 | |
| INT | Int16 | |
| DINT | Int32 | |
| LINT | Int64 | |
| USINT | UInt8 | |
| UINT | UInt16 | |
| UDINT | UInt32 | |
| ULINT | UInt64 | |
| REAL | Float32 | |
| LREAL | Float64 | |
| STRING | String | |

::::
tip 最佳实践
如果你的 PLC 里是 UDT/结构体/数组，建议在 PLC 侧提供“标量镜像 Tag”，或在边缘侧做展开/聚合；当前版本驱动对复杂类型会报错。
::::

## 4. 进阶文档

- `Tag 语法、数组/结构体限制与建模建议`：见 `./tag.md`


