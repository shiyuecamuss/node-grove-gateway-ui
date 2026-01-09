---
title: 'CJT188 地址 / 类型 / DI / field_key'
description: 'CJ/T 188 设备地址的 14 位 hex 结构、表具类型与表具族（meter family），以及 DI / field_key/scale 的填写与解码语义（对齐当前实现）。'
---

## 1) 设备地址（Device.address）

驱动将“表类型(T)”与“地址域(A0..A6)”拆分为两个字段（与 CJ/T 188-2018 帧结构一致）：

- **`meterType`**：表类型（T，1 字节，0..=255）
- **`address`**：地址域（A0..A6，7 字节）

### `meterType`（T）

类型码用于区分水/热/燃气/自定义等（并与版本相关）：

- V2004：标准类型通常为 `0x10/0x20/0x30/0x40`
- V2018：扩展为码段：
  - `0x10..=0x19` 水表族（`0x10` 冷水、`0x11` 生活热水、`0x12` 直饮水、`0x13` 中水等）
  - `0x20..=0x29` 热量表族（`0x20` 热量、`0x21` 冷量、`0x22` 热+冷等）
  - `0x30..=0x39` 燃气表族
  - `0x40..=0x49` 自定义表族

### `address`（A6..A0）

地址域由 **7 个字节**组成（A0..A6），每字节通常为 **2 位 BCD**（但现实设备/模拟器也可能使用任意 hex 字节）。

- **驱动配置格式（推荐）**：`address` 使用 **14 位 hex 字符串**，表示 **A6..A0 字节**（高位在前，符合人类直觉），例如：`00000000EE0001`

> 备注：规约定义“低地址在前，高地址在后”是指 **在线路上的 A0..A6 字节顺序**；驱动会在协议编解码阶段自动完成 **A6..A0（配置）↔ A0..A6（线序）** 的转换。

## 2) DI（Point.di）

驱动 UI 以 4 位 hex（2 字节）表达 DI（例如 `901F`）；协议线上按“小端”发送为 `1F 90`。

实践建议：

- 以厂家手册/主站工具为准
- 如读不到值，优先确认：
  - 该 DI 在 2004/2018 版本下是否有效
  - 设备是否需要 SER/SEQ（2018）以及链路层参数是否一致

## 3) field_key 与 Schema 驱动解析（必读）

### 3.1 一个 DI ≠ 一个点位

CJ/T 188 的 **一个 DI（数据标识）通常代表一组字段**（例如 `901F` 同时包含“累积量/时间/状态”等）。本驱动采用 **DI Schema 驱动解析**：

- 驱动按 `Device.meterType` 归类为 **Water/Heat/Gas/Custom**（表具族）
- 再按 `(DI, 表具族)` 选择内置 schema
- 把该 DI 的响应解析为一组 `field_key -> NGValue`
- 每个 Point 通过 `field_key` 从 DI 数据组里“挑出”一个字段上报

因此：

- **同一个 DI 多字段采集**：建多个 Point，`di` 相同、`field_key` 不同
- **性能**：驱动会按 DI 分组读取；同一设备同一 DI 只发起一次请求，然后分发给多个 Point

### 3.2 field_key 必须来自内置 schema

`field_key` 不是任意字符串，它必须匹配驱动内置 schema 里的字段键：

- 如果 `field_key` 不存在：该点位会被跳过，并在日志里输出 `available_fields`
- 如果 `(DI, meterType family)` 找不到 schema：该 DI 解析失败，并在日志里提示（你需要换 DI 或确认 `meterType`）

## 4) scale（Point.scale，可选）

本驱动的“标准解码”以 **DI Schema 内置 decimals** 为准（每个数值字段在 schema 里都有固定 decimals），Point 侧不再提供 `decimals` 覆盖能力。

当现场设备的“小数位/精度”与 schema 不一致时，推荐用 `scale` 做**工程修正**（不会改变 DI 字段结构，也不会影响 DI 分组读取）：

