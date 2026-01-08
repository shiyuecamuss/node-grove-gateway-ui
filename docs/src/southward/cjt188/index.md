---
title: 'CJT188'
description: 'NG Gateway CJ/T 188 南向驱动使用与配置：2004/2018、串口/TCP、表具地址、DI、BCD 编解码与常见动作（阀控/机电同步）。'
---

## 1. 协议介绍

CJ/T 188 是国内水/热/燃气等表具常用规约，常见版本为 **CJ/T 188-2004** 与 **CJ/T 188-2018**。协议通常运行在 RS-485 上，也常经由串口服务器转换为 TCP。

NG Gateway CJT188 驱动用于稳定轮询表具数据，并支持部分写动作（例如阀控、机电同步等）。

## 2. 配置模型

### 2.1 Channel（通道）配置

#### 2.1.1 `version`

- `V2004`
- `V2018`

版本会影响：

- 支持的表具类型范围（2018 更广）
- 部分 DI 语义（随规约扩展）

#### 2.1.2 `connection.type`（连接方式）

- Serial：串口/RS-485
- Tcp：TCP（串口服务器）

串口参数（serial）：

- `connection.port` / `baudRate` / `dataBits` / `stopBits` / `parity`

TCP 参数（tcp）：

- `connection.host` / `connection.port`

#### 2.1.3 高级参数

- `maxTimeouts`：连续超时超过该值触发重连（默认 3）
- `wakeupPreamble`：发送前置唤醒码（默认 `[0xFE,0xFE,0xFE,0xFE]`）

::: tip 最佳实践
- RS-485 场景下，前置唤醒码是常见兼容策略；如现场设备明确不需要，可配置为空数组以减少带宽。
- 超时与重连：尽量不要把 `maxTimeouts` 设为 1（容易抖动重连），默认 3 通常更稳。
:::


### 2.2 Device（设备）配置

设备配置从“Type+Address 合并”调整为 **两个字段**（与 CJ/T 188-2018 帧结构一致：`68 T A0..A6 ...`）：

- **`meterType`**：表类型（T，1 字节，0..=255）
  - 常见：`0x10` 水表、`0x20` 热量表、`0x30` 燃气表、`0x40` 自定义
  - 2018 扩展：`0x10..=0x19` 水表族、`0x20..=0x29` 热量表族、`0x30..=0x39` 燃气表族、`0x40..=0x49` 自定义族
- **`address`**：表具地址（A0..A6，7 字节 BCD）
  - **驱动配置格式（唯一支持）**：使用 **14 位 hex**（原始 A0..A6 字节，低位在前）

> 详细解释见 `./address-di.md`。

### 2.3 Point（点位）配置：DI

- `di`：4 位 hex（2 字节 DI，驱动内部用 u16 存储）
- `decimals`：可选，小数位（影响 BCD 解码）

### 2.4 Action（动作）配置

Action 用于封装一组“写表/控制/维护命令”的操作；**Action 本身不承载协议细节配置**。

- **关键语义**：CJ/T 188 的功能码/DI/小数位等协议细节应配置在 **Action 的 `inputs(Parameter)` 上**，即每个参数都通过 `Parameter.driver_config` 指定该参数要执行的功能与编码细节。

参数级驱动配置字段（每个 input parameter）：

- **`functionCode`**：必填。写数据/写地址/机电同步等（见驱动枚举与 UI 选项）。
- **`di`**：可选。某些动作需要指定 DI（例如“写某个数据项”）；不需要 DI 的动作可省略。
- **`decimals`**：可选。数值型 BCD 编码/解码的小数位（默认策略见下表）。

驱动对某些 DI 提供特殊编码（即使 `data_type` 选择正确，也必须满足 DI 的语义约束）：

- **阀控（ValveControl）**：value 必须可转为 bool；编码为 `0x55`（开） / `0x99`（关）
- **机电同步（MotorSync）**：value 必须是数值；驱动会根据表具类型选择单位编码，并按 BCD 编码数值

## 3. 数据类型映射表（CJT188 ↔ DataType）

核心编解码逻辑位于 `@ng-gateway-southward/cjt188/src/codec.rs`（`Cjt188Codec`）。本章给出**可直接照抄**的建模规则。

### 3.1 Point（上行）推荐映射（payload → DataType）

CJ/T 188 大多数读数是 BCD：

- driver 会先 **BCD → f64**，再按 Point 的 `data_type` 强制转换，并应用 `scale`（如果配置）。
- `decimals` 控制 BCD 解码小数位（默认策略：数值型默认为 0 或 2，见下表）。

| DataType | 推荐场景 | 解码规则（实现语义） | 备注 |
| --- | --- | --- | --- |
| Float32 / Float64 | 绝大多数“流量/累计量/温度/能量”等 | BCD → f64 → 浮点（应用 `scale`） | **最推荐** |
| Int8/16/32/64 | 现场明确是有符号整数读数 | BCD → f64 → 整数（应用 `scale`） | 注意溢出 |
| UInt8/16/32/64 | 计数/序号/无符号读数 | BCD → f64 → 无符号整数（应用 `scale`） | 注意溢出 |
| Boolean | 状态位/开关量（实现为 bit0） | `payload[0] & 0x01 != 0` | |
| String | 表具返回可打印文本 | 尝试 UTF-8/ASCII；trim 末尾 0；失败回退 Binary | |
| Binary | 原始字节 | 原样 bytes | |
| Timestamp | **谨慎使用** | 当前实现把 BCD 数值当作时间戳数值并做强制转换（i64 ms） | 若设备返回 YYMMDDhhmmss 等格式，不建议用 Timestamp |

### 3.2 Action Parameter（下行）DataType 选择（写入编码）

CJ/T 188 动作写入使用 `Cjt188Codec::encode_parameter_value`，对 DataType 有明确白名单：

| Parameter.data_type | 是否支持 | 默认 decimals | 编码规则 |
| --- | --- | ---: | --- |
| Float32 / Float64 | ✅ | 2 | 数值 → BCD |
| Int16/32/64 | ✅ | 0 | 数值 → BCD |
| UInt16/32/64 | ✅ | 0 | 数值 → BCD |
| Boolean | ✅ | - | 0x00 / 0x01（部分 DI 会覆盖为 0x55/0x99） |
| String | ✅ | - | 原样 bytes（UTF-8/ASCII） |
| Int8 / UInt8 / Binary / Timestamp | ❌ | - | driver 会返回配置错误 |

::: tip 最佳实践
- **写入值域要明确**：CJ/T 188 的 Action 写入不会自动应用 `scale`；请直接写入设备期望的值，并用 `decimals` 控制 BCD 小数位。
- **DI 特殊语义优先**：阀控/机电同步等 DI 有专用编码逻辑，优先按 DI 语义建模（而不是凭感觉选 DataType）。
:::

## 4. 进阶文档

- `地址/表具类型/DI/小数位与建模建议`：见 `./address-di.md`


