# Numerical contract

## Inputs and sessions

The offline Java aggregator reads six fields: local New York bar-start timestamp, open, high, low, close and shares traded. The provider specifies US Eastern time with EST/EDT. We do not reinterpret these wall-clock strings as UTC. The frozen 2 to 13 November 2026 sample is entirely in standard time (UTC-5); no offset conversion is used in the calculation.

Reject non-minute or duplicate timestamps, invalid dates, non-finite/non-positive prices, negative volume, and inconsistent OHLC ranges. Ignore weekends and rows outside 09:30 <= time < 16:00. A retained date must have exactly one bar for all 390 minutes. Thus missing minutes and half-days are excluded rather than padded or averaged on unequal denominators. No sessions are excluded for incompleteness in this frozen sample. A session with zero total squared returns or zero observed volume is also excluded.

## Five-minute returns

Let C[k] be the close of the final minute of five-minute interval k, k=0,...,77. Let O be the open of the 09:30 minute. Define:

- r[0] = log(C[0]) - log(O)
- r[k] = log(C[k]) - log(C[k-1]), k >= 1

Thus the first observation spans 09:30 open to 09:34 close, and the final one ends at the 15:59 close. No overnight jump enters either day's profile. Bar timestamps are starts, not ends. No 16:00 bar is used; any auction print assigned there is excluded. Five-minute sampling reduces but does not eliminate market-microstructure effects. The first return's use of the open differs from a close-to-close return.

## Half-hour shares

For bin b=0,...,12, sum the six squared five-minute returns:

q[d,b] = sum(r[d,6b+j]^2), j=0,...,5.

The realized-variance share is q[d,b] / sum_b(q[d,b]). No sample-mean subtraction, annualization or square root is applied. This is a share of realized variance, not volatility in percent.

Volume share is the sum of the thirty observed minute volumes in the half-hour divided by the sum of all 390 regular-session minute volumes that day. It does not use official daily volume or tick-update counts. The source distinguishes official daily volume from intraday aggregates.

Java normalizes nonnegative vectors using their maximum first, preventing an otherwise avoidable sum overflow. Zero totals are rejected. Public rows hold these two dimensionless shares, one row per asset/date/bin; they do not retain OHLCV or original volume totals. Their values cannot reconstruct the raw minute bars.

## Profiles and inspection

For either measure, x[d,b] = 13 * share[d,b]. The equal-day mean is sum_d(x[d,b]) / N. A flat session is 1 in every bin. For this balanced complete-session sample this is proportional to average within-day shares, not a pooled-volume-weighted mean. Loud days do not dominate by their absolute scale.

The shaded minimum and maximum are extrema of the ten x[d,b] values. The median is the average of the two central order statistics for even N. There is no bootstrap, confidence interval, standard error, significance claim or extrapolation. The selected daily line is separate from the mean; selection never changes the mean. All charts start at zero and share the scale with their displayed daily range. Each metric chooses its own vertical range; compare the labeled multiples, not pixel heights across metric changes. The heatmap uses its metric's full observed range, writes values, and provides exact values through the inspector/table.

## Verification

Analytic and adversarial Java fixtures cover flat profiles, concentration, normalization under huge/subnormal scales, even/odd medians, constant returns, overnight jumps, missing minutes, half-days, weekends, outside-session bars, duplicate timestamps and malformed prices/volumes. Independent JavaScript computes all displayed summary statistics. A fresh Java reference is compared against all four asset/metric profiles. Private raw-input checks independently recompute all 520 exported shares with Python using log(close / previous), rather than Java's log difference.

The ten sessions do not establish that an estimated shape is stable. A single news-driven move can dominate a variance share. Window selection, opening treatment, grid choice, limited assets, vendor quality and day-level normalization all matter. These results are descriptive only.