- **工程单位换算**：例如把 “L” 换算成 “m³”（`scale=0.001`），把 “kPa” 换算成 “MPa”（`scale=0.001`）
- **小数位修正（兼容策略）**：如果 schema 的 decimals 为 \(d_s\)，而现场期望 decimals 为 \(d_e\)，则可设置  
  `scale = 10^(d_s - d_e)`  
  例如 schema 按 2 位小数解码，但现场应为 3 位小数：`scale = 10^(2-3) = 0.1`

## 5) 返回值类型（NGValue）与 DataType 建模建议

### 5.1 DataFormat → NGValue（驱动实现语义）

| Schema DataFormat | 典型含义 | 解析后 NGValue 类型 | 单位处理 |
| --- | --- | --- | --- |
| `BCD` / `BCDWithUnit` | 数值（带小数） | `Float64` | `BCDWithUnit` 的单位码当前不会随值上报；建议在 Point.unit 手动填写 |
| `BCDInteger` | 整数（BCD） | `Int64` | - |
| `Binary` | 二进制无符号整数（小端） | `Int64` | - |
| `DateTime` | BCD 时间（7 字节，SS mm hh DD MM YY CC） | `Timestamp` | Unix epoch ms（UTC）；协议不带时区，网关按 UTC 解释 |
| `Status` | 2 字节状态位 | `Int64` | 实际语义为 `u16`（小端），建议按位解析 |

### 5.2 Point.data_type 应该怎么选？

> 重要：CJ/T188 驱动的“解析结果类型”由 schema 决定；`point.data_type` 不会改变驱动的解码方式，但会影响最终上报值类型（驱动会做强转与范围校验）。

推荐：

- 数值字段（`Float64`）：`data_type=Float64`（最稳）
- 状态位（`status`，实际是 `u16`）：建议 `data_type=UInt16`（更贴近语义），在规则引擎/北向侧再按位解析
- 时间字段（`datetime`）：`data_type=Timestamp`（Unix ms）

## 6) DI / field_key 全量列表（对齐当前实现）

> 说明：下表来自驱动内置 schema（`ng-driver-cjt188`），并按表具族（Water/Gas/Heat/Common）组织。

### 6.1 Water / Gas

| DI（hex） | 含义（Schema 语义） | 可用 field_key（全部） |
| --- | --- | --- |
| `901F` | 水/燃气：综合读数（当前累积、结算日、时间、状态） | `current_flow`, `settlement_flow`, `datetime`, `status` |
| `D120..D12B` | 上 1..12 月：结算日累积流量 | `settlement_flow` |
| `D200..D2FF` | 上 1..256 月：结算日累积流量 | `settlement_flow` |
| `D300..D3FF` | 上 1..256 次：定时冻结数据 | `freeze_datetime`, `cumulative_flow`, `flow_rate`, `temperature`, `pressure` |
| `D400..D4FF` | 上 1..256 次：瞬时冻结数据 | `freeze_datetime`, `cumulative_flow`, `flow_rate`, `temperature`, `pressure` |

#### 字段解释（Water/Gas）

| field_key | 含义 | 推荐 DataType | 备注 |
| --- | --- | --- | --- |
| `current_flow` | 当前累积流量 | `Float64` | `BCDWithUnit(4 + unit)`，单位码不会上报；建议 Point.unit 写 `m³` |
| `settlement_flow` | 结算日/历史结算日累积流量 | `Float64` | `BCDWithUnit(4 + unit)` |
| `datetime` | 实时时间 | `Timestamp` | Unix epoch ms（UTC） |
| `status` | 状态位 | `UInt16` | 实际语义为 `u16` 小端；按位解析（见下文） |
| `freeze_datetime` | 冻结时刻（上 N 次） | `String` | |
| `cumulative_flow` | 冻结时刻累积流量 | `Float64` | |
| `flow_rate` | 冻结时刻瞬时流量 | `Float64` | `BCDWithUnit(4 + unit)`，schema 内置 decimals=4 |
| `temperature` | 温度 | `Float64` | `BCD(decimals=2)` |
| `pressure` | 压力 | `Float64` | `BCD(decimals=2)` |

### 6.2 Heat

