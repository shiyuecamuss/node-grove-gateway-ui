import type { VbenFormSchema as FormSchema } from '@vben/common-ui';
import type { Nullable } from '@vben/types';

import type { CustomRenderType } from '@vben-core/shadcn-ui';

import type { UiText } from './i18n';

import { get, isEqual } from '@vben/utils';

import { z } from '#/adapter/form';

import { resolveUiText } from './i18n';
import { isNullOrUndefined } from './index';

export interface DriverSchemas {
  channel: Node[];
  device: Node[];
  point: Node[];
  action: Node[];
}

export type Node = FieldNode | GroupNode | UnionNode;

export interface FieldNode {
  kind: 'Field';
  path: string; // dotted path, used as form fieldName
  label: UiText; // tagged union from backend
  data_type: UiDataType;
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
  label: UiText;
  description?: Nullable<UiText>;
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
  case_value: any;
  children: Node[];
}

export type UiDataType =
  | { items: EnumItem[]; kind: 'Enum' }
  | { items: UiDataType; kind: 'Array' }
  | { kind: 'Boolean' }
  | { kind: 'Float' }
  | { kind: 'Integer' }
  | { kind: 'String' };

export interface EnumItem {
  key: any;
  label: UiText;
}

export interface UiProps {
  placeholder?: Nullable<UiText>;
  help?: Nullable<UiText>;
  prefix?: Nullable<string>;
  suffix?: Nullable<string>;
  col_span?: Nullable<number>;
  read_only?: Nullable<boolean>;
  disabled?: Nullable<boolean>;
}

// RuleValue allows either a raw primitive value or an object with value and message
export type RuleValue<T> = T | { message?: UiText; value: T };

export interface Rules {
  // Prefer using required in rules; falls back to Field.required if unset
  required?: Nullable<RuleValue<boolean>>;

  // Numeric bounds (for Integer/Float)
  min?: Nullable<RuleValue<number>>;
  max?: Nullable<RuleValue<number>>;

  // String length bounds
  min_length?: Nullable<RuleValue<number>>;
  max_length?: Nullable<RuleValue<number>>;

  // Array item count bounds
  min_items?: Nullable<RuleValue<number>>;
  max_items?: Nullable<RuleValue<number>>;

  // Regex pattern for strings
  pattern?: Nullable<RuleValue<string>>;
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
  value?: Nullable<any>;
  effect:
    | 'Disable'
    | 'Enable'
    | 'Invisible'
    | 'Optional'
    | 'Require'
    | 'Visible';
}

function getNodeOrder(node: Node): number {
  return isNullOrUndefined(node.order) ? 0 : Number(node.order);
}

