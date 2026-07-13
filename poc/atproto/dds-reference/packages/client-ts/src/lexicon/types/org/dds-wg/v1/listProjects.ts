/**
 * GENERATED CODE - DO NOT MODIFY
 */
import { HeadersMap, XRPCError } from '@atproto/xrpc'
import { type ValidationResult, BlobRef } from '@atproto/lexicon'
import { CID } from 'multiformats/cid'
import { validate as _validate } from '../../../../lexicons.js'
import {
  type $Typed,
  is$typed as _is$typed,
  type OmitKey,
} from '../../../../util.js'
import type * as OrgDdsWgV1Defs from './defs.js'

const is$typed = _is$typed,
  validate = _validate
const id = 'org.dds-wg.v1.listProjects'

export type QueryParams = {
  repo?: string
  limit?: number
  cursor?: string
}
export type InputSchema = undefined
export type OutputSchema = Output

export interface CallOptions {
  signal?: AbortSignal
  headers?: HeadersMap
}

export interface Response {
  success: boolean
  headers: HeadersMap
  data: OutputSchema
}

export function toKnownErr(e: any) {
  return e
}

export interface Output {
  $type?: 'org.dds-wg.v1.listProjects#output'
  cursor?: string
  projects: OrgDdsWgV1Defs.RecordView[]
}

const hashOutput = 'output'

export function isOutput<V>(v: V) {
  return is$typed(v, id, hashOutput)
}

export function validateOutput<V>(v: V) {
  return validate<Output & V>(v, id, hashOutput)
}
