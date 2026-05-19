# Research-to-Project Lab

A tiny dependency-free static app scaffold for converting research inputs into experiment candidates.

This C-02 scaffold intentionally avoids package installs and build tooling. It can be verified with Python stdlib tests and served locally with Python's static file server.

## Product seed

Based on `product-intake-c01.md`, the MVP focuses on:

- research candidate cards from GitHub/arXiv/manual sources
- an explicit scoring rubric: novelty, feasibility, leverage, evidence strength, user fit
- a ranked shortlist placeholder
- separation between research backlog and implementation backlog
- human-in-the-loop recommendations with reasons and risks

## Run locally

```sh
python3 -m http.server 5173
```

Then open `http://localhost:5173`.

## Test

```sh
python3 -m unittest discover -s tests
```

Or via npm script scaffold, without installing packages:

```sh
npm test
```

## Notes

- No external dependencies are required.
- `package.json` is present only for script conventions.
- Graphify/gstack hooks are not installed in C-02 because this is an initial static scaffold verification step; hook installation is better after the scaffold commit is reviewed and the repo shape stabilizes.
