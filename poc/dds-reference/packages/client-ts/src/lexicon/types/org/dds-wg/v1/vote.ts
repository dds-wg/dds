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
const id = 'org.dds-wg.v1.vote'

export interface Main {
  $type: 'org.dds-wg.v1.vote'
  schemaVersion?: string
  author:
    | $Typed<OrgDdsWgV1Defs.UserAgent>
    | $Typed<OrgDdsWgV1Defs.AlgorithmAgent>
    | { $type: string }
  target: ComAtprotoRepoStrongRef.Main
  value:
    | $Typed<Ordinal>
    | $Typed<Continuous>
    | $Typed<Quadratic>
    | $Typed<Approval>
    | $Typed<Ranked>
    | { $type: string }
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

/** Polis-style trinary vote: -1 disagree, 0 pass, +1 agree. */
export interface Ordinal {
  $type?: 'org.dds-wg.v1.vote#ordinal'
  value: number
}

const hashOrdinal = 'ordinal'

export function isOrdinal<V>(v: V) {
  return is$typed(v, id, hashOrdinal)
}

export function validateOrdinal<V>(v: V) {
  return validate<Ordinal & V>(v, id, hashOrdinal)
}

/** A continuous-valued vote represented as fixed-point integer in [-10000, 10000] (= [-1.0, 1.0] with 4 decimal places). ATProto lexicon does not support native floats. */
export interface Continuous {
  $type?: 'org.dds-wg.v1.vote#continuous'
  value: number
}

const hashContinuous = 'continuous'

export function isContinuous<V>(v: V) {
  return is$typed(v, id, hashContinuous)
}

export function validateContinuous<V>(v: V) {
  return validate<Continuous & V>(v, id, hashContinuous)
}

/** Quadratic voting: an integer number of credits (can be negative). */
export interface Quadratic {
  $type?: 'org.dds-wg.v1.vote#quadratic'
  credits: number
}

const hashQuadratic = 'quadratic'

export function isQuadratic<V>(v: V) {
  return is$typed(v, id, hashQuadratic)
}

export function validateQuadratic<V>(v: V) {
  return validate<Quadratic & V>(v, id, hashQuadratic)
}

/** Boolean approval vote. */
export interface Approval {
  $type?: 'org.dds-wg.v1.vote#approval'
  approve: boolean
}

const hashApproval = 'approval'

export function isApproval<V>(v: V) {
  return is$typed(v, id, hashApproval)
}

export function validateApproval<V>(v: V) {
  return validate<Approval & V>(v, id, hashApproval)
}

/** A ranked vote that orders subject URIs by preference (most preferred first). */
export interface Ranked {
  $type?: 'org.dds-wg.v1.vote#ranked'
  order: string[]
}

const hashRanked = 'ranked'

export function isRanked<V>(v: V) {
  return is$typed(v, id, hashRanked)
}

export function validateRanked<V>(v: V) {
  return validate<Ranked & V>(v, id, hashRanked)
}
