import 'package:intl/intl.dart';

class Fmt {
  static final _money = NumberFormat.currency(locale: 'en_US', symbol: '\$', decimalDigits: 2);
  static final _pct = NumberFormat.decimalPattern('en_US');

  static String money(num v) => _money.format(v);
  static String pct(num v) {
    final sign = v >= 0 ? '+' : '';
    return '$sign${v.toStringAsFixed(2)}%';
  }
  static String integer(num v) => _pct.format(v);
}
