# CloddsBot: isolated offline smoke test (not live trading)

**Do not run the repository's default docker-compose.yml for paper trading.** It launches the general-purpose agent, publishes port 18789 and can load trading credentials.

The compose file here runs only a bounded, **offline** paper-engine smoke test. It has no network, no wallet, no API keys, no exposed ports, no Linux capabilities, a read-only filesystem, and a non-root UID.

## VPS preparation (after CI/security review)
1. Use a separate unprivileged Linux account with no access to the football website, PostgreSQL credentials, SSH keys, or Docker daemon.
2. Install a pinned, verified Node 22 runtime and build the **reviewed branch** in a disposable build environment. Do not copy .env files or secrets.
3. From the repository root, run `npm ci`, `npm run ci`, then `docker compose -f deploy/paper/docker-compose.yml run --rm clodds-paper-smoke`. The compose file assumes `dist/solana` has been built.
4. Inspect logs; the expected output is one JSON object with `mode: "offline-paper-smoke"`. It should exit, not run continuously.
5. **Do not deploy an always-on trading service yet.** Live market-data ingestion, strict token identity verification, stale-price checks, crash-safe persistent ledger, rate limiting, circuit breakers, and a process-level denial of wallet signing are not yet implemented or validated.

## Production release gates
- Security audits must be remediated or each remaining finding explicitly risk-accepted with evidence; never blanket-ignore advisories.
- Verify container image and lockfile provenance; run secret scanning and dependency review.
- Verify zero transaction signing and zero Solana sendTransaction paths are reachable from the paper-only entry point.
- Confirm durable storage, backups, process isolation, resource limits, monitoring and safe recovery after restart.
- Review and test market-data licensing, authenticity, freshness, liquidity and simulated slippage.
- Run supervised paper tests before any unattended operation.

No VPS credentials, funded wallets or Solana private keys are needed for the offline smoke test.
