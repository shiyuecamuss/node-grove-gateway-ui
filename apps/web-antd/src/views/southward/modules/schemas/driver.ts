import type { VbenFormSchema as FormSchema } from '@vben/common-ui';
import type { Nullable } from '@vben/types';

import { $t } from '@vben/locales';

import { z } from '#/adapter/form';

export interface DriverSchemas {
  channel: Node[];
  device: Node[];
  point: Node[];
  action: Node[];
}

export type Node = FieldNode | GroupNode | UnionNode;

export interface FieldNode {
  kind: 'Field';
  id: string;
  path: string; // dotted path, used as form fieldName
  label: string; // i18n key
  data_type: UiDataType;
  required: boolean;
  default_value?: any;
  // Prefer node-level order; fallback to ui.order for backward compatibility
  order?: Nullable<number>;
  ui?: UiProps;
  rules?: Rules;
  when?: When[];
}

export interface GroupNode {
  kind: 'Group';
  id: string;
  label: string;
  description?: Nullable<string>;
  collapsible: boolean;
  // Prefer node-level order for groups
  order?: Nullable<number>;
  children: Node[];
}

export interface UnionNode {
  kind: 'Union';
  // Prefer node-level order for unions
  order?: Nullable<number>;
  discriminator: string; // fieldName used as switcher
  mapping: UnionCase[];
}

export interface UnionCase {
  case_value: string;
  children: Node[];
}

export type UiDataType =
  | { items: EnumItem[]; kind: 'Enum' }
  | { items: UiDataType; kind: 'Array' }
  | { kind: 'Boolean' }
  | { kind: 'Float' }
  | { kind: 'Integer' }
  | { kind: 'Json' }
  | { kind: 'Object'; properties: Node[] }
  | { kind: 'String' };

export interface EnumItem {
  key: any;
  label: string; // i18n key or raw
}

export interface UiProps {
  placeholder?: Nullable<string>;
  format?: Nullable<string>;
  help?: Nullable<string>;
  prefix?: Nullable<string>;
  suffix?: Nullable<string>;
  col_span?: Nullable<number>;
  read_only?: Nullable<boolean>;
  disabled?: Nullable<boolean>;
}

export interface Rules {
  min?: Nullable<number>;
  max?: Nullable<number>;
  min_length?: Nullable<number>;
  max_length?: Nullable<number>;
  pattern?: Nullable<string>;
  min_items?: Nullable<number>;
  max_items?: Nullable<number>;
  unique_items?: Nullable<boolean>;
}

export interface When {
  target: string; // another fieldName
  operator:
    | 'Between'
    | 'Contains'
    | 'Eq'
    | 'Gt'
    | 'Gte'
    | 'In'
    | 'Lt'
    | 'Lte'
    | 'Neq'
    | 'NotBetween'
    | 'NotIn'
    | 'NotNull'
    | 'Prefix'
    | 'Regex'
    | 'Suffix';
  value?: Nullable<ConditionValue>;
  effect:
    | 'Disable'
    | 'Enable'
    | 'Invisible'
    | 'Optional'
    | 'Require'
    | 'Visible';
}

function getNodeOrder(node: Node): number {
  const order = (node as any).order;
  return order === null || order === undefined ? 0 : Number(order);
}

function sortNodes(nodes: Node[] | undefined): Node[] {
  if (!nodes || nodes.length === 0) return [];
  return nodes
    .map((n) => sortNode(n))
    .sort((a, b) => getNodeOrder(a) - getNodeOrder(b));
}

function sortNode(node: Node): Node {
  switch (node.kind) {
    case 'Field': {
      return node;
    }
    case 'Group': {
      return {
        ...node,
        children: sortNodes(node.children),
      };
    }
    case 'Union': {
      return {
        ...node,
        mapping: node.mapping.map((m) => ({
          ...m,
          children: sortNodes(m.children),
        })),
      };
    }
  }
}

