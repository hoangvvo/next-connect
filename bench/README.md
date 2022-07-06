# Benchmarks

A simple benchmark against some popular router using [wrk](https://github.com/wg/wrk)

```
wrk -t12 -c400 -d30s http://localhost:3000/user/123
```

> Remember, this benchmark is for reference only and by no means says that one is better than the others. The slowest part of the application is still the application code itself, not the library.

## How-to

Set permissions:

```bash
chmod u+x ./run.sh
chmod u+x ./runall.sh
```

Run individual benchmark

```bash
./run <library>
# ./run next-connect
```

Run all benchmarks

```bash
./runall
```

## Result

```
Machine: Linux 5.17.0-051700-generic x86_64 | 12 vCPUs | 16GB
Node: v18.0.0

express
Running 30s test @ http://localhost:3000/user/123
  12 threads and 400 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency    27.66ms    3.30ms  88.73ms   90.64%
    Req/Sec     1.20k   137.40     2.61k    82.69%
  430220 requests in 30.09s, 63.18MB read
Requests/sec:  14296.68
Transfer/sec:      2.10MB

http
Running 30s test @ http://localhost:3000/user/123
  12 threads and 400 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     7.02ms    1.65ms  79.49ms   99.08%
    Req/Sec     4.76k   413.57     5.64k    80.44%
  1704802 requests in 30.03s, 212.98MB read
Requests/sec:  56765.13
Transfer/sec:      7.09MB

next-connect
Running 30s test @ http://localhost:3000/user/123
  12 threads and 400 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     8.98ms    2.67ms 110.80ms   98.92%
    Req/Sec     3.73k   370.41     6.44k    84.61%
  1338233 requests in 30.05s, 167.19MB read
Requests/sec:  44531.36
Transfer/sec:      5.56MB
```
