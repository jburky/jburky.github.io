import 'package:flutter/foundation.dart';
import 'package:flutter_demo/models/organization_model.dart';
import 'package:flutter/material.dart';
import 'package:theme_provider/theme_provider.dart';

class RootModel extends ChangeNotifier {
  List<OrganizationModel> organizations = List();

  RootModel() {
    load();
  }

  load() {
    organizations.add(OrganizationModel(
        'Keeneland',
        AppTheme.dark().copyWith(
            id: 'keeneland',
            data: ThemeData.dark().copyWith(
                backgroundColor: Colors.green.shade900,
                primaryColor: Colors.green.shade900,
                accentColor: Colors.lightGreen.shade900))));
    organizations.add(OrganizationModel(
        'Fasig Tipton',
        AppTheme.dark().copyWith(
            id: 'fasig',
            data: ThemeData.dark().copyWith(
                backgroundColor: Colors.blue.shade900,
                primaryColor: Colors.blue.shade900,
                accentColor: Colors.lightBlue.shade900))));
  }
}