export function sortDriverSchemas(schemas: DriverSchemas): DriverSchemas {
  return {
    channel: sortNodes(schemas.channel),
    device: sortNodes(schemas.device),
    point: sortNodes(schemas.point),
    action: sortNodes(schemas.action),
  };
}

// serde enum is represented like { StringValue: "..." } etc.
export type ConditionValue =
  | { BoolArray: boolean[] }
  | { BoolValue: boolean }
  | { FloatArray: number[] }
  | { FloatValue: number }
  | { IntArray: number[] }
  | { IntValue: number }
  | { StringArray: string[] }
  | { StringValue: string };

function extractConditionPrimitive(val?: ConditionValue | null): any {
  if (!val) return undefined;
  const entry = Object.entries(val)[0] as [string, any];
  return entry ? entry[1] : undefined;
}

// ---------- Mapper: DriverSchemas(Channel) -> Vben FormSchema[] ----------

export function mapChannelSchemasToForm(schemas: DriverSchemas): FormSchema[] {
  const result: FormSchema[] = [];
  const flattened = flattenForFormOrdering(
    schemas.channel ?? [],
    undefined,
  ).sort((a, b) => getNodeOrder(a.node) - getNodeOrder(b.node));
  for (const item of flattened) {
    result.push(...mapNode(item.node, item.discriminator));
  }
  return result;
}

type DiscriminatorGuard = { equals: string; field: string };
type FlattenItem = { discriminator?: DiscriminatorGuard; node: Node };

function flattenForFormOrdering(
  nodes: Node[],
  discriminator?: DiscriminatorGuard,
): FlattenItem[] {
  const out: FlattenItem[] = [];
  for (const node of nodes) {
    switch (node.kind) {
      case 'Field': {
        out.push({ discriminator, node });
        break;
      }
      case 'Group': {
        out.push({ discriminator, node });
        break;
      }
      case 'Union': {
        for (const c of node.mapping) {
          const next: DiscriminatorGuard = {
            equals: c.case_value,
            field: node.discriminator,
          };
          for (const child of c.children ?? []) {
            out.push(...flattenForFormOrdering([child], next));
          }
        }
        break;
      }
    }
  }
  return out;
}

function mapNode(
  node: Node,
  discriminator?: { equals: string; field: string },
): FormSchema[] {
  switch (node.kind) {
    case 'Field': {
      return [mapField(node, discriminator)];
    }
    case 'Group': {
      const divider: FormSchema = {
        component: 'Divider',
        fieldName: `__divider__${node.id}`,
        label: $t(node.label),
      };
      const children = node.children.flatMap((n) => mapNode(n, discriminator));
      return [divider, ...children];
    }
    case 'Union': {
      // For each case, show children when discriminator === case_value
      const acc: FormSchema[] = [];
      for (const c of node.mapping) {
        const nextDiscriminator = {
          field: node.discriminator,
          equals: c.case_value,
        };
        acc.push(...c.children.flatMap((n) => mapNode(n, nextDiscriminator)));
      }
      return acc;
    }
  }
}

