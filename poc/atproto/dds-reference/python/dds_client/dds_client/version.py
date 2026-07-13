"""Lexicon version constants. Mirrors `packages/client-ts/src/version.ts`."""

from typing import Literal

LEXICON_MAJOR: Literal[1] = 1
"""Major version of the DDS lexicon this client is generated against."""

LEXICON_VERSION: Literal["1.0.0"] = "1.0.0"
"""Full semver of the DDS lexicon this client is generated against."""

LEXICON_NS: Literal["org.dds-wg.v1"] = "org.dds-wg.v1"
"""NSID prefix for the current major."""


class COLLECTIONS:
    """Collection NSIDs this client knows how to author."""

    algorithm = f"{LEXICON_NS}.algorithm"
    classification = f"{LEXICON_NS}.classification"
    decision = f"{LEXICON_NS}.decision"
    event = f"{LEXICON_NS}.event"
    group = f"{LEXICON_NS}.group"
    metric = f"{LEXICON_NS}.metric"
    project = f"{LEXICON_NS}.project"
    proposal = f"{LEXICON_NS}.proposal"
    reaction = f"{LEXICON_NS}.reaction"
    response = f"{LEXICON_NS}.response"
    statement = f"{LEXICON_NS}.statement"
    summary = f"{LEXICON_NS}.summary"
    vote = f"{LEXICON_NS}.vote"
    workflow_transition = f"{LEXICON_NS}.workflowTransition"

    @classmethod
    def all(cls) -> list[str]:
        return [
            cls.algorithm,
            cls.classification,
            cls.decision,
            cls.event,
            cls.group,
            cls.metric,
            cls.project,
            cls.proposal,
            cls.reaction,
            cls.response,
            cls.statement,
            cls.summary,
            cls.vote,
            cls.workflow_transition,
        ]


DDSCollection = str
"""Type alias for a collection NSID string."""
