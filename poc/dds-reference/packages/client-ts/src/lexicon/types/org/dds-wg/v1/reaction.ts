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
import type * as OrgDdsWgV1Vote from './vote.js'
import type * as OrgDdsWgV1Response from './response.js'

const is$typed = _is$typed,
  validate = _validate
const id = 'org.dds-wg.v1.reaction'

export interface Main {
  $type: 'org.dds-wg.v1.reaction'
  schemaVersion?: string
  author:
    | $Typed<OrgDdsWgV1Defs.UserAgent>
    | $Typed<OrgDdsWgV1Defs.AlgorithmAgent>
    | { $type: string }
  reaction:
    | $Typed<OrgDdsWgV1Vote.Main>
    | $Typed<OrgDdsWgV1Response.Main>
    | { $type: string }
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
