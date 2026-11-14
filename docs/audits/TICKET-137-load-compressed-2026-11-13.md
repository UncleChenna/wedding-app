# Load test: gate and table ordering (2026-11-13)

**Result: PASS**

## Environment

- Target: local production build (http://localhost:30110)
- Gate: 176 passes for 319 people, 3 scanners, 3-minute window (PRD: 45)
- Ordering: 30 tables, one food+drink order each, 1-minute window (PRD: 5), run alongside the gate
- Order to board: time from sending the order to its ticket appearing on the kitchen and bar board endpoints, polled every 100 ms
- Guests already admitted before the run: 31
- Data: seeded load profile (`pnpm db:seed --profile load`); no real guest data

## Timings

| Measure               | Count | Failed |   p50 |    p95 |    Max | Limit (p95) | Result |
| --------------------- | ----: | -----: | ----: | -----: | -----: | ----------: | ------ |
| Scan to result (read) |   176 |      0 | 41 ms |  95 ms | 452 ms |   < 1000 ms | pass   |
| Admit                 |   176 |      0 | 22 ms |  64 ms | 200 ms |   < 1000 ms | pass   |
| Order submit          |    30 |      0 | 25 ms |  55 ms |  56 ms |   < 2000 ms | pass   |
| Order to board        |    60 |      0 | 99 ms | 151 ms | 155 ms |   < 2000 ms | pass   |

## Outcomes

- Scan to result (read): valid 176
- Admit: recorded 176
- Order submit: created 30
- Order to board: on bar board 30, on kitchen board 30

## Slowest requests

When in the run each measure's five slowest requests started, to tell steady load from a stall.

- Scan to result (read): 452 ms at 2:20, 151 ms at 0:21, 135 ms at 0:21, 133 ms at 0:46, 131 ms at 0:00
- Admit: 200 ms at 0:21, 196 ms at 0:21, 126 ms at 2:21, 113 ms at 2:41, 94 ms at 0:46
- Order submit: 56 ms at 0:12, 55 ms at 0:56, 46 ms at 0:02, 45 ms at 0:00, 45 ms at 0:04
- Order to board: 155 ms at 0:00, 153 ms at 0:34, 153 ms at 0:00, 151 ms at 0:34, 145 ms at 0:12

## Nothing lost

| Check                                                     | Expected | In the database | Result |
| --------------------------------------------------------- | -------: | --------------: | ------ |
| People admitted (counters grew by what scanners recorded) |      319 |             319 | pass   |
| Orders stored (of those created)                          |       30 |              30 | pass   |
