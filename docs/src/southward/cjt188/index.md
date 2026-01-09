---
title: 'CJT188'
description: 'NG Gateway CJ/T 188 南向驱动使用与配置：2004/2018、串口/TCP、表具地址、DI / field_key 与 Schema 驱动解析（只读采集）。'
---

## 1. 协议介绍

CJ/T 188 是国内水/热/燃气等表具常用规约，常见版本为 **CJ/T 188-2004** 与 **CJ/T 188-2018**。协议通常运行在 RS-485 上，也常经由串口服务器转换为 TCP（串口服务器/网关）。

NG Gateway CJ/T188 南向驱动（`ng-driver-cjt188`）用于稳定轮询表具数据，核心能力是 **DI Schema 驱动解析**：按 `(DI, meterType family)` 选择内置 schema，把响应解码为 `field_key -> NGValue`，再由 Point 选取字段上报。

:::: warning 重要（能力边界）
- CJ/T188 驱动仅支持 `collection_type=Collection` 的网关主动采集（由网关调度 `collect_data`）
- `execute_action` 与 `write_point` 在 CJ/T188 驱动中 **明确不支持**（只读驱动），请不要为该驱动配置任何下行 Action 或写点能力
::::

## 2. 快速开始（最小可用）

你只需要完成 3 步：

- **创建 Channel**：选择协议版本、串口或 TCP 连接
- **创建 Device**：填写 `meterType` 与 14 位 hex 地址
- **创建 Point**：填写 `di` + `field_key`，并设置合适的 `data_type/scale`

> 地址/DI 的更详细解释与示例见 `./address-di.md`。

## 3. 配置模型

### 3.1 Channel（通道）配置

#### 3.1.1 `version`

- `V2004`
- `V2018`

#### 3.1.2 `connection.type`（连接方式）

- Serial：串口/RS-485
- Tcp：TCP（串口服务器）

串口参数（Serial）：

- `connection.port` / `baudRate` / `dataBits` / `stopBits` / `parity`

TCP 参数（Tcp）：

- `connection.host` / `connection.port`

#### 3.1.3 高级参数（稳定性/兼容性）

- `maxTimeouts`：连续超时超过该值触发重连（默认 3）
- `wakeupPreamble`：发送前置唤醒码（默认 `[0xFE,0xFE,0xFE,0xFE]`）

:::: tip 最佳实践
- RS-485 场景下前置唤醒码是常见兼容策略；如现场设备明确不需要，可配置为空数组以减少带宽。
- 超时与重连：尽量不要把 `maxTimeouts` 设为 1（容易抖动重连），默认 3 通常更稳。
::::

### 3.2 Device（设备）配置

设备配置拆分为两个字段（与 CJ/T 188-2018 帧结构一致：`68 T A0..A6 ...`）：

- **`meterType`**：表类型（T，1 字节，0..=255）
  - 表具族划分：`0x10..=0x19` 水表族、`0x20..=0x29` 热量表族、`0x30..=0x39` 燃气表族、`0x40..=0x49` 自定义族
- **`address`**：表具地址（A0..A6，7 字节）
  - **驱动配置格式（唯一支持）**：使用 **14 位 hex**，表示 `A6..A0`（高位在前、便于人工填写；驱动会在编解码层完成 `A6..A0（配置）↔ A0..A6（线序）` 的转换）

> 更详细的地址格式说明见 `./address-di.md`。

### 3.3 Point（点位）配置

每个 Point 建模需要关注以下字段：

- **`di`**：4 位 hex（2 字节 DI，例如 `901F`）
- **`field_key`**：该 DI schema 中的字段键（用于从“DI 数据组”里挑出一个字段上报）
- **`data_type`**：期望的最终上报类型（驱动会做强转与校验）
- **`scale`**：工程换算因子（可选，见下文）
- **`unit`**：建议显式填写（尤其是 `BCDWithUnit` 场景，单位码当前不会随值上报）

:::: tip 建模最佳实践（强烈推荐）
一个 DI 往往包含多个字段（例如 `901F` 同时包含 `current_flow`/`datetime`/`status` 等）：

- 若要同时采集多个字段：创建多个 Point，**DI 相同**、`field_key` 不同。
- 驱动会按 DI 分组读取：同一设备同一 DI 只会发起一次读请求，然后把结果分发给多个 Point（吞吐更好）。
::::

