/**
 * GENERATED CODE - DO NOT MODIFY
 */
import {
  type LexiconDoc,
  Lexicons,
  ValidationError,
  type ValidationResult,
} from '@atproto/lexicon'
import { type $Typed, is$typed, maybe$typed } from './util.js'

export const schemaDict = {
  OrgDdsWgV1Algorithm: {
    lexicon: 1,
    id: 'org.dds-wg.v1.algorithm',
    description:
      'A registered instance of an algorithm. Other agent-bearing records can reference this as an algorithmAgent.',
    defs: {
      main: {
        type: 'record',
        key: 'tid',
        record: {
          type: 'object',
          required: ['name', 'creator', 'createdAt'],
          properties: {
            schemaVersion: {
              type: 'string',
              maxLength: 32,
            },
            name: {
              type: 'string',
              maxLength: 200,
            },
            description: {
              type: 'string',
              maxLength: 10000,
            },
            creator: {
              type: 'string',
              format: 'did',
            },
            metadata: {
              type: 'string',
              description:
                'JSON-encoded parameters of this algorithm instance.',
              maxLength: 100000,
            },
            createdAt: {
              type: 'string',
              format: 'datetime',
            },
          },
        },
      },
    },
  },
  OrgDdsWgV1Classification: {
    lexicon: 1,
    id: 'org.dds-wg.v1.classification',
    description:
      'A label applied by an agent to a subject, with an optional confidence (0-10000 representing 0.0000-1.0000).',
    defs: {
      main: {
        type: 'record',
        key: 'tid',
        record: {
          type: 'object',
          required: ['creator', 'subject', 'label', 'createdAt'],
          properties: {
            schemaVersion: {
              type: 'string',
              maxLength: 32,
            },
            creator: {
              type: 'union',
              refs: [
                'lex:org.dds-wg.v1.defs#userAgent',
                'lex:org.dds-wg.v1.defs#algorithmAgent',
              ],
            },
            subject: {
              type: 'ref',
              ref: 'lex:com.atproto.repo.strongRef',
            },
            label: {
              type: 'string',
              maxLength: 200,
            },
            confidence: {
              type: 'integer',
              minimum: 0,
              maximum: 10000,
              description:
                'Fixed-point confidence: integer in [0, 10000] representing [0.0000, 1.0000]. AT Protocol lexicon does not support native floats.',
            },
            createdAt: {
              type: 'string',
              format: 'datetime',
            },
          },
        },
      },
    },
  },
  OrgDdsWgV1Decision: {
    lexicon: 1,
    id: 'org.dds-wg.v1.decision',
    description:
      'A decision made by a user or algorithm, optionally pointing to the proposals that were accepted into it.',
    defs: {
      main: {
        type: 'record',
        key: 'tid',
        record: {
          type: 'object',
          required: ['name', 'summary', 'creator', 'createdAt'],
          properties: {
            schemaVersion: {
              type: 'string',
              maxLength: 32,
            },
            name: {
              type: 'string',
              maxLength: 200,
            },
            summary: {
              type: 'string',
              maxLength: 10000,
            },
            creator: {
              type: 'union',
              refs: [
                'lex:org.dds-wg.v1.defs#userAgent',
                'lex:org.dds-wg.v1.defs#algorithmAgent',
              ],
            },
            acceptedProposals: {
              type: 'array',
              items: {
                type: 'ref',
                ref: 'lex:com.atproto.repo.strongRef',
              },
            },
            step: {
              type: 'ref',
              ref: 'lex:org.dds-wg.v1.defs#projectStepRef',
            },
            createdAt: {
              type: 'string',
              format: 'datetime',
            },
          },
        },
      },
    },
  },
  OrgDdsWgV1Defs: {
    lexicon: 1,
    id: 'org.dds-wg.v1.defs',
    description:
      'Shared definitions used across the DDS v1 lexicon. agentRef and subjectRef are conventions, expressed inline at each use-site (see README), because AT Protocol lexicon does not permit top-level union or ref defs.',
    defs: {
      userAgent: {
        type: 'object',
        description:
          'An agent that is a real-world user, identified by their DID.',
        required: ['did'],
        properties: {
          did: {
            type: 'string',
            format: 'did',
          },
        },
      },
      algorithmAgent: {
        type: 'object',
        description:
          'An agent that is an algorithm instance, identified by a strong ref to an org.dds-wg.v1.algorithm record.',
        required: ['algorithm'],
        properties: {
          algorithm: {
            type: 'ref',
            ref: 'lex:com.atproto.repo.strongRef',
          },
        },
      },
      projectStepRef: {
        type: 'object',
        description:
          'Reference to a specific phase within a specific project, scoped by a strong ref to the project and the phase name.',
        required: ['project', 'phase'],
        properties: {
          project: {
            type: 'ref',
            ref: 'lex:com.atproto.repo.strongRef',
          },
          phase: {
            type: 'string',
            maxLength: 200,
          },
        },
      },
      recordView: {
        type: 'object',
        description:
          'A view over a single record: its AT-URI, CID, and the unvalidated record value.',
        required: ['uri', 'cid', 'value'],
        properties: {
          uri: {
            type: 'string',
            format: 'at-uri',
          },
          cid: {
            type: 'string',
            format: 'cid',
          },
          value: {
            type: 'unknown',
          },
        },
      },
    },
  },
  OrgDdsWgV1Event: {
    lexicon: 1,
    id: 'org.dds-wg.v1.event',
    description:
      'A generic event in the DDS workflow: who did what to which subject when.',
    defs: {
      main: {
        type: 'record',
        key: 'tid',
        record: {
          type: 'object',
          required: ['type', 'actor', 'subject', 'timestamp'],
          properties: {
            schemaVersion: {
              type: 'string',
              maxLength: 32,
            },
            type: {
              type: 'string',
              maxLength: 200,
            },
            actor: {
              type: 'union',
              refs: [
                'lex:org.dds-wg.v1.defs#userAgent',
                'lex:org.dds-wg.v1.defs#algorithmAgent',
              ],
            },
            subject: {
              type: 'ref',
              ref: 'lex:com.atproto.repo.strongRef',
            },
            timestamp: {
              type: 'string',
              format: 'datetime',
            },
          },
        },
      },
    },
  },
  OrgDdsWgV1GetProject: {
    lexicon: 1,
    id: 'org.dds-wg.v1.getProject',
    description: 'App-view query: fetch a project record by AT-URI.',
    defs: {
      main: {
        type: 'query',
        parameters: {
          type: 'params',
          required: ['uri'],
          properties: {
            uri: {
              type: 'string',
              format: 'at-uri',
            },
          },
        },
        output: {
          encoding: 'application/json',
          schema: {
            type: 'ref',
            ref: 'lex:org.dds-wg.v1.defs#recordView',
          },
        },
      },
    },
  },
  OrgDdsWgV1Group: {
    lexicon: 1,
    id: 'org.dds-wg.v1.group',
    description:
      'A group of subjects: statements, users, or other groups. Created by a user or algorithm.',
    defs: {
      main: {
        type: 'record',
        key: 'tid',
        record: {
          type: 'object',
          required: ['creator', 'members', 'createdAt'],
          properties: {
            schemaVersion: {
              type: 'string',
              maxLength: 32,
            },
            name: {
              type: 'string',
              maxLength: 200,
            },
            description: {
              type: 'string',
              maxLength: 5000,
            },
            creator: {
              type: 'union',
              refs: [
                'lex:org.dds-wg.v1.defs#userAgent',
                'lex:org.dds-wg.v1.defs#algorithmAgent',
              ],
            },
            members: {
              type: 'array',
              items: {
                type: 'union',
                refs: [
                  'lex:org.dds-wg.v1.group#statementMember',
                  'lex:org.dds-wg.v1.group#userMember',
                  'lex:org.dds-wg.v1.group#groupMember',
                ],
              },
            },
            step: {
              type: 'ref',
              ref: 'lex:org.dds-wg.v1.defs#projectStepRef',
            },
            createdAt: {
              type: 'string',
              format: 'datetime',
            },
          },
        },
      },
      statementMember: {
        type: 'object',
        required: ['statement'],
        properties: {
          statement: {
            type: 'ref',
            ref: 'lex:com.atproto.repo.strongRef',
          },
        },
      },
      userMember: {
        type: 'object',
        required: ['did'],
        properties: {
          did: {
            type: 'string',
            format: 'did',
          },
        },
      },
      groupMember: {
        type: 'object',
        required: ['group'],
        properties: {
          group: {
            type: 'ref',
            ref: 'lex:com.atproto.repo.strongRef',
          },
        },
      },
    },
  },
  OrgDdsWgV1ListProjects: {
    lexicon: 1,
    id: 'org.dds-wg.v1.listProjects',
    description:
      'App-view query: list project records, optionally scoped to a repo.',
    defs: {
      main: {
        type: 'query',
        parameters: {
          type: 'params',
          properties: {
            repo: {
              type: 'string',
              format: 'at-identifier',
            },
            limit: {
              type: 'integer',
              minimum: 1,
              maximum: 100,
              default: 50,
            },
            cursor: {
              type: 'string',
            },
          },
        },
        output: {
          encoding: 'application/json',
          schema: {
            type: 'ref',
            ref: 'lex:org.dds-wg.v1.listProjects#output',
          },
        },
      },
      output: {
        type: 'object',
        required: ['projects'],
        properties: {
          cursor: {
            type: 'string',
          },
          projects: {
            type: 'array',
            items: {
              type: 'ref',
              ref: 'lex:org.dds-wg.v1.defs#recordView',
            },
          },
        },
      },
    },
  },
  OrgDdsWgV1Metric: {
    lexicon: 1,
    id: 'org.dds-wg.v1.metric',
    description:
      'A named metric produced by a user or algorithm about a subject (user, group, proposal, decision, summary, statement, ...).',
    defs: {
      main: {
        type: 'record',
        key: 'tid',
        record: {
          type: 'object',
          required: ['name', 'creator', 'metricType', 'subject', 'createdAt'],
          properties: {
            schemaVersion: {
              type: 'string',
              maxLength: 32,
            },
            name: {
              type: 'string',
              maxLength: 200,
            },
            creator: {
              type: 'union',
              refs: [
                'lex:org.dds-wg.v1.defs#userAgent',
                'lex:org.dds-wg.v1.defs#algorithmAgent',
              ],
            },
            metricType: {
              type: 'string',
              description:
                "Free-form discriminator like 'groupInformedConsensus', 'agreeCount', etc.",
              maxLength: 200,
            },
            value: {
              type: 'union',
              refs: [
                'lex:org.dds-wg.v1.metric#integerValue',
                'lex:org.dds-wg.v1.metric#decimalValue',
                'lex:org.dds-wg.v1.metric#stringValue',
                'lex:org.dds-wg.v1.metric#booleanValue',
                'lex:org.dds-wg.v1.metric#jsonValue',
              ],
            },
            subject: {
              type: 'ref',
              ref: 'lex:com.atproto.repo.strongRef',
            },
            step: {
              type: 'ref',
              ref: 'lex:org.dds-wg.v1.defs#projectStepRef',
            },
            createdAt: {
              type: 'string',
              format: 'datetime',
            },
          },
        },
      },
      integerValue: {
        type: 'object',
        description: 'An exact integer metric value.',
        required: ['integer'],
        properties: {
          integer: {
            type: 'integer',
          },
        },
      },
      decimalValue: {
        type: 'object',
        description:
          "A decimal metric value. AT Protocol has no native float type, so this is encoded as a JSON-number string (e.g. '0.4231').",
        required: ['decimal'],
        properties: {
          decimal: {
            type: 'string',
            maxLength: 64,
          },
        },
      },
      stringValue: {
        type: 'object',
        required: ['string'],
        properties: {
          string: {
            type: 'string',
            maxLength: 5000,
          },
        },
      },
      booleanValue: {
        type: 'object',
        required: ['boolean'],
        properties: {
          boolean: {
            type: 'boolean',
          },
        },
      },
      jsonValue: {
        type: 'object',
        description: 'Arbitrary JSON payload, serialized as a string.',
        required: ['json'],
        properties: {
          json: {
            type: 'string',
            maxLength: 50000,
          },
        },
      },
    },
  },
  OrgDdsWgV1Project: {
    lexicon: 1,
    id: 'org.dds-wg.v1.project',
    description:
      'A DDS project: a named container for ordered deliberation phases.',
    defs: {
      main: {
        type: 'record',
        key: 'tid',
        record: {
          type: 'object',
          required: ['name', 'creator', 'phases', 'createdAt'],
          properties: {
            schemaVersion: {
              type: 'string',
              maxLength: 32,
            },
            name: {
              type: 'string',
              maxLength: 200,
            },
            description: {
              type: 'string',
              maxLength: 10000,
            },
            creator: {
              type: 'union',
              refs: [
                'lex:org.dds-wg.v1.defs#userAgent',
                'lex:org.dds-wg.v1.defs#algorithmAgent',
              ],
            },
            phases: {
              type: 'array',
              items: {
                type: 'ref',
                ref: 'lex:org.dds-wg.v1.project#phase',
              },
            },
            createdAt: {
              type: 'string',
              format: 'datetime',
            },
          },
        },
      },
      phase: {
        type: 'object',
        description:
          'An ordered phase within a project. Phases are embedded by value in the project record.',
        required: ['name', 'order', 'status'],
        properties: {
          name: {
            type: 'string',
            maxLength: 200,
          },
          order: {
            type: 'integer',
            minimum: 0,
          },
          status: {
            type: 'string',
            knownValues: ['draft', 'active', 'closed', 'archived'],
          },
          allowedSubjects: {
            type: 'array',
            items: {
              type: 'string',
              knownValues: [
                'statement',
                'vote',
                'response',
                'proposal',
                'decision',
                'summary',
                'group',
                'metric',
                'classification',
              ],
            },
          },
          participation: {
            type: 'ref',
            ref: 'lex:org.dds-wg.v1.project#participationRule',
          },
        },
      },
      participationRule: {
        type: 'object',
        required: ['mode'],
        properties: {
          mode: {
            type: 'string',
            knownValues: [
              'open',
              'invite',
              'sortition',
              'curated',
              'tokenWeighted',
              'reputationWeighted',
              'algorithmicSelection',
            ],
          },
          invitedAgents: {
            type: 'array',
            items: {
              type: 'string',
              format: 'did',
            },
          },
          selectionAlgorithm: {
            type: 'ref',
            ref: 'lex:com.atproto.repo.strongRef',
          },
          quota: {
            type: 'string',
            description: 'JSON-encoded quota specification.',
            maxLength: 10000,
          },
        },
      },
    },
  },
  OrgDdsWgV1Proposal: {
    lexicon: 1,
    id: 'org.dds-wg.v1.proposal',
    description: 'A named, described proposal authored by a user or algorithm.',
    defs: {
      main: {
        type: 'record',
        key: 'tid',
        record: {
          type: 'object',
          required: ['name', 'creator', 'createdAt'],
          properties: {
            schemaVersion: {
              type: 'string',
              maxLength: 32,
            },
            name: {
              type: 'string',
              maxLength: 200,
            },
            description: {
              type: 'string',
              maxLength: 10000,
            },
            creator: {
              type: 'union',
              refs: [
                'lex:org.dds-wg.v1.defs#userAgent',
                'lex:org.dds-wg.v1.defs#algorithmAgent',
              ],
            },
            step: {
              type: 'ref',
              ref: 'lex:org.dds-wg.v1.defs#projectStepRef',
            },
            createdAt: {
              type: 'string',
              format: 'datetime',
            },
          },
        },
      },
    },
  },
  OrgDdsWgV1Reaction: {
    lexicon: 1,
    id: 'org.dds-wg.v1.reaction',
    description:
      'A reaction by an author. Wraps either a vote or a response value into a single discriminable record.',
    defs: {
      main: {
        type: 'record',
        key: 'tid',
        record: {
          type: 'object',
          required: ['author', 'reaction', 'createdAt'],
          properties: {
            schemaVersion: {
              type: 'string',
              maxLength: 32,
            },
            author: {
              type: 'union',
              refs: [
                'lex:org.dds-wg.v1.defs#userAgent',
                'lex:org.dds-wg.v1.defs#algorithmAgent',
              ],
            },
            reaction: {
              type: 'union',
              refs: ['lex:org.dds-wg.v1.vote', 'lex:org.dds-wg.v1.response'],
            },
            createdAt: {
              type: 'string',
              format: 'datetime',
            },
          },
        },
      },
    },
  },
  OrgDdsWgV1Response: {
    lexicon: 1,
    id: 'org.dds-wg.v1.response',
    description:
      'A free-form textual response targeted at a DDS subject (e.g. a statement, proposal, or summary).',
    defs: {
      main: {
        type: 'record',
        key: 'tid',
        record: {
          type: 'object',
          required: ['text', 'target', 'createdAt'],
          properties: {
            schemaVersion: {
              type: 'string',
              maxLength: 32,
            },
            text: {
              type: 'string',
              maxLength: 5000,
            },
            target: {
              type: 'ref',
              ref: 'lex:com.atproto.repo.strongRef',
            },
            author: {
              type: 'union',
              refs: [
                'lex:org.dds-wg.v1.defs#userAgent',
                'lex:org.dds-wg.v1.defs#algorithmAgent',
              ],
            },
            createdAt: {
              type: 'string',
              format: 'datetime',
            },
          },
        },
      },
    },
  },
  OrgDdsWgV1Statement: {
    lexicon: 1,
    id: 'org.dds-wg.v1.statement',
    description:
      'A textual contribution by an author, optionally in reply to another statement or group.',
    defs: {
      main: {
        type: 'record',
        key: 'tid',
        record: {
          type: 'object',
          required: ['text', 'author', 'createdAt'],
          properties: {
            schemaVersion: {
              type: 'string',
              description:
                "Optional semver of the record's minor/patch schema within the v1 major (e.g. '1.0.0'). Absent => latest known.",
              maxLength: 32,
            },
            text: {
              type: 'string',
              maxLength: 5000,
            },
            author: {
              type: 'union',
              refs: [
                'lex:org.dds-wg.v1.defs#userAgent',
                'lex:org.dds-wg.v1.defs#algorithmAgent',
              ],
            },
            replyTo: {
              type: 'ref',
              ref: 'lex:com.atproto.repo.strongRef',
            },
            step: {
              type: 'ref',
              ref: 'lex:org.dds-wg.v1.defs#projectStepRef',
            },
            createdAt: {
              type: 'string',
              format: 'datetime',
            },
          },
        },
      },
    },
  },
  OrgDdsWgV1Summary: {
    lexicon: 1,
    id: 'org.dds-wg.v1.summary',
    description:
      'A textual summary of a subject (typically a group or decision).',
    defs: {
      main: {
        type: 'record',
        key: 'tid',
        record: {
          type: 'object',
          required: ['name', 'description', 'creator', 'subject', 'createdAt'],
          properties: {
            schemaVersion: {
              type: 'string',
              maxLength: 32,
            },
            name: {
              type: 'string',
              maxLength: 200,
            },
            description: {
              type: 'string',
              maxLength: 10000,
            },
            creator: {
              type: 'union',
              refs: [
                'lex:org.dds-wg.v1.defs#userAgent',
                'lex:org.dds-wg.v1.defs#algorithmAgent',
              ],
            },
            subject: {
              type: 'ref',
              ref: 'lex:com.atproto.repo.strongRef',
            },
            step: {
              type: 'ref',
              ref: 'lex:org.dds-wg.v1.defs#projectStepRef',
            },
            createdAt: {
              type: 'string',
              format: 'datetime',
            },
          },
        },
      },
    },
  },
  OrgDdsWgV1Vote: {
    lexicon: 1,
    id: 'org.dds-wg.v1.vote',
    description:
      'A vote cast by an agent against a target subject. The vote payload is one of several value-shapes (ordinal, continuous, quadratic, approval, ranked).',
    defs: {
      main: {
        type: 'record',
        key: 'tid',
        record: {
          type: 'object',
          required: ['author', 'target', 'value', 'createdAt'],
          properties: {
            schemaVersion: {
              type: 'string',
              maxLength: 32,
            },
            author: {
              type: 'union',
              refs: [
                'lex:org.dds-wg.v1.defs#userAgent',
                'lex:org.dds-wg.v1.defs#algorithmAgent',
              ],
            },
            target: {
              type: 'ref',
              ref: 'lex:com.atproto.repo.strongRef',
            },
            value: {
              type: 'union',
              refs: [
                'lex:org.dds-wg.v1.vote#ordinal',
                'lex:org.dds-wg.v1.vote#continuous',
                'lex:org.dds-wg.v1.vote#quadratic',
                'lex:org.dds-wg.v1.vote#approval',
                'lex:org.dds-wg.v1.vote#ranked',
              ],
            },
            step: {
              type: 'ref',
              ref: 'lex:org.dds-wg.v1.defs#projectStepRef',
            },
            createdAt: {
              type: 'string',
              format: 'datetime',
            },
          },
        },
      },
      ordinal: {
        type: 'object',
        description: 'Polis-style trinary vote: -1 disagree, 0 pass, +1 agree.',
        required: ['value'],
        properties: {
          value: {
            type: 'integer',
            minimum: -1,
            maximum: 1,
          },
        },
      },
      continuous: {
        type: 'object',
        description:
          'A continuous-valued vote represented as fixed-point integer in [-10000, 10000] (= [-1.0, 1.0] with 4 decimal places). AT Protocol lexicon does not support native floats.',
        required: ['value'],
        properties: {
          value: {
            type: 'integer',
            minimum: -10000,
            maximum: 10000,
          },
        },
      },
      quadratic: {
        type: 'object',
        description:
          'Quadratic voting: an integer number of credits (can be negative).',
        required: ['credits'],
        properties: {
          credits: {
            type: 'integer',
          },
        },
      },
      approval: {
        type: 'object',
        description: 'Boolean approval vote.',
        required: ['approve'],
        properties: {
          approve: {
            type: 'boolean',
          },
        },
      },
      ranked: {
        type: 'object',
        description:
          'A ranked vote that orders subject URIs by preference (most preferred first).',
        required: ['order'],
        properties: {
          order: {
            type: 'array',
            items: {
              type: 'string',
              format: 'at-uri',
            },
          },
        },
      },
    },
  },
  OrgDdsWgV1WorkflowTransition: {
    lexicon: 1,
    id: 'org.dds-wg.v1.workflowTransition',
    description:
      'A transition between two phases of a project, with a trigger type.',
    defs: {
      main: {
        type: 'record',
        key: 'tid',
        record: {
          type: 'object',
          required: ['project', 'from', 'to', 'trigger', 'createdAt'],
          properties: {
            schemaVersion: {
              type: 'string',
              maxLength: 32,
            },
            project: {
              type: 'ref',
              ref: 'lex:com.atproto.repo.strongRef',
            },
            from: {
              type: 'string',
              maxLength: 200,
            },
            to: {
              type: 'string',
              maxLength: 200,
            },
            trigger: {
              type: 'string',
              knownValues: [
                'time',
                'voteThreshold',
                'algorithmDecision',
                'manual',
              ],
            },
            createdAt: {
              type: 'string',
              format: 'datetime',
            },
          },
        },
      },
    },
  },
} as const satisfies Record<string, LexiconDoc>
export const schemas = Object.values(schemaDict) satisfies LexiconDoc[]
export const lexicons: Lexicons = new Lexicons(schemas)

