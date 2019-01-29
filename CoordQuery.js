var Coord_count = 0;
function CoordLocation() {
    //紀錄坐標與換算
    var cordsel = $("#coordsyt").val();
    var x = $("#coordx").val();
    var y = $("#coordy").val();
    var z = 0;
    if (isNaN(x) === true) {
        alert('請確實輸入數字');
    }
    else {
        if (isNaN(y) === true) {
            alert('請確實輸入數字');
        }
        else {
            var p4326 = transformproj4(cordsel, '4326', [x, y, z]);
            if (p4326[0] > 122 || p4326[0] < 119.9 || p4326[1] > 25.4 || p4326[1] < 21.8) {
                layer.msg("(您可能已經脫離臺灣本島，<br>請檢查您輸入的位數與坐標系統)", {
                    time: 2750,
                    btn: ['確認'],
                });
            }
            var p3826 = transformproj4(cordsel, '3826', [x, y, z]);
            var p3828 = transformproj4(cordsel, '3828', [x, y, z]);
            Coord_count += 1;
            require([
                "esri/geometry/Point",
                "esri/geometry/SpatialReference",
                "esri/Graphic",
                "esri/layers/GraphicsLayer"
            ], function (Point, SpatialReference, Graphic, GraphicsLayer) {
                var point = new Point({
                    x: p4326[0],
                    y: p4326[1],
                    z: p4326[2],
                    spatialReference: new SpatialReference(4326)
                });
                var popupCoord = {
                    title: "坐標定位結果",
                    content: [{
                        type: "fields",
                        fieldInfos: [{
                            fieldName: "WGS84",
                            label: "WGS84經緯度",
                            visible: true,
                        }, {
                            fieldName: "TWD97",
                            label: "TWD97坐標",
                            visible: true,
                        }, {
                            fieldName: "TWD67",
                            label: "TWD67坐標",
                            visible: true,
                        }]
                    }],
                    actions: [
                        { id: "analysis-buffer", className: "esri-icon-filter", title: "分析" },
                        { id: "godirectionP", className: "esri-icon-directions", title: "前往" },
                    ]
                };
                var pointGraphic = new Graphic({
                    geometry: point,
                    symbol: GetSimpleMarkerSymbol('red', 'circle', '14px', [255, 255, 0], 2, 'solid'),
                    attributes: {
                        ID: Coord_count,
                        WGS84: p4326[0].toFixed(5) + ',' + p4326[1].toFixed(5),
                        TWD97: p3826[0].toFixed(1) + ',' + p3826[1].toFixed(1),
                        TWD67: p3828[0].toFixed(1) + ',' + p3828[1].toFixed(1),
                    },
                    popupTemplate: popupCoord
                });
                var temply = new GraphicsLayer();
                temply.title = $("#coordsyt option:selected").text().substring(0, 5) + "坐標定位(id:" + Coord_count + ")";
                TempGroupLayerADD(temply);
                temply.add(pointGraphic);
                if (M2S3 === "S3") {
                    SView.goTo({
                        center: point,
                        zoom: 19,
                        tilt: 20,
                        heading: 0
                    });
                    ga('send', 'event', '坐標定位', cordsel, '3D');
                    SView.popup.open({
                        features: [pointGraphic],
                        location: temply.graphics.items["0"].geometry,
                        updateLocationEnabled: true
                    });
                }
                else {
                    MView.scale = 2000;
                    var opts = {
                        duration: 2000  // Duration of animation will be 5 seconds
                    };
                    MView.goTo({
                        center: point
                    }, opts);
                    ga('send', 'event', '坐標定位', cordsel, '2D');
                    MView.popup.open({
                        features: [pointGraphic],
                        location: temply.graphics.items["0"].geometry,
                        updateLocationEnabled: true
                    });
                }
            })
            closediv('ZoneQueryCoord');
        }
    }
}
