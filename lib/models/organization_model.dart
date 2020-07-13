import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_demo/models/sale_model.dart';
import 'package:theme_provider/theme_provider.dart';

class OrganizationModel extends ChangeNotifier {
  String name;
  AppTheme theme;

  List<SaleModel> sales = List();

  OrganizationModel(this.name, this.theme) {
    load();
  }

  load() {
    sales.add(SaleModel("Fall 2020", "Featuring foals from Storm Cat"));
    sales.add(SaleModel("Spring 2021", "The largest sale of the season"));
  }
}
