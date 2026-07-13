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
const id = 'org.dds-wg.v1.project'

export interface Main {
  $type: 'org.dds-wg.v1.project'
  schemaVersion?: string
  name: string
  description?: string
  creator:
    | $Typed<OrgDdsWgV1Defs.UserAgent>
    | $Typed<OrgDdsWgV1Defs.AlgorithmAgent>
    | { $type: string }
  phases: Phase[]
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

/** An ordered phase within a project. Phases are embedded by value in the project record. */
export interface Phase {
  $type?: 'org.dds-wg.v1.project#phase'
  name: string
  order: number
  status: 'draft' | 'active' | 'closed' | 'archived' | (string & {})
  allowedSubjects?: (
    | 'statement'
    | 'vote'
    | 'response'
    | 'proposal'
    | 'decision'
    | 'summary'
    | 'group'
    | 'metric'
    | 'classification'
    | (string & {})
  )[]
  participation?: ParticipationRule
}

const hashPhase = 'phase'

export function isPhase<V>(v: V) {
  return is$typed(v, id, hashPhase)
}

export function validatePhase<V>(v: V) {
  return validate<Phase & V>(v, id, hashPhase)
}

export interface ParticipationRule {
  $type?: 'org.dds-wg.v1.project#participationRule'
  mode:
    | 'open'
    | 'invite'
    | 'sortition'
    | 'curated'
    | 'tokenWeighted'
    | 'reputationWeighted'
    | 'algorithmicSelection'
    | (string & {})
  invitedAgents?: string[]
  selectionAlgorithm?: ComAtprotoRepoStrongRef.Main
  /** JSON-encoded quota specification. */
  quota?: string
}

const hashParticipationRule = 'participationRule'

export function isParticipationRule<V>(v: V) {
  return is$typed(v, id, hashParticipationRule)
}

export function validateParticipationRule<V>(v: V) {
  return validate<ParticipationRule & V>(v, id, hashParticipationRule)
}
