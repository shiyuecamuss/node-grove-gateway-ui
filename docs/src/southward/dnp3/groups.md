---
title: 'DNP3 对象组/索引与命令类型'
description: '如何选择 Point 的对象组与 index，完整性/事件扫描的语义，以及 CROB/模拟量输出等命令的输入值要求。'
---

## 1) Point：对象组（group）与 index

DNP3 的数据点通常由：

- 对象组（Object Group）
- 变体（Variation）
- index

NG Gateway 当前版本简化为：

- **group**：对象组（枚举）
- **index**：索引

常见 group 含义：

- BinaryInput：开关量输入
- DoubleBitBinaryInput：双点开关量输入
- BinaryOutput：开关量输出状态
- Counter：计数器
- AnalogInput：模拟量输入
- AnalogOutput：模拟量输出状态
- OctetString：字节串

**建模建议**：

- `BinaryInput` / `DoubleBitBinaryInput`：推荐 `data_type=Boolean` 或 `UInt8`（按现场语义）
- `AnalogInput`：推荐 `Float32/Float64`（必要时配 `scale`）
- `Counter`：推荐 `UInt32/UInt64`
- `OctetString`：推荐 `String` 或 `Binary`

## 2) 扫描语义：Integrity vs Event

驱动会定期执行：

- Integrity Scan：获取“全量快照”（Class 0/1/2/3）
- Event Scan：获取“事件变化”（Class 1/2/3）

两者的差异取决于 Outstation 配置与数据点是否支持事件上送。

调参建议：

- eventScanIntervalMs 不要太小（否则会增加 Outstation 压力）
- integrityScanIntervalMs 作为“兜底”不宜太大（否则断连后恢复会慢）

## 3) Action：命令类型（group）与输入值

当前动作类型：

- CROB：控制中继输出块（常用于开关量输出）
- AnalogOutputCommand：模拟量输出命令
- WarmRestart / ColdRestart：重启命令

值类型要求取决于 driver 的实现与 DNP3 库接口；建议：

- CROB：使用 bool 或明确的枚举值（建议我们后续把 CROB 的 on/off/trip/close 等动作显式建模成参数）
- AnalogOutputCommand：使用数值型（与 point/参数的 `data_type` 对齐）


