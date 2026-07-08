# `@dds/visualisation`

The DDS visualisation app. Implements the
[`VISUALISATION_SPEC.md`](../../../../reference_applicaitons_spec/VISUALISATION_SPEC.md):

- Bluesky sign-in
- Create a report off a DDS project step (project URI + phase)
- Save the list of reports locally
- Render the report in classic Polis style: opinion groups, statements ordered by
  group-informed-consensus, agree/disagree bars per statement
- Refresh fetches the latest data from the project host's PDS

## Stack

- SvelteKit + Svelte 5 (runes)
- Tailwind v4 via `@dds/ui/theme.css`
- [Layer Cake](https://layercake.graphics) for chart primitives
- `@dds/client` for data fetching

## Run

```sh
pnpm install                                       # at workspace root
pnpm --filter @dds/client build                    # workspace alias
pnpm --filter @dds/visualisation dev               # http://localhost:5175
```

## Storage

Saved reports are kept in localStorage. We may move this to a `org.dds-wg.v1.visualisation`
PDS record in a future iteration so reports follow the user across devices.