## 4. DI / field_key / Schema 驱动解析（必读）

本驱动的解析链路是：

- 协议层：解帧并得到 DI 的数据 payload
- codec 层：按 `(DI, meterType family)` 找 schema，并将 payload 解析为 `field_key -> NGValue`
- driver 层：每个 Point 选取自己的 `field_key`，再按 `data_type/scale` 做强制转换与工程换算

:::: warning `field_key` 不是任意字符串
`field_key` 必须来自驱动内置 schema。若填写错误，点位会被跳过，并在日志里输出可用字段列表（`available_fields`）。
::::

## 5. DataType 映射表与选择指南（产品级）

### 5.1 Schema DataFormat → 解析后 NGValue（驱动实现语义）

| Schema DataFormat | 典型含义 | 解析后 NGValue 类型 | 备注 |
| --- | --- | --- | --- |
| `BCD` / `BCDWithUnit` | 数值（带小数） | `Float64` | `BCDWithUnit` 的单位码当前不会随值上报；建议在 Point.unit 手动填写 |
| `BCDInteger` | 整数（BCD） | `Int64` | - |
| `Binary` | 二进制无符号整数（小端） | `Int64` | 语义通常是 `u8/u16/u32`，但为了统一上报使用 `Int64` 承载 |
| `DateTime` | BCD 时间（7 字节，SS mm hh DD MM YY CC） | `Timestamp` | **Unix epoch ms（UTC）**；协议本身不带时区，网关按 UTC 解释 |
| `Status` | 2 字节状态位 | `Int64` | 实际语义为 `u16`（小端），建议按位解析 |

### 5.2 Point.data_type 的影响（强转、范围校验、scale）

> 关键：`point.data_type` **不会改变字节怎么解析**（由 schema 决定），但会影响**最终上报值类型**。强转失败会被视为数据质量问题：驱动会告警并跳过该点位（不会让整个采集崩溃）。

驱动的强转规则：

- **数值/布尔类**（Boolean/Int*/UInt*/Float*/Timestamp/String）：会先把 schema 产出的值转为数值（必要时），再按 `data_type` 强制转换，并应用 `scale`
- **Binary**：不做强转，原样上报（协议相关字节语义需要由上层自行解释）
- **Timestamp**：除了数值→Timestamp 外，还支持把字符串时间（RFC3339 或 `YYYY-MM-DDTHH:MM:SS`）解析为 Timestamp（兼容历史数据）

#### 推荐选择（高稳定性优先）

- **流量/热量/压力/温度等模拟量**：`data_type=Float64`（最稳，避免窄类型溢出）
- **计数/工时等整数**：`data_type=Int64` 或按需要用 `UInt32/UInt64`
- **状态位（2 字节 bitset）**：建议 `data_type=UInt16`（更贴近语义），或保持 `Int64` 并在规则引擎/北向侧按位解析
- **时间字段**：`data_type=Timestamp`（Unix ms），便于下游做时间序列/窗口计算

### 5.3 `scale`（工程换算因子）怎么用？

`scale` 是 Point 级的工程量修正：在强转过程中应用（与 schema 内置的小数位解码无冲突）。

典型用途：

- **工程单位换算**：例如把 “L” 换算成 “m³”（`scale=0.001`），把 “kPa” 换算成 “MPa”（`scale=0.001`）
- **兼容小数位差异**：若 schema 的 decimals 为 \(d_s\)，现场期望 decimals 为 \(d_e\)，则  
  `scale = 10^(d_s - d_e)`  
  例如 schema 按 2 位小数解码，但现场应为 3 位小数：`scale=0.1`

:::: warning 注意溢出/范围
当 `scale` 放大数值或 `data_type` 过窄（如 Int8/UInt8）时，可能出现溢出导致强转失败；驱动会记录告警并跳过该点位。
::::

## 6. 典型建模示例

### 6.1 水表 `901F`：同时采集累积量、时间、状态

建议建 3 个 Point（同一设备同一 DI，只读一次）：

- `di=901F` + `field_key=current_flow` + `data_type=Float64`（可选 `unit=m³`）
- `di=901F` + `field_key=datetime` + `data_type=Timestamp`
- `di=901F` + `field_key=status` + `data_type=UInt16`（或 `Int64`）

### 6.2 `status` 状态位的使用建议

