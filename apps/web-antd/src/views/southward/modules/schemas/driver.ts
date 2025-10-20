import type { VbenFormSchema as FormSchema } from '@vben/common-ui';

import { $t } from '@vben/locales';

// ---------- Types aligned with backend DriverSchemas ----------

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
  format?: null | string;
  ui?: UiProps;
  rules?: Rules;
  when?: When[];
}

export interface GroupNode {
  kind: 'Group';
  id: string;
  label: string;
  description?: null | string;
  collapsible: boolean;
  children: Node[];
}

export interface UnionNode {
  kind: 'Union';
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
  widget?: null | string;
  placeholder?: null | string;
  help?: null | string;
  prefix?: null | string;
  suffix?: null | string;
  col_span?: null | number;
  order?: null | number;
  read_only?: boolean | null;
  disabled?: boolean | null;
}

export interface Rules {
  min?: null | number;
  max?: null | number;
  min_length?: null | number;
  max_length?: null | number;
  pattern?: null | string;
  min_items?: null | number;
  max_items?: null | number;
  unique_items?: boolean | null;
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
  value?: ConditionValue | null;
  effect:
    | 'Disable'
    | 'Enable'
    | 'Invisible'
    | 'Optional'
    | 'Require'
    | 'Visible';
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
  for (const node of schemas.channel ?? []) {
    result.push(...mapNode(node, undefined));
  }
  return result;
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
  };

  // ui props
  if (node.ui?.placeholder) {
    const prev = (base.componentProps ?? {}) as Record<string, any>;
    base.componentProps = { ...prev, placeholder: $t(node.ui.placeholder) };
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

  // required & number ranges
  if (node.required) base.rules = 'required';
  if (node.data_type.kind === 'Integer' || node.data_type.kind === 'Float') {
    const cp: any = { ...((base.componentProps ?? {}) as any) };
    if (node.rules?.min !== null && node.rules?.min !== undefined)
      cp.min = node.rules?.min;
    if (node.rules?.max !== null && node.rules?.max !== undefined)
      cp.max = node.rules?.max;
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

  // when conditions: implement Visible/Require minimal support
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
      return required ? 'required' : null;
    };
  }

  return base;
}

function resolveComponent(node: FieldNode): any {
  switch (node.data_type.kind) {
    case 'Array': {
      return 'Input';
    }
    case 'Boolean': {
      return 'Switch';
    }
    case 'Enum': {
      return 'Select';
    }
    case 'Float': {
      return 'InputNumber';
    }
    case 'Integer': {
      return 'InputNumber';
    }
    case 'Json': {
      return 'Input';
    }
    case 'Object': {
      return 'Input';
    }
    case 'String': {
      return 'Input';
    }
    default: {
      return 'Input';
    }
  }
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

// ---------- Helpers ----------

export function assignByPath(target: any, path: string, value: any) {
  const segments: string[] = path.split('.');
  let cur: Record<string, any> = target as Record<string, any>;
  for (let i = 0; i < segments.length - 1; i++) {
    const seg = segments[i] as string;
    if (!cur[seg] || typeof cur[seg] !== 'object') cur[seg] = {};
    cur = cur[seg] as Record<string, any>;
  }
  const last = segments[segments.length - 1] as string;
  cur[last] = value;
}