function mapField(
  node: FieldNode,
  discriminator?: { equals: string; field: string },
): FormSchema {
  const base: FormSchema = {
    component: resolveComponent(node),
    fieldName: node.path,
    label: $t(node.label),
    defaultValue: node.default_value ?? undefined,
    formItemClass: `col-span-${node.ui?.col_span ?? 2}`,
  };

  // ui props
  if (node.ui?.placeholder) {
    const prev = (base.componentProps ?? {}) as Record<string, any>;
    base.componentProps = { ...prev, placeholder: $t(node.ui.placeholder) };
  }
  if (node.ui?.prefix) {
    const prev = (base.componentProps ?? {}) as Record<string, any>;
    base.componentProps = { ...prev, prefix: node.ui.prefix } as any;
  }
  if (node.ui?.suffix) {
    const prev = (base.componentProps ?? {}) as Record<string, any>;
    base.componentProps = { ...prev, suffix: node.ui.suffix } as any;
  }
  if (
    node.ui &&
    node.ui.read_only !== null &&
    node.ui.read_only !== undefined
  ) {
    const prev = (base.componentProps ?? {}) as Record<string, any>;
    base.componentProps = { ...prev, readonly: !!node.ui.read_only } as any;
  }
  if (node.ui && node.ui.disabled !== null && node.ui.disabled !== undefined) {
    const prev = (base.componentProps ?? {}) as Record<string, any>;
    base.componentProps = { ...prev, disabled: !!node.ui.disabled } as any;
  }

  // component prop hints (min/max, maxLength, etc.)
  if (node.data_type.kind === 'Integer' || node.data_type.kind === 'Float') {
    const cp: any = { ...((base.componentProps ?? {}) as any) };
    if (node.rules?.min !== null && node.rules?.min !== undefined)
      cp.min = node.rules?.min;
    if (node.rules?.max !== null && node.rules?.max !== undefined)
      cp.max = node.rules?.max;
    base.componentProps = cp;
  }

  if (node.data_type.kind === 'String') {
    const cp: any = { ...((base.componentProps ?? {}) as any) };
    if (node.rules?.max_length !== null && node.rules?.max_length !== undefined)
      cp.maxLength = node.rules?.max_length;
    base.componentProps = cp;
  }

  if (node.data_type.kind === 'Enum') {
    const prev = (base.componentProps ?? {}) as Record<string, any>;
    base.componentProps = {
      ...prev,
      options: node.data_type.items.map((it) => ({
        label: $t(it.label),
        value: it.key,
      })),
      allowClear: true,
    } as any;
  }

  // base rules using z or tokens
  base.rules = buildRuleForNode(node, node.required);

  // when conditions: implement Visible/Require/Optional/Enable/Disable support
  if ((node.when && node.when.length > 0) || discriminator) {
    base.dependencies = base.dependencies || ({ triggerFields: [] } as any);
    const dep: any = base.dependencies;
    const targets = new Set<string>();
    if (discriminator) targets.add(discriminator.field);
    for (const w of node.when || []) targets.add(w.target);
    dep.triggerFields = [...targets];
    dep.if = (values: Record<string, any>) => {
      let visible = true;
      if (discriminator) {
        visible =
          visible && values[discriminator.field] === discriminator.equals;
      }
      if (node.when) {
        for (const w of node.when) {
          const val = values[w.target];
          const target = extractConditionPrimitive(w.value);
          if (!evalOperator(w.operator, val, target)) continue; // only apply when matched
          if (w.effect === 'Invisible') visible = false;
          if (w.effect === 'Visible') visible = visible && true;
        }
      }
      return visible;
    };
    dep.rules = (values: Record<string, any>) => {
      // if any Require matched, mark required; if Optional matched, unset
      let required = node.required;
      if (node.when) {
        for (const w of node.when) {
          const val = values[w.target];
          const target = extractConditionPrimitive(w.value);
          if (evalOperator(w.operator, val, target)) {
            if (w.effect === 'Require') required = true;
            if (w.effect === 'Optional') required = false;
          }
        }
      }
      return buildRuleForNode(node, required);
    };
    dep.disabled = (values: Record<string, any>) => {
      let disabled = !!node.ui?.disabled;
      if (node.when) {
        for (const w of node.when) {
          const val = values[w.target];
          const target = extractConditionPrimitive(w.value);
          if (evalOperator(w.operator, val, target)) {
            if (w.effect === 'Disable') disabled = true;
            if (w.effect === 'Enable') disabled = false;
          }
        }
      }
      return disabled;
    };
  }

  return base;
}

const COMPONENT_BY_KIND: Record<UiDataType['kind'], any> = {
  Array: 'InputTextArea',
  Boolean: 'Switch',
  Enum: 'Select',
  Float: 'InputNumber',
  Integer: 'InputNumber',
  Json: 'InputTextArea',
  Object: 'InputTextArea',
  String: 'Input',
};

