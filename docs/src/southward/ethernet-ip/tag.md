---
title: 'EtherNet/IP Tag 建模与限制'
description: '如何正确填写 tagName，如何处理 Program scope，当前驱动对数组/结构体的限制与替代建模策略。'
---

## 1) Tag 名称怎么写

Point/Action 的 `tagName` 是 PLC 变量名（由 PLC 程序定义）。常见形式：

- **Controller Scope**：`MyTag`
- **Program Scope**：`Program:Main.MyTag`

不同工程命名风格可能不同；建议用厂商工具（如 Studio 5000）确认变量路径，并用一个“简单标量 Tag”先验证读写通路。

## 2) DataType 如何选择

当前驱动的值编码基于 `rust_ethernet_ip::PlcValue`，标量类型可以与 NG 的 `DataType` 一一对应（见驱动主页映射表）。

如果你把 `data_type` 设为不匹配的类型：

- core 或 driver 会在写入时返回类型错误
- 读路径也可能无法正确解析

## 3) 数组/结构体支持现状

当前版本：

- 标量类型：支持
- 结构体/数组：返回 “Unsupported PlcValue type”

推荐的替代方案：

- 在 PLC 侧提供标量 Tag（把结构体成员拆成独立 Tag）
- 或在 PLC/OPC Server 侧提供映射 Tag（例如把数组映射为多个标量）

如果你希望网关侧直接支持结构体/数组到 JSON 的映射，我们可以在后续版本中扩展（需要明确字段/数组长度/内存布局策略）。