`status` 是 bitset（2 字节），更推荐的做法是：

- 上报一个原始 `status` 点位（`UInt16`）
- 在规则引擎/北向侧按位拆分为多个布尔量（例如阀门开关/电池欠压等）

## 7. 故障排查（现场高频问题）

- **读不到数据/报 schema not found**：优先确认 `meterType` 是否正确（决定表具族），以及 DI 是否在该版本/表具族下有效
- **日志提示 field_key 不存在**：说明 `field_key` 填错；按日志里的 `available_fields` 修正
- **日志提示 Failed to coerce...**：说明 `data_type` 与实际值不兼容或 `scale` 造成溢出；优先把 `data_type` 调整为 `Float64/Int64/UInt16` 再逐步收敛
- **频繁重连**：适当调大 `maxTimeouts`，并确认串口参数/现场波特率一致；RS-485 可保留默认 `wakeupPreamble` 以提高兼容性

---
title: 'CJT188'
description: 'NG Gateway CJ/T 188 南向驱动使用与配置：2004/2018、串口/TCP、表具地址、DI / field_key 与 Schema 驱动解析（当前只读）。'
---

## 1. 协议介绍

CJ/T 188 是国内水/热/燃气等表具常用规约，常见版本为 **CJ/T 188-2004** 与 **CJ/T 188-2018**。协议通常运行在 RS-485 上，也常经由串口服务器转换为 TCP。

NG Gateway CJ/T188 南向驱动（`ng-driver-cjt188`）用于稳定轮询表具数据，当前版本为 **只读驱动**（仅采集上行数据）。

::: warning 重要
- CJ/T188 驱动仅支持`collection_type`为`Collection`的网关主动采集（由网关主动发起`collect_data`调度）
- `execute_action` 与 `write_point` 在 CJ/T188 驱动中 **明确不支持**。请不要为该驱动配置任何下行 Action 或点位写入能力。
:::

## 2. 配置模型

### 2.1 Channel（通道）配置

#### 2.1.1 `version`

- `V2004`
- `V2018`

#### 2.1.2 `connection.type`（连接方式）

- Serial：串口/RS-485
- Tcp：TCP（串口服务器）

串口参数（Serial）：

- `connection.port` / `baudRate` / `dataBits` / `stopBits` / `parity`

TCP 参数（Tcp）：

- `connection.host` / `connection.port`

#### 2.1.3 高级参数

- `maxTimeouts`：连续超时超过该值触发重连（默认 3）
- `wakeupPreamble`：发送前置唤醒码（默认 `[0xFE,0xFE,0xFE,0xFE]`）

::: tip 最佳实践
- RS-485 场景下，前置唤醒码是常见兼容策略；如现场设备明确不需要，可配置为空数组以减少带宽。
- 超时与重连：尽量不要把 `maxTimeouts` 设为 1（容易抖动重连），默认 3 通常更稳。
:::

### 2.2 Device（设备）配置

设备配置拆分为两个字段（与 CJ/T 188-2018 帧结构一致：`68 T A0..A6 ...`）：

- **`meterType`**：表类型（T，1 字节，0..=255）
  - 表具族划分：`0x10..=0x19` 水表族、`0x20..=0x29` 热量表族、`0x30..=0x39` 燃气表族、`0x40..=0x49` 自定义族（其他值按自定义兜底）
- **`address`**：表具地址（A0..A6，7 字节）
  - **驱动配置格式（唯一支持）**：使用 **14 位 hex**，表示 `A6..A0`（高位在前、便于人工填写；驱动会在编解码层完成 `A6..A0（配置）↔ A0..A6（线序）` 的转换）

> 详细解释见 `./address-di.md`。

### 2.3 Point（点位）配置

每个 Point 都必须指定：

- `di`：4 位 hex（2 字节 DI）
- `field_key`：该 DI 响应结构中的字段键（用于从“DI 数据组”里选出一个字段上报）

::: tip 建模最佳实践（强烈推荐）
一个 DI 往往包含多个字段（例如 `901F` 同时包含 `current_flow`/`datetime`/`status` 等）。

- 若要同时采集多个字段：创建多个 Point，**DI 相同**、`field_key` 不同。
- 驱动会按 DI 分组读取：同一设备同一 DI 只会发起一次读请求，然后把结果分发给多个 Point（性能更好）。
:::

