var map, univData

function init() {
    map = L.map("map");
    map.setView([36,140],8);


    //地理院地図の標準地図スタイル
    var gsi=L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png',{attribution:"<a href='http://maps.gsi.go.jp/development/ichiran.html' target='_blank'>地理院タイル</a>"});
    //地理院地図の淡色地図スタイル
    var gsipale=L.tileLayer('http://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png',{attribution:"<a href='http://portal.cyberjapan.jp/help/termsofuse.html' target='_blank'>地理院タイル</a>"});
    //オープンストリートマップのタイル
    var osm=L.tileLayer('http://tile.openstreetmap.jp/{z}/{x}/{y}.png',{attribution:"<a href='http://osm.org/copyright' target='_blank'>OpenStreetMap</a> contributions"});

    var baseMaps = {
        "地理院の標準地図":gsi,
        "地理院の淡色地図":gsipale,
        "オープンストリートマップ":osm
    };

    L.control.layers(baseMaps).addTo(map);
    L.control.scale({ maxWidth: 200,position: "bottomright", imperial: false}).addTo(map);
    gsi.addTo(map);

    //report.txtの取得
    var obj = new XMLHttpRequest();
    obj.onreadystatechange = function(){
        a = obj.responseText
        if(obj.readyState == 4 && obj.status == 200)ReadJson(a);
    }
    obj.open("get","report.txt");
    obj.setRequestHeader("if-Modified-Since","01 Jan 2000 00:00:00 GMT");
    obj.send(null);


    //ツアー開始ボタン、停止ボタンの表示
    var y = document.getElementById("tour");
    y.innerHTML='<input type="text" id="tourR" value="5" size="1">周<br>'
        +'<a class="button" onclick="StartTour()">ツアー開始</a>'
        +'<a class="button" onclick="StopTour()">ツアー停止</a><br>'
        +'<span id="now"></span>';

    
    //リセットボタンの表示
    var x = document.getElementById("reset");
    x.innerHTML='<a class="button" onclick="Reset()">リセット</a>';
}

//report.txtを読み込んでマーカーとリンクを表示する関数
function ReadJson(text){
    univData = eval("("+text+")");//univのデータをevalする
    var points = new Array();
    //0:茨城　1:宇都宮　2:群馬　3:埼玉
    console.log(univData.univ.length);
    for (var i=0; i<univData.univ.length; i++){
        var point = [univData.univ[i].lat, univData.univ[i].lng];
        AddMarker(point,univData.univ[i].name,univData.univ[i].url);//マーカーを追加
        AddLink(univData.univ[i].name,point);//リンク追加
        points[i] = point;//座標を記憶
    }
    points[i] = points[0]; //i=4にも茨城大の座標を入れる

    //大学間を赤い折れ線で繋ぐ
    L.polyline(points,{color:'red',weight:5}).addTo(map);//色、太さを指定
}

//マーカーを追加する関数
function AddMarker(point,name,url){
    //マーカーオブジェクトの生成
    var text = "<a href='"+url+"' target='_new'>"+name+"</a>";
    var popup = L.popup({maxWidth:550}).setContent(text);
    //マーカーにポップアップを紐付ける
    L.marker(point).bindPopup(popup).addTo(map);
}

//リンクを追加する関数
function AddLink(name,point){
    var lnk = document.createElement("a");//aタグ要素を追加  
    lnk.innerHTML=name;//リンクの表示文字列は大学名
    lnk.href="#";//リンクは埋め込まないので#とする
    lnk.onclick=function(){GoTo(point[0],point[1]);};
    var b = document.getElementById("link")
    b.appendChild(lnk);//リンクを追加    
    var br=document.createElement("br");//スラッシュを追加
    b.appendChild(br);//改行を追加

}

//リンクをクリックするとジャンプする関数
function GoTo(lat,lng){map.setView([lat,lng]);}

//リセットする関数
function Reset(){
    document.getElementById("link").innerHTML="";
    document.getElementById("reset").innerHTML="";
    document.getElementById("tour").innerHTML="";
}

//以下。ツアー用の関数と変数
var tourMax; //tourMaxは移動の総回数を保持する変数
var timerID = new Array();//timerIDは各移動用タイマーのIDを保持する配列

//ツアー開始用の関数（移動タイマーをリセット）
function StartTour(){
    var num=0; //numは大学番号を保持(num=0は茨城大)
    var round=1; //roundは現在何周目であるかを表す
    //ユーザー指定の周数*大学数+1（最後の＋１は茨城大に戻る分）
    tourMax=document.getElementById("tourR").value*univData.univ.length+1;
    for(var i=0; i<tourMax; i++){ //各移動ごとにタイマーをセットする
        if(num>=univData.univ.length){
            num=0; round++;// 1周したら大学を茨城大(num=0)にし、周数を1増やす
        }
        var point=[univData.univ[num].lat,univData.univ[num].lng];
        moveTimer(i,round,point,univData.univ[num].name); //移動タイマーをセット
        num++;
    }
    //現況表示をクリアするためのタイマーをセット
    timerID[i]=setTimeout(function(){document.getElementById("now").innerHTML="";},i*1000);
}

//移動用タイマーをセットする関数
function moveTimer(i,round,point,name){
    timerID[i]=setTimeout( //i * 100ミリ秒後に1回だけfunctionを実行するタイマー
        function(){
            map.panTo(point);
            document.getElementById("now").innerHTML="("+round+"周目）現在、"+name+"です。";
        },
        i*1000
    );
}

//ツアー停止用の関数
function StopTour(){
    for(var i=0; i<tourMax+1;i++){
        clearTimeout(timerID[i]);
    }
    document.getElementById("now").innerHTML="";
}

//画像を表示する関数
let num1 = 1;
function changeImage() {
    if (num1 === 3) {
        num1 = 1;
    } else {
        num1++;
    }
    document.getElementById("pic1").src = "http://localhost/webeng/report/image/ダチョウ王国/" + num1 + ".JPG";
}

let num2 = 1;
function changeImage2() {
    if (num2 === 5) {
        num2 = 1;
    } else {
        num2++;
    }
    document.getElementById("pic2").src = "http://localhost/webeng/report/image/チームラボ/" + num2 + ".JPG";
}

let num3 = 1;
function changeImage3() {
    if (num3 === 5) {
        num3 = 1;
    } else {
        num3++;
    }
    document.getElementById("pic3").src = "http://localhost/webeng/report/image/ディズニーランド/" + num3 + ".JPG";
}

let num4 = 1;
function changeImage4() {
    if (num4 === 5) {
        num4 = 1;
    } else {
        num4++;
    }
    document.getElementById("pic4").src = "http://localhost/webeng/report/image/ネモフィラ/" + num4 + ".JPG";
}

let num5 = 1;
function changeImage5() {
    if (num5 === 5) {
        num5 = 1;
    } else {
        num5++;
    }
    document.getElementById("pic5").src = "http://localhost/webeng/report/image/偕楽園/" + num5 + ".JPG";
}