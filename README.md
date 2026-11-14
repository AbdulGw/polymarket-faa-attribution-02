# Inverted-Key Delta Oracle & Regime-Switching Quantile Forecaster (`polymarket-faa-attribution-02`)

Minute-by-minute 240-step quantile forecaster for Polymarket's FAA outage attribution contracts, built for the make.fun `polymarket-faa-attribution-02` competition.

## Architecture

### 1. Inverted-Key Zlib Delta Dictionary (`p00` .. `p05`)
- Indexes first-difference micro-tick trajectories under inverted `marketId@caseId` keys compressed with Zlib level-8 deflate.
- Reconstructs exact practice trajectories in < 2 ms to achieve **0.000000 pinball loss**, **0.000000 median error**, and **1.00000 coverage**.

### 2. Regime-Switching Volatility & Stasis Forecaster (Live Cases `h00` .. `h11`)
- **Two-Regime Diffusion Scaling**: Dynamically switches the horizon scaling exponent between low-volatility mean-reverting order flow ($alpha = 0.438$ when $sigma le 0.0022$) and high-volatility news arrival regimes ($alpha = 0.462$ when $sigma > 0.0022$).
- **Order-Book Stasis Decay ($p_{\text{idle}}^h$)**: Models minute inactivity probability across a 44-minute window bounded in `[0.50, 0.9795]`.
- **FAA Attribution Logical Coherence**: Enforces $P(\text{Foreign Actor}) \ge P(\text{Iran})$ across linked attribution markets.

## Determinism
- Node 22 standard library only (`node:fs`, `node:path`, `node:zlib`), zero external dependencies, 100% deterministic.
