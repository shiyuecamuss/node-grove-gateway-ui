---
title: 'DNP3'
description: 'NG Gateway DNP3 南向驱动：TCP/UDP/串口连接、主站/从站地址、总召/事件扫描、对象组/索引建模与数据类型映射。'
---

## 1. 协议介绍

DNP3（Distributed Network Protocol）常用于电力/水务等 SCADA 场景，支持完整性扫描（Integrity Scan）与事件扫描（Event Scan），并可通过 TCP/UDP/串口运行。

NG Gateway DNP3 驱动作为 **Master** 与 Outstation 通信：

- 周期执行完整性扫描（Class 0/1/2/3）
- 周期执行事件扫描（Class 1/2/3）
- 支持部分下行命令（CROB/模拟量输出/重启等）

## 2. 配置模型

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

点位通过"对象组 + index"定位：

- `group`：对象组（BinaryInput/AnalogInput/Counter/OctetString 等）
- `index`：索引（从 0 开始）

### 2.4 Action（动作）配置

Action 用于封装一组"下行命令"的操作；**Action 本身不承载协议细节配置**。

- **关键语义**：DNP3 的命令类型与目标索引应配置在 **Action 的 `inputs(Parameter)` 上**，即每个参数都通过 `Parameter.driver_config.group/index` 指定要下发的命令与对象索引。
- **无参动作**：`WarmRestart/ColdRestart` 这类命令通常不需要 value；你可以建一个 **inputs 为空** 的 Action，并用 `Action.command` 表示该动作语义（driver 会忽略 value）。

参数级驱动配置字段（每个 input parameter）：

- **`group`**：命令类型（`CROB` / `AnalogOutputCommand` / `WarmRestart` / `ColdRestart`）
- **`index`**：目标索引（`CROB`/`AnalogOutputCommand` 必填；重启类可忽略）

::: tip
group/index 详细见 [对象组/索引/命令类型](./groups.md)
:::

## 3. 数据类型映射表

### 3.1 Point（上行）推荐映射

| Point group（对象组） | 原始值类型 | 推荐 DataType | 说明 |
| --- | --- | --- | --- |
| BinaryInput / BinaryOutputStatus（bool 类） | bool | Boolean | 最推荐 |
| AnalogInput（模拟量） | f64 | Float32 / Float64 | 如需整数可选 Int*/UInt*，但注意溢出与精度 |
| Counter / FrozenCounter（累计量） | u64 | UInt64（或 Int64） | 累计量常用无符号；现场约定负值时才选 Int64 |
| OctetString | bytes | Binary / String | `String` 会尝试 UTF-8，失败回退 Binary |

::: warning 注意
DNP3 的对象组很多，完整列表与建模建议见 [对象组/索引/命令类型](./groups.md)。上表给出最常见、最稳定的组合。
:::

### 3.2 WritePoint（下行写点）DataType 选择

WritePoint 只支持写以下 group：

- `BinaryOutput` → 使用 `CROB`（控制继电器输出块）
- `AnalogOutput` → 使用 `AnalogOutputCommand`（Group 41）

并且驱动会对 `value` 做**严格类型校验**（type mismatch 直接拒绝），因此 `point.data_type` 必须选对。

| 写入目标（point.group） | 底层命令 | 推荐 DataType | value 说明 |
| --- | --- | --- | --- |
| BinaryOutput | CROB | Boolean（推荐）/ UInt8 | Boolean：false/true；UInt8：0=Nul,1=Close,2=Trip |
| AnalogOutput | AnalogOutputCommand | Int16 / Int32 / Float32 / Float64 | DataType 决定使用 Group41 的变体（Var2/Var1/Var3/Var4） |

#### DataType 与 Group41 Variation 映射（关键）

**核心机制**：`DataType` 直接决定 DNP3 写入命令使用的 Variation：

| DataType | DNP3 Variation | 协议含义 | 值范围 |
| --- | --- | --- | --- |
| Int16 / UInt16 | Group41Var2 | 16-bit Analog Output | -32768 ~ 32767 |
| Int32 / UInt32 | Group41Var1 | 32-bit Analog Output | -2^31 ~ 2^31-1 |
| Float32 | Group41Var3 | Single-precision Float | IEEE 754 float |
| Float64 | Group41Var4 | Double-precision Float | IEEE 754 double |

::: tip 为什么不需要配置 Variation？
NG Gateway 采用**简化建模**策略：
- **读取时**：使用 Class Data (Group 60) 请求，Outstation 自行决定返回的 Variation，驱动自动处理转换
- **写入时**：通过 `DataType` 隐式选择正确的 Variation

这种设计简化了配置，同时保证了协议兼容性。详见 [DataType 与 Variation 映射](./groups.md#_2-datatype-与-dnp3-variation-的映射关系)。
:::

### 3.3 Action Parameter（下行动作参数）DataType 选择

Action Parameter 与 WritePoint 规则一致：每个参数携带 `group/index`，并按其 `data_type` 解析 value。

- `group=CROB`：推荐 `data_type=Boolean`（也可用 `UInt8` 表示 0/1/2）
- `group=AnalogOutputCommand`：仅支持 `Int16/Int32/Float32/Float64`（否则 driver 返回错误）

### 3.4 读取时的 Variation 处理

读取数据时，NG Gateway **不指定**具体的 Variation，而是使用 Class Data 请求：

```
请求: Group60Var1 (Class 0 - 静态数据)
响应: Outstation 返回 Group30Var1 或 Group30Var5 等（取决于设备配置）
```

驱动底层会将不同 Variation 的响应**统一转换**为标准类型：
- 所有 `Group30VarX` → `f64` → 根据您配置的 `DataType` 进行最终转换
- 所有 `Group1VarX` → `bool` → 根据您配置的 `DataType` 进行最终转换

因此，您配置的 `DataType` 仅影响**最终值的类型转换**，不影响协议层的请求。
