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
const id = 'org.dds-wg.v1.event'

export interface Main {
  $type: 'org.dds-wg.v1.event'
  schemaVersion?: string
  type: string
  actor:
    | $Typed<OrgDdsWgV1Defs.UserAgent>
    | $Typed<OrgDdsWgV1Defs.AlgorithmAgent>
    | { $type: string }
  subject: ComAtprotoRepoStrongRef.Main
  timestamp: string
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
