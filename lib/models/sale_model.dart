import 'package:flutter/foundation.dart';
import 'package:flutter_demo/models/horse_model.dart';

class SaleModel extends ChangeNotifier {
  String name;
  String description;
  List<HorseModel> horses = List();

  SaleModel(this.name, this.description) {
    load();
  }

  load() {
    int hip = 1;
    horses.add(HorseModel('Horse ${hip}', hip++, DateTime.now()));
    horses.add(HorseModel('Horse ${hip}', hip++, DateTime.now()));
    horses.add(HorseModel('Horse ${hip}', hip++, DateTime.now()));
    horses.add(HorseModel('Horse ${hip}', hip++, DateTime.now()));
    horses.add(HorseModel('Horse ${hip}', hip++, DateTime.now()));
    horses.add(HorseModel('Horse ${hip}', hip++, DateTime.now()));
    horses.add(HorseModel('Horse ${hip}', hip++, DateTime.now()));
    horses.add(HorseModel('Horse ${hip}', hip++, DateTime.now()));
    horses.add(HorseModel('Horse ${hip}', hip++, DateTime.now()));
    horses.add(HorseModel('Horse ${hip}', hip++, DateTime.now()));
    horses.add(HorseModel('Horse ${hip}', hip++, DateTime.now()));
    horses.add(HorseModel('Horse ${hip}', hip++, DateTime.now()));
    horses.add(HorseModel('Horse ${hip}', hip++, DateTime.now()));
    horses.add(HorseModel('Horse ${hip}', hip++, DateTime.now()));
    horses.add(HorseModel('Horse ${hip}', hip++, DateTime.now()));
    horses.add(HorseModel('Horse ${hip}', hip++, DateTime.now()));
    horses.add(HorseModel('Horse ${hip}', hip++, DateTime.now()));
  }
}
