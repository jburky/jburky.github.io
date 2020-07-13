import 'package:flutter/material.dart';
import 'package:flutter_demo/models/organization_model.dart';
import 'package:flutter_demo/pages/home_page.dart';
import 'package:provider/provider.dart';
import 'package:theme_provider/theme_provider.dart';
import 'models/root_model.dart';

void main() {
  runApp(MultiProvider(providers: [
    ChangeNotifierProvider(create: (context) => RootModel()),
  ], child: App()));
}

class App extends StatelessWidget {
  // This widget is the root of your application.
  @override
  Widget build(BuildContext context) {
    return Consumer<RootModel>(builder: (context, root, child) {
      return ThemeProvider(
        themes: [
          AppTheme.dark(id: 'default'),
          for (var theme in root.organizations.map((e) => e.theme)) theme
        ],
        child: MaterialApp(
          title: 'Horse Sales',
          home: ThemeConsumer(child: HomePage()),
          navigatorObservers: [CustomRouteObserver()],
        ),
      );
    });
  }
}

class CustomRouteObserver extends RouteObserver<PageRoute<dynamic>> {
  void _sendScreenView(PageRoute<dynamic> route) {
    var screenName = route.settings.name;
    print('screenName $screenName');
    // var org = Provider.of<OrganizationModel>(context);
    // ThemeProvider.controllerOf(route.subtreeContext).setTheme('default');
  }

  @override
  void didPush(Route<dynamic> route, Route<dynamic> previousRoute) {
    super.didPush(route, previousRoute);
    if (route is PageRoute) {
      _sendScreenView(route);
    }
  }

  @override
  void didReplace({Route<dynamic> newRoute, Route<dynamic> oldRoute}) {
    super.didReplace(newRoute: newRoute, oldRoute: oldRoute);
    if (newRoute is PageRoute) {
      _sendScreenView(newRoute);
    }
  }

  @override
  void didPop(Route<dynamic> route, Route<dynamic> previousRoute) {
    super.didPop(route, previousRoute);
    if (previousRoute is PageRoute && route is PageRoute) {
      _sendScreenView(previousRoute);
    }
  }
}
