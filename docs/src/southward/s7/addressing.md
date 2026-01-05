---
title: 'S7 地址语法与示例'
description: '详解 NG Gateway S7 驱动支持的地址表达式：DB/I/Q/M/T/C/DI/L/DP 区，类型前缀与 bit/byte 定位规则。'
---

## 地址表达式总览

S7 驱动的地址解析逻辑见 `@ng-gateway-southward/s7/src/protocol/frame/addr.rs`。

核心规则：

- 地址不区分大小写（内部会转为大写处理）
- 地址由 **内存区** + **类型/偏移** 构成
- **Bit 访问** 必须包含 `.bit`（例如 `DB1.BIT0.2` 或 `I0.0`）
- 非 Bit 类型不允许带小数点

## 1) DB 区（数据块）

格式：

- `DB{db_number}.{TYPE}{byte_offset}`（非 bit）
- `DB{db_number}.BIT{byte_offset}.{bit_index}`（bit）

示例：

- `DB1.BYTE0`
- `DB1.WORD2`
- `DB1.DWORD4`
- `DB1.DINT8`
- `DB1.REAL12`
- `DB1.STRING20`
- `DB1.WSTRING30`
- `DB1.BIT0.2`（DB1 第 0 字节第 2 位）

## 2) I/Q/M 区（输入/输出/中间寄存器）

格式（推荐显式类型）：

- `I{TYPE}{byte_offset}` 或 bit 形式 `I{byte}.{bit}`
- `Q{TYPE}{byte_offset}` 或 bit 形式 `Q{byte}.{bit}`
- `M{TYPE}{byte_offset}` 或 bit 形式 `M{byte}.{bit}`

示例：

- `I0.0`（Bit）
- `Q0.1`（Bit）
- `M10.3`（Bit）
- `IB0` / `IWORD2` / `IDINT4` / `IREAL8`
- `QB0` / `QW2` / `QD4`
- `MB10` / `MW12` / `MD14`

> 注意：如果不写 TYPE 且没有小数点，驱动会把它按 BYTE 解析（例如 `M10` 等价于 `MB10`）。

## 3) 其它区：DI/L/DP/T/C

驱动还支持一些扩展区域（用于特定 CPU/地址体系）：

- `DI...`、`L...`、`DP...`：按 `parse_di_area/parse_l_area/parse_dp_area` 解析
- `T{index}`：Timer
- `C{index}`：Counter

示例：

- `T10`
- `C5`

## 4) 类型前缀（Transport Size）清单

驱动支持长/短 token（最长优先匹配，避免前缀冲突），常见如下：

- Bit：`BIT` / `X`
- Byte：`BYTE` / `B`
- Word：`WORD` / `W`
- DWord：`DWORD` / `DW`
- Int16：`INT` / `I`
- DInt：`DINT` / `DI`
- Real：`REAL` / `R`
- Char：`CHAR` / `C`
- String：`STRING` / `S`
- WString：`WSTRING` / `WS`
- Date：`DATE`
- DateTime：`DATETIME` / `DT`
- DateTimeLong：`DATETIMELONG` / `DTL`
- TimeOfDay：`TOD`
- Time：`TIME` / `T`
- S5Time：`S5TIME` / `ST`

## 5) DataType 的推荐搭配

建议遵循“地址类型语义一致”原则：

- `REAL` → `Float32`
- `DINT` → `Int32`
- `DWORD` → `UInt32`
- `INT` → `Int16`
- `WORD` → `UInt16`
- `BIT`/`.bit` → `Boolean`
- `STRING/WSTRING` → `String`
- `DATE/DATETIME/TIME` → `Timestamp`（或 `String`）


