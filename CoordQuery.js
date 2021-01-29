
//綜合定位共用參數區
var gotoMapOPT = { duration: 1250, easing: "out-expo" };
var gotoSceneOPT = { speedFactor: 0.4, easing: "out-expo" }; 
// animate: 有無啟用特效，高於duration/easing
// duration: 特效毫秒數 ； easing: 分Map & Scene兩種
// Map   linear | ease | ease-in | ease-out | ease-in-out
// Scene linear, in-cubic, out-cubic, in-out-cubic, in-expo, out-expo, in-out-expo, in-out-coast-quadratic

//1.GPS定位
function GPSERROR(event) {
    require([
        "esri/Graphic",
        "esri/geometry/SpatialReference"
    ], function (Graphic, SpatialReference) {
        //準備誤差環
        var geometry3 = new THREE.CircleGeometry(event.position.coords.accuracy, 32, 0, 6.3);
        geometry3.vertices.shift();
        var material = new THREE.LineBasicMaterial({ color: "#0000ff" });
        var circle = new THREE.Line(geometry3, material);
        var pc0 = transformproj4('4326', '3826', [event.position.coords.longitude, event.position.coords.latitude, 0]);
        circle.position.x = pc0['0'];
        circle.position.y = pc0['1'];
        circle.position.z = 1;
        var path = [];
        $.each(circle.geometry.vertices, function (key, val2) {
            var singpoint = [];
            var dx = circle.position.x + val2.x;
            var dy = circle.position.y + val2.y;
            var dz = 0;
            var pc2 = transformproj4('3826', '4326', [dx, dy, dz]);
            singpoint.push(pc2['0']);
            singpoint.push(pc2['1']);
            path.push(singpoint);
        });
        var paths = [];
        paths.push(path);
        geo = { type: "polyline", paths: paths, spatialReference: new SpatialReference(4326) };
        pSymbol = GetSimpleLineSymbol('solid', [75, 100, 200], 2);
        pGraphic = new Graphic({
            geometry: geo,
            symbol: pSymbol
        });
        if (M2S3 === "M2") {
            MView.goTo({
                center: [event.position.coords.longitude, event.position.coords.latitude],
                scale: event.position.coords.accuracy * 10 + 500,
            }, gotoMapOPT);
            MView.graphics.add(pGraphic);
        }
        else {
            SView.goTo({
                center: [event.position.coords.longitude, event.position.coords.latitude],
                scale: event.position.coords.accuracy * 10 + 500,
                tilt: 30,
            }, gotoMapOPT);
            SView.graphics.add(pGraphic);
        }
        ga('send', 'event', '綜合定位', 'GPS定位', '圖上按鈕');
        layer.msg("提醒您，GPS可能<br>受環境因素影響精確度<br>藍色環線為誤差參考值", { time: 6666, btn: ['我知道了'] });
    });
}

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
                    x: p4326[0].toFixed(6),
                    y: p4326[1].toFixed(6),
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
                        features: temply.graphics,
                        location: temply.graphics.items["0"].geometry,
                        featureMenuOpen: true,
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
                        features: temply.graphics,
                        location: temply.graphics.items["0"].geometry,
                        featureMenuOpen: true,
                        updateLocationEnabled: true
                    });
                }
            })
            closediv('ZoneQueryCoord');
        }
    }
    ga('send', 'event', '綜合定位', '坐標定位', '定位');
}

function callgps() {
    if (M2S3 === "M2") {
        MView.graphics.removeAll();
        MLocateBtn.locate()
    }
    else {
        SLocateBtn.locate()
    };
    ga('send', 'event', '綜合定位', 'GPS定位', '定位');
}



