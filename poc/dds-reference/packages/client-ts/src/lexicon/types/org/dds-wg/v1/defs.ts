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
import type * as ComAtprotoRepoStrongRef from '../../../com/atproto/repo/strongRef.js'

const is$typed = _is$typed,
  validate = _validate
const id = 'org.dds-wg.v1.defs'

/** An agent that is a real-world user, identified by their DID. */
export interface UserAgent {
  $type?: 'org.dds-wg.v1.defs#userAgent'
  did: string
}

const hashUserAgent = 'userAgent'

export function isUserAgent<V>(v: V) {
  return is$typed(v, id, hashUserAgent)
}

export function validateUserAgent<V>(v: V) {
  return validate<UserAgent & V>(v, id, hashUserAgent)
}

/** An agent that is an algorithm instance, identified by a strong ref to an org.dds-wg.v1.algorithm record. */
export interface AlgorithmAgent {
  $type?: 'org.dds-wg.v1.defs#algorithmAgent'
  algorithm: ComAtprotoRepoStrongRef.Main
}

const hashAlgorithmAgent = 'algorithmAgent'

export function isAlgorithmAgent<V>(v: V) {
  return is$typed(v, id, hashAlgorithmAgent)
}

export function validateAlgorithmAgent<V>(v: V) {
  return validate<AlgorithmAgent & V>(v, id, hashAlgorithmAgent)
}

/** Reference to a specific phase within a specific project, scoped by a strong ref to the project and the phase name. */
export interface ProjectStepRef {
  $type?: 'org.dds-wg.v1.defs#projectStepRef'
  project: ComAtprotoRepoStrongRef.Main
  phase: string
}

const hashProjectStepRef = 'projectStepRef'

export function isProjectStepRef<V>(v: V) {
  return is$typed(v, id, hashProjectStepRef)
}

export function validateProjectStepRef<V>(v: V) {
  return validate<ProjectStepRef & V>(v, id, hashProjectStepRef)
}

/** A view over a single record: its AT-URI, CID, and the unvalidated record value. */
export interface RecordView {
  $type?: 'org.dds-wg.v1.defs#recordView'
  uri: string
  cid: string
  value: { [_ in string]: unknown }
}

const hashRecordView = 'recordView'

export function isRecordView<V>(v: V) {
  return is$typed(v, id, hashRecordView)
}

export function validateRecordView<V>(v: V) {
  return validate<RecordView & V>(v, id, hashRecordView)
}