export function validate<T extends { $type: string }>(
  v: unknown,
  id: string,
  hash: string,
  requiredType: true,
): ValidationResult<T>
export function validate<T extends { $type?: string }>(
  v: unknown,
  id: string,
  hash: string,
  requiredType?: false,
): ValidationResult<T>
export function validate(
  v: unknown,
  id: string,
  hash: string,
  requiredType?: boolean,
): ValidationResult {
  return (requiredType ? is$typed : maybe$typed)(v, id, hash)
    ? lexicons.validate(`${id}#${hash}`, v)
    : {
        success: false,
        error: new ValidationError(
          `Must be an object with "${hash === 'main' ? id : `${id}#${hash}`}" $type property`,
        ),
      }
}

export const ids = {
  OrgDdsWgV1Algorithm: 'org.dds-wg.v1.algorithm',
  OrgDdsWgV1Classification: 'org.dds-wg.v1.classification',
  OrgDdsWgV1Decision: 'org.dds-wg.v1.decision',
  OrgDdsWgV1Defs: 'org.dds-wg.v1.defs',
  OrgDdsWgV1Event: 'org.dds-wg.v1.event',
  OrgDdsWgV1GetProject: 'org.dds-wg.v1.getProject',
  OrgDdsWgV1Group: 'org.dds-wg.v1.group',
  OrgDdsWgV1ListProjects: 'org.dds-wg.v1.listProjects',
  OrgDdsWgV1Metric: 'org.dds-wg.v1.metric',
  OrgDdsWgV1Project: 'org.dds-wg.v1.project',
  OrgDdsWgV1Proposal: 'org.dds-wg.v1.proposal',
  OrgDdsWgV1Reaction: 'org.dds-wg.v1.reaction',
  OrgDdsWgV1Response: 'org.dds-wg.v1.response',
  OrgDdsWgV1Statement: 'org.dds-wg.v1.statement',
  OrgDdsWgV1Summary: 'org.dds-wg.v1.summary',
  OrgDdsWgV1Vote: 'org.dds-wg.v1.vote',
  OrgDdsWgV1WorkflowTransition: 'org.dds-wg.v1.workflowTransition',
} as const
