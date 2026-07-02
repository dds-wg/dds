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
const id = 'org.dds-wg.v1.group'

export interface Main {
  $type: 'org.dds-wg.v1.group'
  schemaVersion?: string
  name?: string
  description?: string
  creator:
    | $Typed<OrgDdsWgV1Defs.UserAgent>
    | $Typed<OrgDdsWgV1Defs.AlgorithmAgent>
    | { $type: string }
  members: (
    | $Typed<StatementMember>
    | $Typed<UserMember>
    | $Typed<GroupMember>
    | { $type: string }
  )[]
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

export interface StatementMember {
  $type?: 'org.dds-wg.v1.group#statementMember'
  statement: ComAtprotoRepoStrongRef.Main
}

const hashStatementMember = 'statementMember'

export function isStatementMember<V>(v: V) {
  return is$typed(v, id, hashStatementMember)
}

export function validateStatementMember<V>(v: V) {
  return validate<StatementMember & V>(v, id, hashStatementMember)
}

export interface UserMember {
  $type?: 'org.dds-wg.v1.group#userMember'
  did: string
}

const hashUserMember = 'userMember'

export function isUserMember<V>(v: V) {
  return is$typed(v, id, hashUserMember)
}

export function validateUserMember<V>(v: V) {
  return validate<UserMember & V>(v, id, hashUserMember)
}

export interface GroupMember {
  $type?: 'org.dds-wg.v1.group#groupMember'
  group: ComAtprotoRepoStrongRef.Main
}

const hashGroupMember = 'groupMember'

export function isGroupMember<V>(v: V) {
  return is$typed(v, id, hashGroupMember)
}

export function validateGroupMember<V>(v: V) {
  return validate<GroupMember & V>(v, id, hashGroupMember)
}
