# CTG Operations

`ctg-operations` is the shared operational application for City Tour Guide.

It supports operational workflows used across City Tour Guide products, including:

- Golf Cart City Tours
- Shuttle / Transit Driver Requests
- request and rider workflows
- driver workflows
- request status and ride confirmation
- waiver workflows
- payments
- guided tour support
- operations tooling

## Canonical platform

The main City Tour Guide platform is:

`https://citytourguide.app`

This repository has historically been named `hopper-ctg`. The legacy repository, Vercel project, Cloud Run service, and `hopper.citytourguide.app` endpoint may remain temporarily during migration so active dependencies are not broken.

## Naming target

Application/package name: `ctg-operations`

Legacy technical identifiers should be migrated only after traffic, domain, environment variables, secrets, storage, database, waiver, payment, and rollback dependencies are verified.

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
npm run start
```

## Migration safety

Do not delete or repoint the legacy `hopper-ctg` service until the replacement `ctg-operations` service has been deployed and all critical routes have been tested.
