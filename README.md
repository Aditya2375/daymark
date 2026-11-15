# daymark

[Live demo](https://aditya2375.github.io/daymark/)

An intraday seasonality atlas. Java aggregates historical one-minute bars into a clock-time view of price variation and share volume. A dependency-free browser app lets you compare the ten days behind each average.

## What it does

- SPY and AAPL, 2 to 13 November 2026, ten complete sessions each.
- Thirteen half-hours from 09:30 to 16:00 New York time.
- Realized-variance share from five-minute log returns, or observed regular-session share-volume share.
- Equal-day mean, median and daily min/max, a selectable daily profile and a numeric heatmap.
- Keyboard day/bin controls, a readable selected-cell result and an exact profile table.
- One same-origin data request. No visitor uploads, storage, telemetry, external fonts, runtime libraries, accounts or trading actions.

The chart index is 13 times each half-hour's share of its session. **1× means an equal share, not a return or a forecast.** The shaded min/max range is descriptive, not a confidence band. The app does not fit or force a U-curve.

## Run locally

Java 21+, Node 22+, Python 3 and Chrome for browser tests. No package install.

```sh
javac -d build/classes src/daymark/*.java tools/*.java tests/daymark/*.java
java -cp build/classes daymark.TestRunner
node tests/parity.mjs
python3 tools/verify-data.py
node tools/build-web.mjs
node tests/browser-smoke.mjs
python3 -m http.server 8000 --directory docs
```

Open the local server URL printed by Python. `SMOKE_SHOTS=1 node tests/browser-smoke.mjs` saves optional screenshots outside version control.

## Data and rights

The public bundle contains **only derived, dimensionless within-session shares**, not vendor OHLCV, raw prices, share counts or downloadable raw bars. The FirstRate Data license permits public derivative works for Subscribers, but not raw-data redistribution. Free-sample coverage is read from its definitions of Subscriber and the Data; the agreement does not name samples separately. See [DATA.md](DATA.md), [the source](https://firstratedata.com/free-intraday-data) and [its license](https://firstratedata.com/about/license). The source sample URLs rotate. The manifest records the actual downloaded bytes and dates, not the older catalogue window.

The original software and derived analysis are available under **MIT OR Apache-2.0**. This does not grant rights in FirstRate Data's underlying raw inputs, which are not included. See [NOTICE](NOTICE), [LICENSE-MIT](LICENSE-MIT) and [LICENSE-APACHE](LICENSE-APACHE).

## Method and limits

Inspired by Andersen & Bollerslev, *Intraday periodicity and volatility persistence in financial markets* (1997), [author-hosted paper](https://public.econ.duke.edu/~boller/Published_Papers/joef_97.pdf). This is an exploratory visualization, not a replication of their periodic model.

Only full 390-bar regular sessions are retained. There is no gap filling or overnight return. Bars stamped 16:00 are excluded. Every day gets equal weight after normalization. Volume is the observed sum of regular-session minute bars, not the vendor's official daily-volume series. Five-minute sampling and the treatment of the open affect the result. [NUMERICS.md](NUMERICS.md) defines every calculation.

Two liquid assets and ten sessions are not a representative market sample or proof of stable seasonality. There are no statistical tests, uncertainty estimates, trading signals, broker keys or real trades. Data can contain errors. Native Safari has not been tested; mobile layout is checked in Chrome emulation.
