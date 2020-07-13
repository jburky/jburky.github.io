import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

class HorseModel extends ChangeNotifier {
  String name;
  int hip;
  DateTime birthday;

  HorseModel(this.name, this.hip, this.birthday);
}