function resolveComponent(node: FieldNode): any {
  return COMPONENT_BY_KIND[node.data_type.kind] ?? 'Input';
}

function evalOperator(op: When['operator'], left: any, right: any): boolean {
  switch (op) {
    case 'Between': {
      return (
        Array.isArray(right) &&
        right.length >= 2 &&
        Number(left) >= Number(right[0]) &&
        Number(left) <= Number(right[1])
      );
    }
    case 'Contains': {
      if (Array.isArray(left)) return left.includes(right);
      if (typeof left === 'string') return left.includes(String(right));
      return false;
    }
    case 'Eq': {
      return left === right;
    }
    case 'Gt': {
      return Number(left) > Number(right);
    }
    case 'Gte': {
      return Number(left) >= Number(right);
    }
    case 'Lt': {
      return Number(left) < Number(right);
    }
    case 'Lte': {
      return Number(left) <= Number(right);
    }
    case 'Neq': {
      return left !== right;
    }
    case 'NotBetween': {
      return (
        Array.isArray(right) &&
        right.length >= 2 &&
        (Number(left) < Number(right[0]) || Number(left) > Number(right[1]))
      );
    }
    case 'NotIn': {
      return Array.isArray(right) && !right.includes(left);
    }
    case 'NotNull': {
      return left !== null && left !== undefined;
    }
    case 'Prefix': {
      return typeof left === 'string' && String(left).startsWith(String(right));
    }
    case 'Regex': {
      try {
        const re = new RegExp(String(right));
        return re.test(String(left));
      } catch {
        return false;
      }
    }
    case 'In': {
      return Array.isArray(right) && right.includes(left);
    }
    case 'Suffix': {
      return typeof left === 'string' && String(left).endsWith(String(right));
    }
  }
}

// ---------------- zod rule builders ----------------
function buildRuleForNode(node: FieldNode, required: boolean) {
  const schema = buildZodSchema(node.data_type, node.rules);
  if (!schema) return required ? 'required' : null;
  return required ? schema : schema.optional();
}

type ZodBuilder = (dataType: UiDataType, rules?: Rules) => any;

const ZOD_BUILDERS: Partial<Record<UiDataType['kind'], ZodBuilder>> = {
  Array: (dataType, rules) => {
    const dt = dataType as Extract<UiDataType, { kind: 'Array' }>;
    const inner = buildZodSchema(dt.items, rules) ?? z.any();
    let s = z.array(inner);
    if (rules?.min_items !== null && rules?.min_items !== undefined)
      s = s.min(rules.min_items);
    if (rules?.max_items !== null && rules?.max_items !== undefined)
      s = s.max(rules.max_items);
    return s;
  },
  Boolean: () => z.boolean(),
  Enum: () => null,
  Float: (_dataType, rules) => {
    let s = z.number();
    if (rules?.min !== null && rules?.min !== undefined) s = s.min(rules.min);
    if (rules?.max !== null && rules?.max !== undefined) s = s.max(rules.max);
    return s;
  },
  Integer: (_dataType, rules) => {
    let s = z.number();
    if (rules?.min !== null && rules?.min !== undefined) s = s.min(rules.min);
    if (rules?.max !== null && rules?.max !== undefined) s = s.max(rules.max);
    return s;
  },
  Json: () => null,
  Object: () => null,
  String: (_dataType, rules) => {
    let s = z.string();
    if (rules?.min_length !== null && rules?.min_length !== undefined)
      s = s.min(rules.min_length);
    if (rules?.max_length !== null && rules?.max_length !== undefined)
      s = s.max(rules.max_length);
    if (rules?.pattern) {
      try {
        s = s.regex(new RegExp(rules.pattern));
      } catch {}
    }
    return s;
  },
};

function buildZodSchema(dataType: UiDataType, rules?: Rules): any {
  const builder = ZOD_BUILDERS[dataType.kind];
  if (!builder) return null;
  return builder(dataType as any, rules);
}
