---
title: 'DLT645'
description: 'NG Gateway DL/T 645 南向驱动使用与配置：645-1997/2007、串口/TCP、表地址/密码、DI、BCD 编解码与最佳实践。'
---

## 1. 协议介绍与常见场景

DL/T 645 是国内电能表/多功能表常用规约，典型版本为 **DL/T 645-1997** 与 **DL/T 645-2007**（现场最常见）。协议常运行在 RS-485 上，也常通过串口服务器转换为 TCP。

NG Gateway DLT645 驱动的目标是：在一条总线上稳定轮询多个电表，并把 DI 对应的读数解码为统一的 `DataType/NGValue`。

## 2. 配置模型：Channel / Device / Point / Action

可配置字段由 `@ng-gateway-southward/dlt645/src/metadata.rs` 定义，对应运行时结构 `Dl645ChannelConfig/Dl645Device/Dl645Point/Dl645Parameter`。

### 2.1 Channel（通道）配置

一条 RS-485 总线（或一个 TCP 串口服务器连接）建模为一个 Channel。

#### 2.1.1 `version`（协议版本）

- DL/T 645-1997
- DL/T 645-2007

版本会影响：

- DI 长度（1997：2 字节；2007：4 字节）
- 控制码与部分语义

#### 2.1.2 `connection.kind`（连接方式）

- serial：串口/RS-485
- tcp：TCP（串口服务器）

串口参数（serial）：

- `connection.port` / `baudRate` / `dataBits` / `stopBits` / `parity`

TCP 参数（tcp）：

- `connection.host` / `connection.port`

#### 2.1.3 高级参数

- `maxTimeouts`：连续超时超过该值触发重连（默认 3）
- `wakeupPreamble`：发送前置唤醒码（默认 `[0xFE,0xFE,0xFE,0xFE]`）

**最佳实践**：

- RS-485 场景下，前置唤醒码是常见兼容策略；如现场设备明确不需要，可配置为空数组以减少带宽。
- 超时与重连：不要把 `maxTimeouts` 设为 1（容易抖动重连），默认 3 通常更稳。

### 2.2 Device（设备）配置

每个 Device 对应一块电表：

- `address`：电表地址（12 位数字，示例 `123456789012`）
- `password`：密码（默认 `00000000`，一般为 hex 字符串）
- `operatorCode`：操作员代码（可选）

> 地址/DI 的详细解释见 `./address-di.md`。

### 2.3 Point（点位）配置

- `di`：数据标识（2007 通常为 8 位 hex；1997 会用低 16-bit）
- `decimals`：小数位（可选，用于 BCD 解码）

Point 的 `data_type` 会影响 BCD 解码后的强制类型转换与 `scale`。

### 2.4 Action（动作）配置

Action 用于写表、校时、冻结、清零等：

- `functionCode`：写数据/广播校时/写地址/冻结/更改波特率/清零等
- `di`：可选（某些动作需要）
- `decimals`：可选

## 3. 数据类型映射表（DLT645 ↔ DataType）

核心编解码逻辑位于 `@ng-gateway-southward/dlt645/src/codec.rs`（`Dl645Codec`）：

- 数值类点位：使用 BCD 解码为 f64，再按 Point 的 `data_type` 强制转换，并应用 `scale`
- Boolean：取 payload 首字节的 bit0
- String：尝试 UTF-8/ASCII，失败则回退为 Binary
- Binary：原样输出

## 4. 进阶文档

- `表地址/DI/小数位与建模建议`：见 `./address-di.md`