function sortNodes(nodes: Node[]): Node[] {
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

// ---------- Mapper: DriverSchemas(Channel) -> Vben FormSchema[] ----------

export function mapChannelSchemasToForm(schemas: DriverSchemas): FormSchema[] {
  const result: FormSchema[] = [];
  const sorted = sortNodes(schemas.channel);
  for (const item of sorted) {
    result.push(...mapNode(item, undefined));
  }
  return result;
}

function mapNode(
  node: Node,
  discriminator?: { equals: any; field: string },
): FormSchema[] {
  switch (node.kind) {
    case 'Field': {
      return [mapField(node, discriminator)];
    }
    case 'Group': {
      const divider: FormSchema = {
        component: 'Divider',
        fieldName: `__divider__${node.id}`,
        hideLabel: true,
        renderComponentContent() {
          return {
            default: () => resolveUiText(node.label),
          };
        },
        formItemClass: `col-span-2`,
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
  discriminator?: { equals: any; field: string },
): FormSchema {
  const component = resolveComponent(node);
  const colSpan = node.ui?.col_span ?? 2;
  const controlClass = component === 'Switch' ? '' : 'w-full';
  const base: FormSchema = {
    component,
    fieldName: node.path,
    label: resolveUiText(node.label),
    defaultValue: node.default_value ?? undefined,
    formItemClass: `col-span-${colSpan}`,
    controlClass,
  };

  // ui props
  if (node.ui?.placeholder) {
    const prev = (base.componentProps ?? {}) as Record<string, any>;
    base.componentProps = {
      ...prev,
      placeholder: resolveUiText(node.ui.placeholder),
    };
  }
  if (node.ui?.prefix) {
    const prev = (base.componentProps ?? {}) as Record<string, any>;
    base.componentProps = { ...prev, prefix: node.ui.prefix } as any;
  }
  if (node.ui?.suffix) {
    const prev = (base.componentProps ?? {}) as Record<string, any>;
    base.componentProps = { ...prev, suffix: node.ui.suffix } as any;
  }
  if (node.ui && !isNullOrUndefined(node.ui.read_only)) {
    const prev = (base.componentProps ?? {}) as Record<string, any>;
    base.componentProps = { ...prev, readonly: !!node.ui.read_only } as any;
  }
  if (node.ui && !isNullOrUndefined(node.ui.disabled)) {
    const prev = (base.componentProps ?? {}) as Record<string, any>;
    base.componentProps = { ...prev, disabled: !!node.ui.disabled } as any;
  }
  if (node.ui?.help !== null && node.ui?.help !== undefined) {
    base.help = resolveUiText(node.ui.help) as CustomRenderType;
  }

  // component prop hints (min/max, maxLength, etc.)
  if (node.data_type.kind === 'Integer' || node.data_type.kind === 'Float') {
    const cp: any = { ...((base.componentProps ?? {}) as any) };
    const rvMin = extractRuleValue<number>(node.rules?.min);
    const rvMax = extractRuleValue<number>(node.rules?.max);
    if (!isNullOrUndefined(rvMin.value)) cp.min = rvMin.value;
    if (!isNullOrUndefined(rvMax.value)) cp.max = rvMax.value;
    base.componentProps = cp;
  }

  if (node.data_type.kind === 'String') {
    const cp: any = { ...((base.componentProps ?? {}) as any) };
    const rvMaxLen = extractRuleValue<number>(node.rules?.max_length);
    if (!isNullOrUndefined(rvMaxLen.value)) cp.maxLength = rvMaxLen.value;
    base.componentProps = cp;
  }

  if (node.data_type.kind === 'Enum') {
    const prev = (base.componentProps ?? {}) as Record<string, any>;
    base.componentProps = {
      ...prev,
      options: node.data_type.items.map((it) => ({
        label: resolveUiText(it.label),
        value: it.key,
      })),
      allowClear: true,
    } as any;
  }

  // base rules using z or tokens
  base.rules = buildRuleForNode(node);

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
        visible = isEqual(
          get(values, discriminator.field),
          discriminator.equals,
        );
      }
      if (node.when) {
        for (const w of node.when) {
          const val = get(values, w.target);
          if (!evalOperator(w.operator, val, w.value)) continue; // only apply when matched
          if (w.effect === 'Invisible') visible = false;
          if (w.effect === 'Visible') visible = visible && true;
        }
      }
      return visible;
    };
    dep.rules = (values: Record<string, any>) => {
      // start from rules.required; if any Require matched, mark required; if Optional matched, unset
      let required = !!extractRuleValue<boolean>(node.rules?.required).value;
      if (node.when) {
        for (const w of node.when) {
          const val = get(values, w.target);
          if (evalOperator(w.operator, val, w.value)) {
            if (w.effect === 'Require') required = true;
            if (w.effect === 'Optional') required = false;
          }
        }
      }
      // when effects should override rule-level required
      return buildRuleForNode(node, required);
    };
    dep.disabled = (values: Record<string, any>) => {
      let disabled = !!node.ui?.disabled;
      if (node.when) {
        for (const w of node.when) {
          const val = get(values, w.target);
          if (evalOperator(w.operator, val, w.value)) {
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
function extractRuleValue<T>(
  rv?: null | Nullable<RuleValue<T>>,
):
  | { message?: string; value: T | undefined }
  | { message?: string; value: undefined } {
  if (rv === null || rv === undefined) return { value: undefined } as any;
  if (typeof rv === 'object' && rv !== null && 'value' in rv) {
    return {
      value: (rv as any).value as T,
      message: (rv as any).message
        ? String(resolveUiText((rv as any).message))
        : undefined,
    };
  }
  return { value: rv as any };
}

function buildRuleForNode(node: FieldNode, requiredOverride?: boolean) {
  const schema = buildZodSchema(node.data_type, node.rules);
  const rvRequired = extractRuleValue<boolean>(node.rules?.required);
  const required =
    typeof requiredOverride === 'boolean'
      ? requiredOverride
      : !!rvRequired.value;

  if (!schema) return required ? 'required' : null;

  if (required && node.data_type.kind === 'String') {
    const msg = rvRequired.message;
    // if no explicit min_length, enforce non-empty
    const rvMinLen = extractRuleValue<number>(node.rules?.min_length);
    if (isNullOrUndefined(rvMinLen.value)) {
      return (schema as any).min(1, { message: msg } as any);
    }
  }
  return required ? schema : (schema as any).optional();
}

type ZodBuilder = (dataType: UiDataType, rules?: Rules) => any;

const ZOD_BUILDERS: Partial<Record<UiDataType['kind'], ZodBuilder>> = {
  Array: (dataType, rules) => {
    const dt = dataType as Extract<UiDataType, { kind: 'Array' }>;
    const inner = buildZodSchema(dt.items, rules) ?? z.any();
    let s = z.array(inner);
    const rvMinItems = extractRuleValue<number>(rules?.min_items);
    const rvMaxItems = extractRuleValue<number>(rules?.max_items);
    if (!isNullOrUndefined(rvMinItems.value))
      s = (s as any).min(Number(rvMinItems.value), {
        message: rvMinItems.message,
      } as any);
    if (!isNullOrUndefined(rvMaxItems.value))
      s = (s as any).max(Number(rvMaxItems.value), {
        message: rvMaxItems.message,
      } as any);
    return s;
  },
  Boolean: () => z.boolean(),
  Enum: (dataType) => {
    const dt = dataType as Extract<UiDataType, { kind: 'Enum' }>;
    const literals = dt.items.map((it) => z.literal(it.key as any));
    return literals.length > 0 ? (z.union(literals as any) as any) : null;
  },
  Float: (_dataType, rules) => {
    let s = z.number();
    const rvMin = extractRuleValue<number>(rules?.min);
    const rvMax = extractRuleValue<number>(rules?.max);
    if (!isNullOrUndefined(rvMin.value))
      s = (s as any).min(Number(rvMin.value), {
        message: rvMin.message,
      } as any);
    if (!isNullOrUndefined(rvMax.value))
      s = (s as any).max(Number(rvMax.value), {
        message: rvMax.message,
      } as any);
    return s;
  },
  Integer: (_dataType, rules) => {
    let s = z.number().int();
    const rvMin = extractRuleValue<number>(rules?.min);
    const rvMax = extractRuleValue<number>(rules?.max);
    if (!isNullOrUndefined(rvMin.value))
      s = (s as any).min(Number(rvMin.value), {
        message: rvMin.message,
      } as any);
    if (!isNullOrUndefined(rvMax.value))
      s = (s as any).max(Number(rvMax.value), {
        message: rvMax.message,
      } as any);
    return s;
  },
  String: (_dataType, rules) => {
    let s = z.string();
    const rvMinLen = extractRuleValue<number>(rules?.min_length);
    const rvMaxLen = extractRuleValue<number>(rules?.max_length);
    const rvPattern = extractRuleValue<string>(rules?.pattern);
    if (!isNullOrUndefined(rvMinLen.value))
      s = (s as any).min(Number(rvMinLen.value), {
        message: rvMinLen.message,
      } as any);
    if (!isNullOrUndefined(rvMaxLen.value))
      s = (s as any).max(Number(rvMaxLen.value), {
        message: rvMaxLen.message,
      } as any);
    if (!isNullOrUndefined(rvPattern.value)) {
      try {
        s = (s as any).regex(new RegExp(String(rvPattern.value)), {
          message: rvPattern.message,
        } as any);
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
