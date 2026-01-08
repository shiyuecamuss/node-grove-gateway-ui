---
title: 'EtherNet/IP Tag 建模与限制'
description: '如何正确填写 tagName，如何处理 Program scope，当前驱动对数组/结构体的限制与替代建模策略。'
---

## 1) Tag 名称怎么写

Point/Action 的 `tagName` 是 PLC 变量名（由 PLC 程序定义）。常见形式：

- **Controller Scope**：`MyTag`
- **Program Scope**：`Program:Main.MyTag`

不同工程命名风格可能不同；建议用厂商工具确认变量路径，并用一个“简单标量 Tag”先验证读写通路。

## 2) 数组 / UDT / 结构体支持现状

当前版本：

- 标量类型：支持
- UDT/结构体/数组等复杂类型：会返回 “Unsupported PlcValue type …”

推荐的替代方案：

- **标量镜像 Tag（最推荐）**：在 PLC 侧提供标量 Tag（把 UDT 成员拆成独立 Tag；把数组拆成多个标量 Tag）。
- **STRING 承载编码文本（折中）**：如果你必须传输“字节序列”，可以在 PLC 侧提供 `STRING` Tag，约定其内容为 hex/base64 文本；网关侧把点位建模为 `String`（或在北向/边缘侧再解码为 Binary）。

::: tip
如果你希望网关侧直接支持结构体/数组到 JSON/Binary 的映射，我们可以在后续版本中扩展，但需要先明确：
- UDT 字段列表与稳定的字段类型（以及版本演进策略）
- 数组长度、字节序（endianness）、以及“字节序列 → 业务语义”的解释方式（例如固定宽度、TLV、或自定义协议）
:::