function taiwanpower1() {
    ga('send', 'event', '綜合定位', '電桿定位', '開啟頁面');
    layer.open({
        type: 1 //2是iframe
        , title: '電桿定位功能'
        , area: ['280px', '280px']
        , shade: 0
        , content: '<div class="layui-card"><div class="layui-card-header">請輸入電桿代碼</div>'
        + '<div class="layui-card-body">'
        + '<input type="text" id="coorp" name="title" placeholder= "請輸入電桿代碼" autocomplete="off" class="layui-input" >'
        + '<br>'
        + '<p> 例如： B1916FA60 </p>'
        + '<button class="layui-btn layui-btn-normal layui-btn-radius" onclick="layer.closeAll();taiwanpower2();">定位</button>'
        + '</div></div>'
        , btn: ['取消返回'], yes: function (index, layero) {
            ga('send', 'event', '綜合定位', '電桿定位', '關閉頁面');
            layer.close(layer.index);
        }
    });
}
function taiwanpower2() {
    var str = $('#coorp')['0'].value;
    if (str === '') {
        layer.msg('請輸入電桿代碼')
    }
    else {
        var s1 = str.substring(0, 1);
        var s2 = str.substring(1, 3);
        var s3 = str.substring(3, 5);
        var s4x = str.substring(5, 6);
        var s4y = str.substring(6, 7);
        var s5 = str.substring(7, 11);
        switch (s1) {
            case 'A':
                s1 = [170000, 2750000];
                break;
            case 'B':
                s1 = [250000, 2750000];
                break;
            case 'C':
                s1 = [330000, 2750000];
                break;
            case 'D':
                s1 = [170000, 2700000];
                break;
            case 'E':
                s1 = [250000, 2700000];
                break;
            case 'F':
                s1 = [330000, 2700000];
                break;
            case 'G':
                s1 = [170000, 2650000];
                break;
            case 'H':
                s1 = [250000, 2650000];
                break;
            case 'J':
                s1 = [90000, 2600000];
                break;
            case 'K':
                s1 = [170000, 2600000];
                break;
            case 'L':
                s1 = [250000, 2600000];
                break;
            case 'M':
                s1 = [90000, 2550000];
                break;
            case 'N':
                s1 = [170000, 2550000];
                break;
            case 'O':
                s1 = [250000, 2550000];
                break;
            case 'P':
                s1 = [90000, 2500000];
                break;
            case 'Q':
                s1 = [170000, 2500000];
                break;
            case 'R':
                s1 = [250000, 2500000];
                break;
            case 'T':
                s1 = [170000, 2450000];
                break;
            case 'U':
                s1 = [250000, 2450000];
                break;
            case 'V':
                s1 = [170000, 2400000];
                break;
            case 'W':
                s1 = [250000, 2400000];
                break;
        }
        switch (s4x) {
            case 'A':
                s4x = 0
                break;
            case 'B':
                s4x = 100
                break;
            case 'C':
                s4x = 200
                break;
            case 'D':
                s4x = 300
                break;
            case 'E':
                s4x = 400
                break;
            case 'F':
                s4x = 500
                break;
            case 'G':
                s4x = 600
                break;
            case 'H':
                s4x = 700 
                break;
        }
        switch (s4y) {
            case 'A':
                s4y = 0
                break;
            case 'B':
                s4y = 100
                break;
            case 'C':
                s4y = 200
                break;
            case 'D':
                s4y = 300
                break;
            case 'E':
                s4y = 400
                break;
        }
        var x;
        var y;
        if (s5.length === 2) {
            x = parseInt(s1[0]) + parseInt(s2 * 800) + parseInt(s4x) + parseInt(s5.substring(0, 1) * 10)
            y = parseInt(s1[1]) + parseInt(s3 * 500) + parseInt(s4y) + parseInt(s5.substring(1, 2) * 10)
        }
        else if (s5.length === 4) {
            x = parseInt(s1[0]) + parseInt(s2 * 800) + parseInt(s4x) + parseInt(s5.substring(0, 1) * 10) + parseInt(s5.substring(2, 3))
            y = parseInt(s1[1]) + parseInt(s3 * 500) + parseInt(s4y) + parseInt(s5.substring(1, 2) * 10) + parseInt(s5.substring(3, 4))
        }
        else {
            alert('請輸入正確電桿代碼')
        }
        var cordsel = "3828";
        var z = 0;
        var p4326 = transformproj4(cordsel, '4326', [x, y, z]);
        if (p4326[0] > 122 || p4326[0] < 119.9 || p4326[1] > 25.4 || p4326[1] < 21.8) {
            layer.msg("(您可能已經脫離臺灣本島，<br>請檢查您輸入的資料)", {
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
                title: "電桿定位結果",
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
                    }, {
                        fieldName: "POWER",
                        label: "電桿代號",
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
                    POWER: str
                },
                popupTemplate: popupCoord
            });
            var temply = new GraphicsLayer();
            temply.title = "電桿定位id: " + str;
            TempGroupLayerADD(temply);
            temply.add(pointGraphic);
            if (M2S3 === "S3") {
                SView.goTo({
                    center: point,
                    zoom: 19,
                    tilt: 20,
                    heading: 0
                });
                

                return SView.goTo({
                    center: point,
                    zoom: 19,
                    tilt: 20,
                    heading: 0
                }).then(function (results) {
                    ga('send', 'event', '電桿定位', cordsel, '3D');
                    qLoaded();
                    SView.popup.open({
                        features: [pointGraphic],
                        location: temply.graphics.items["0"].geometry,
                        updateLocationEnabled: true
                    });
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
                return MView.goTo({ center: point }, opts).then(function (results) {
                    ga('send', 'event', '電桿定位', cordsel, '2D');
                    qLoaded();
                    MView.popup.open({
                        features: [pointGraphic],
                        location: temply.graphics.items["0"].geometry,
                        updateLocationEnabled: true
                    });
                });
            }
        })
    }
    ga('send', 'event', '綜合定位', '電桿定位', '定位');
}