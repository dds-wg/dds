/**
 * GENERATED CODE - DO NOT MODIFY
 */
import { type ValidationResult, BlobRef } from '@atproto/lexicon'
import { CID } from 'multiformats/cid'
import { validate as _validate } from '../../../../lexicons.js'
import {
  type $Typed,
  is$typed as _is$typed,
  type OmitKey,
} from '../../../../util.js'
import type * as OrgDdsWgV1Defs from './defs.js'
import type * as ComAtprotoRepoStrongRef from '../../../com/atproto/repo/strongRef.js'

const is$typed = _is$typed,
  validate = _validate
const id = 'org.dds-wg.v1.metric'

export interface Main {
  $type: 'org.dds-wg.v1.metric'
  schemaVersion?: string
  name: string
  creator:
    | $Typed<OrgDdsWgV1Defs.UserAgent>
    | $Typed<OrgDdsWgV1Defs.AlgorithmAgent>
    | { $type: string }
  /** Free-form discriminator like 'groupInformedConsensus', 'agreeCount', etc. */
  metricType: string
  value?:
    | $Typed<IntegerValue>
    | $Typed<DecimalValue>
    | $Typed<StringValue>
    | $Typed<BooleanValue>
    | $Typed<JsonValue>
    | { $type: string }
  subject: ComAtprotoRepoStrongRef.Main
  step?: OrgDdsWgV1Defs.ProjectStepRef
  createdAt: string
  [k: string]: unknown
}

const hashMain = 'main'

export function isMain<V>(v: V) {
  return is$typed(v, id, hashMain)
}

export function validateMain<V>(v: V) {
  return validate<Main & V>(v, id, hashMain, true)
}

export {
  type Main as Record,
  isMain as isRecord,
  validateMain as validateRecord,
}

/** An exact integer metric value. */
export interface IntegerValue {
  $type?: 'org.dds-wg.v1.metric#integerValue'
  integer: number
}

const hashIntegerValue = 'integerValue'

export function isIntegerValue<V>(v: V) {
  return is$typed(v, id, hashIntegerValue)
}

export function validateIntegerValue<V>(v: V) {
  return validate<IntegerValue & V>(v, id, hashIntegerValue)
}

/** A decimal metric value. AT Protocol has no native float type, so this is encoded as a JSON-number string (e.g. '0.4231'). */
export interface DecimalValue {
  $type?: 'org.dds-wg.v1.metric#decimalValue'
  decimal: string
}

const hashDecimalValue = 'decimalValue'

export function isDecimalValue<V>(v: V) {
  return is$typed(v, id, hashDecimalValue)
}

export function validateDecimalValue<V>(v: V) {
  return validate<DecimalValue & V>(v, id, hashDecimalValue)
}

export interface StringValue {
  $type?: 'org.dds-wg.v1.metric#stringValue'
  string: string
}

const hashStringValue = 'stringValue'

export function isStringValue<V>(v: V) {
  return is$typed(v, id, hashStringValue)
}

export function validateStringValue<V>(v: V) {
  return validate<StringValue & V>(v, id, hashStringValue)
}

export interface BooleanValue {
  $type?: 'org.dds-wg.v1.metric#booleanValue'
  boolean: boolean
}

const hashBooleanValue = 'booleanValue'

export function isBooleanValue<V>(v: V) {
  return is$typed(v, id, hashBooleanValue)
}

export function validateBooleanValue<V>(v: V) {
  return validate<BooleanValue & V>(v, id, hashBooleanValue)
}

/** Arbitrary JSON payload, serialized as a string. */
export interface JsonValue {
  $type?: 'org.dds-wg.v1.metric#jsonValue'
  json: string
}

const hashJsonValue = 'jsonValue'

export function isJsonValue<V>(v: V) {
  return is$typed(v, id, hashJsonValue)
}

export function validateJsonValue<V>(v: V) {
  return validate<JsonValue & V>(v, id, hashJsonValue)
}