| DI（hex） | 含义（Schema 语义） | 可用 field_key（全部） |
| --- | --- | --- |
| `901F` | 热量表：综合读数（热量/功率/流量/温度/工时/时间/状态） | `settlement_heat`, `current_heat`, `heat_power`, `flow_rate`, `cumulative_flow`, `supply_temp`, `return_temp`, `working_hours`, `datetime`, `status` |
| `911F` | 热+冷：综合读数（含冷量、供回水压力） | `settlement_heat`, `settlement_cooling`, `current_heat`, `current_cooling`, `heat_power`, `flow_rate`, `cumulative_flow`, `supply_temp`, `return_temp`, `supply_pressure`, `return_pressure`, `working_hours`, `datetime`, `status` |
| `D120..D12B` | 上 1..12 月：结算日热量 | `settlement_heat` |
| `D200..D2FF` | 上 1..256 月：结算日热量/冷量/流量 | `settlement_heat`, `settlement_cooling`, `settlement_flow` |

#### 字段解释（Heat）

| field_key | 含义 | 推荐 DataType | 备注 |
| --- | --- | --- | --- |
| `settlement_heat` | 结算日热量 / 历史结算日热量 | `Float64` | `BCDWithUnit` |
| `current_heat` | 当前热量 | `Float64` | `BCDWithUnit` |
| `settlement_cooling` | 结算日冷量（仅 `911F`/`D200..D2FF`） | `Float64` | `BCDWithUnit` |
| `current_cooling` | 当前冷量（仅 `911F`） | `Float64` | `BCDWithUnit` |
| `heat_power` | 热功率 | `Float64` | `BCDWithUnit(3 + unit)` |
| `flow_rate` | 瞬时流量 | `Float64` | `BCDWithUnit(3 + unit)`（schema 内置 decimals=3/4） |
| `cumulative_flow` | 累积流量 | `Float64` | `BCDWithUnit` |
| `supply_temp` | 供水温度 | `Float64` | `BCD(decimals=2)` |
| `return_temp` | 回水温度 | `Float64` | `BCD(decimals=2)` |
| `supply_pressure` | 供水压力（仅 `911F`） | `Float64` | `BCD(decimals=2)` |
| `return_pressure` | 回水压力（仅 `911F`） | `Float64` | `BCD(decimals=2)` |
| `working_hours` | 累积工作时间 | `Int64` | `BCDInteger` |
| `datetime` | 实时时间 | `Timestamp` | Unix epoch ms（UTC） |
| `status` | 状态位 | `UInt16` | `u16` 小端 |
| `settlement_flow` | 历史结算日累积流量（仅 `D200..D2FF`） | `Float64` | `BCDWithUnit` |

### 6.3 Common（所有表具族通用）

| DI（hex） | 含义（Schema 语义） | 可用 field_key（全部） |
| --- | --- | --- |
| `907F` | 实时时间 | `datetime` |
| `8102` | 价格表（3 档） | `price_1`, `volume_1`, `price_2`, `volume_2`, `price_3` |
| `8103` | 结算日（day） | `settlement_day` |
| `8104` | 抄表日（day） | `reading_day` |
| `8105` | 购入金额（含状态） | `purchase_seq`, `this_purchase`, `total_purchase`, `remaining`, `status` |

## 7) 状态位（status）字段怎么用

`status` 字段在 schema 解析后语义上是 **`u16` 小端位图**。建议 Point 配置为 `data_type=UInt16`，便于下游按位解析。基础位定义见驱动代码注释：

- **D0**：阀门开关（0=开，1=关）
- **D1**：阀门状态（0=正常，1=异常）
- **D2**：电池电压（0=正常，1=欠压）
- **D3..D15**：厂商定义

建议做法：

- 把 `status` 建模为一个 Point（`field_key=status`）
- 在北向或规则引擎里按位解析（或二次映射为多个布尔属性）

数值类点位的解码流程：

1. BCD payload → 按 schema 内置 `decimals` 解码为 f64
2. 按 `data_type` 强制转换
3. 应用 `scale`（如设置）

建议：

- schema 内置 `decimals` 表达“BCD 小数位”（用户无需配置）
- `scale` 表达“工程换算因子”（用户可配置）

> 备注：本页面已经包含 DI/field_key 的说明与清单；请以本驱动内置 schema 与本文档为准（无需额外的 `di-field-keys.md`）。
