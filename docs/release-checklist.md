# Release Checklist

Use this checklist before any release signoff. It exists because the Option C release initially completed merge, CI, deploy, canary, and cleanup while README/release notes still described older scaffold behavior.

## Release is blocked until all gates pass

- [ ] Merge/integration evidence exists.
- [ ] Local tests pass.
- [ ] CI passes on the branch or main target.
- [ ] Deploy target is verified when a hosted release is in scope.
- [ ] Canary/browser smoke covers the integrated user flow.
- [ ] Cleanup is safe and merged work is protected remotely.
- [ ] `document-release` or an equivalent documentation diff audit has run.
- [ ] Docs freshness QA has compared docs against shipped behavior, diff, CI, deploy, and canary evidence.
- [ ] i18n docs links pass when Korean docs are maintained.
- [ ] Markdown relative links pass.
- [ ] Stale shipped/planned claims are removed or corrected.

## Documentation freshness gate

The Tech Writer or release owner must verify:

- README reflects shipped features.
- README does not claim shipped features are still planned/not implemented.
- User guide matches the current UI flow.
- Known issues list only real current limitations.
- Release notes include latest branch/commit, CI, deploy, canary, and known limitation evidence.
- Handoff names current repo state and next implementation sequence.
- Korean entry docs are linked from the main README when relevant.
- Every repo doc is discoverable from README or the handoff.

## QA-release verification

QA-release must independently check:

- README run/test commands work.
- GitHub and Pages links resolve when network access is available.
- Public demo behavior matches the README/user guide feature list.
- No stale release claims remain, especially:
  - shipped source intake described as “planned”;
  - deployed app described as “no deployment”;
  - source records described as absent;
  - search/filter/export/backlog described as absent.

## Automation in this repo

Run:

```sh
python3 -m unittest discover -s tests
npm test
```

The documentation test suite checks:

- README/docs relative links;
- Korean docs discoverability;
- release-checklist presence;
- stale shipped/planned claims that previously caused drift.

## Standard release evidence packet

Each release evidence artifact should include:

- repo URL and visibility;
- default branch;
- branch/commit or PR/MR identifiers;
- local test commands and results;
- CI run URL and conclusion;
- deploy run URL and conclusion;
- deployed URL;
- browser/canary checks and results;
- documentation freshness gate result;
- known limitations;
- release/hold decision.
