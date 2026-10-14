# Native catalog loading improvement

Native catalog loading previously fetched and decoded all 79 parts in sequence. The loader now runs up to eight request workers, keeping a private staged catalog until installation. It retains live artwork during reloads and does not allow superseded requests to install over a newer catalog. Error messages retain catalog order; failed manifest loads preserve the existing installed art. Native frame validation and exact source/indexed compilation remain unchanged.

Checks passed: native-catalog-loading covers bounded concurrency, atomic install, live-art retention, stale-load supersession, duplicate entry reporting and failed-reload retention. native-part-catalog checks all 79 assets/1264 exact frames. Real loaded-native mouse Brace/attack and Court captures passed. Source audit passed.

Measured one routed Chromium warm-load comparison using the saved preceding serial loader (reports/native-loader-serial-before.mjs) and current code: serial 1435.7ms, bounded concurrent 302.6ms; both installed all 79 parts with zero errors. This approximately 4.7x result applies to this measured warm-load setup, not general cold startup or another device. See native-loading-comparison.json and tools/measure-native-loading.cjs. Baseline import MIME was corrected before the successful comparison.

This shortens time spent drawing procedural fallbacks; it does not replace remaining creature art, animation, interface or biological work. The whole active roadmap remains incomplete.
