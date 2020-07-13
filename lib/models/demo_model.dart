import 'package:flutter/foundation.dart';

class DemoModel extends ChangeNotifier {
  int _count = 0;

  int get count => _count;

  void add(int value) {
    _count += value;
    notifyListeners();
  }
}
