---
title: 'CJT188'
description: 'NG Gateway CJ/T 188 南向驱动使用与配置：2004/2018、串口/TCP、表具地址、DI、BCD 编解码与常见动作（阀控/机电同步）。'
---

## 1. 协议介绍与常见场景

CJ/T 188 是国内水/热/燃气等表具常用规约，常见版本为 **CJ/T 188-2004** 与 **CJ/T 188-2018**。协议通常运行在 RS-485 上，也常经由串口服务器转换为 TCP。

NG Gateway CJT188 驱动用于稳定轮询表具数据，并支持部分写动作（例如阀控、机电同步等）。

## 2. 配置模型：Channel / Device / Point / Action

可配置字段由 `@ng-gateway-southward/cjt188/src/metadata.rs` 定义，对应运行时结构 `Cjt188ChannelConfig/Cjt188Device/Cjt188Point/Cjt188Parameter`。

### 2.1 Channel（通道）配置

#### 2.1.1 `version`

- V2004
- V2018

版本会影响：

- 支持的表具类型范围（2018 更广）
- 部分 DI 语义（随规约扩展）

#### 2.1.2 `connection.type`

支持：

- Serial：串口
- Tcp：TCP（串口服务器）

对应字段：

- Serial：`connection.port/baud_rate/data_bits/stop_bits/parity`
- Tcp：`connection.host/connection.port`

#### 2.1.3 高级参数

- `max_timeouts`：连续超时阈值（默认 3，超过触发重连）
- `wakeup_preamble`：唤醒前导（默认 `[0xFE,0xFE,0xFE,0xFE]`）

### 2.2 Device（设备）配置：表具地址

驱动要求 `address` 为 **14 位 hex 字符串**：

- 格式：`MeterType(2 hex) + LogicalAddress(12 hex)` = 14

示例（仅示意）：

- `10A1B2C3D4E5F6`（10 表示水表类型，后 12 位为逻辑地址）

> 详细解释见 `./address-di.md`。

### 2.3 Point（点位）配置：DI

- `di`：4 位 hex（2 字节 DI，驱动内部用 u16 存储）
- `decimals`：可选，小数位（影响 BCD 解码）

### 2.4 Action（动作）配置

Action 支持：

- `functionCode`：写数据/写地址/机电同步（等）
- 可选 `di`：用于覆盖参数 DI

驱动对某些 DI 提供特殊编码：

- **阀控**：接受 bool，编码为 0x55/0x99（见 codec 实现）
- **机电同步**：会根据表具类型选择单位编码，并按 BCD 编码数值

## 3. 数据类型映射表（CJT188 ↔ DataType）

核心编解码逻辑位于 `@ng-gateway-southward/cjt188/src/codec.rs`（`Cjt188Codec`）：

- 数值类：BCD → f64 → 按 `data_type` 强制转换并应用 `scale`
- Boolean：payload 首字节 bit0
- String：尝试 UTF-8/ASCII，失败回退为 Binary
- Binary：原样输出

## 4. 进阶文档

- `地址/表具类型/DI/小数位与建模建议`：见 `./address-di.md`


