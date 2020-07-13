import 'package:carousel_slider/carousel_slider.dart';
import 'package:flutter/material.dart';
import 'package:flutter_demo/models/organization_model.dart';
import 'package:flutter_demo/models/sale_model.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';

class SalePage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Consumer2<OrganizationModel, SaleModel>(
        builder: (context, org, sale, child) {
      return Scaffold(
          appBar: AppBar(
            title: Text('${org.name} - ${sale.name}'),
          ),
          body: CarouselSlider(
              options: CarouselOptions(
                  height: MediaQuery.of(context).size.height,
                  enlargeCenterPage: true),
              items: <Widget>[
                for (var horse in sale.horses)
                  ListView(
                    shrinkWrap: true,
                    // padding: EdgeInsets.all(0.0),
                    children: <Widget>[
                      // Yeah... just trying to generate some content
                      for (int i = 0; i < 5; i++)
                        Card(
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: <Widget>[
                              CachedNetworkImage(
                                  imageUrl:
                                      'https://source.unsplash.com/random/${MediaQuery.of(context).size.width}x${MediaQuery.of(context).size.width / 2}/?horse race ${org.name} ${sale.name} ${horse.name}'),
                              ListTile(
                                leading: Icon(Icons.favorite_border),
                                title: Text(horse.name),
                                subtitle: Text(sale.description),
                              ),
                              ButtonBar(
                                children: <Widget>[
                                  FlatButton(
                                    child: const Text('BUY TICKETS'),
                                    onPressed: () {/* ... */},
                                  ),
                                  FlatButton(
                                    child: const Text('LISTEN'),
                                    onPressed: () {/* ... */},
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                    ],
                  ),
              ]));
    });
  }
}
