import 'package:flutter/material.dart';
import 'package:flutter_demo/models/root_model.dart';
import 'package:flutter_demo/pages/sale_page.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:theme_provider/theme_provider.dart';

class HomePage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    // This method is rerun every time setState is called, for instance as done
    // by the _incrementCounter method above.
    //
    // The Flutter framework has been optimized to make rerunning build methods
    // fast, so that you can just rebuild anything that needs updating rather
    // than having to individually change instances of widgets.
    return Consumer<RootModel>(builder: (context, root, child) {
      return Scaffold(
        appBar: AppBar(
          // Here we take the value from the MyHomePage object that was created by
          // the App.build method, and use it to set our appbar title.
          title: Text('Sales'),
        ),
        body: Container(
          // decoration: BoxDecoration(
          //     image: DecorationImage(image: CachedNetworkImageProvider(
          //         //"https://source.unsplash.com/${MediaQuery.of(context).size.width}x${MediaQuery.of(context).size.height}/?horse,race"
          //         "http://via.placeholder.com/${MediaQuery.of(context).size.width}x${MediaQuery.of(context).size.height}"))),
          child: Center(
            // Center is a layout widget. It takes a single child and positions it
            // in the middle of the parent.
            child: ListView(
              // Column is also a layout widget. It takes a list of children and
              // arranges them vertically. By default, it sizes itself to fit its
              // children horizontally, and tries to be as tall as its parent.
              //
              // Invoke "debug painting" (press "p" in the console, choose the
              // "Toggle Debug Paint" action from the Flutter Inspector in Android
              // Studio, or the "Toggle Debug Paint" command in Visual Studio Code)
              // to see the wireframe for each widget.
              //
              // Column has various properties to control how it sizes itself and
              // how it positions its children. Here we use mainAxisAlignment to
              // center the children vertically; the main axis here is the vertical
              // axis because Columns are vertical (the cross axis would be
              // horizontal).
              shrinkWrap: true,
              padding: EdgeInsets.all(15.0),
              // mainAxisAlignment: MainAxisAlignment.start,
              // verticalDirection: VerticalDirection.down,
              children: <Widget>[
                for (var org in root.organizations)
                  for (var sale in org.sales)
                    Card(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: <Widget>[
                          CachedNetworkImage(
                              imageUrl:
                                  'https://source.unsplash.com/random/${MediaQuery.of(context).size.width}x${MediaQuery.of(context).size.width / 2}/?horse race ${org.name} ${sale.name}'),
                          ListTile(
                            leading: Icon(Icons.favorite_border),
                            title: Text('${org.name} - ${sale.name}'),
                            subtitle: Text(sale.description),
                          ),
                          ButtonBar(
                            children: <Widget>[
                              FlatButton(
                                child: const Text('VIEW'),
                                onPressed: () {
                                  ThemeProvider.controllerOf(context)
                                      .setTheme(org.theme.id);
                                  Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                          builder: (context) => MultiProvider(
                                                  providers: [
                                                    ChangeNotifierProvider(
                                                        create: (_) => org),
                                                    ChangeNotifierProvider(
                                                        create: (_) => sale)
                                                  ],
                                                  child: ThemeConsumer(
                                                      child: SalePage()))));
                                },
                              ),
                              FlatButton(
                                child: const Text('HIDE'),
                                onPressed: () {/* ... */},
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
              ],
            ),
          ),
        ),
        // floatingActionButton: FloatingActionButton(
        //   onPressed: () => {},
        //   tooltip: 'Increment',
        //   child: Icon(Icons.add),
        // ), // This trailing comma makes auto-formatting nicer for build methods.
      );
    });
  }
}
