$(function(){
  //環境確認
  //TODO: -> 非対応なはずだけどちゃんといけちゃう。条件抜けてそう
  /*
  if(!(window.DeviceorientationEvent || window.orientationEvent) || !window.DevicemotionEvent){
    alert("非対応です。ごめんなさい。");
  }
  */

  // 加速度
  window.addEventListener('devicemotion', devicemotionHandler, true);

  function devicemotionHandler(e){
    var x = e.accelerationIncludingGravity.x; // X方向の加速度
    var y = e.accelerationIncludingGravity.y; // Y方向の加速度
    var z = e.accelerationIncludingGravity.z; // Z方向の加速度

    $("#print_x").text('x:' + (x|0) );
    $("#print_y").text('y:' + (y|0) );
    $("#print_z").text('z:' + (z|0) );

    // 振られたとき
    if (Math.abs(x) > 20 && Math.abs(y) > 20 && Math.abs(z) > 20) {
  		alert("振ってるよ");
  	}
  };

  // 向き
  window.addEventListener("deviceorientation", deviceorientationHandler, true);

  // ジャイロセンサーの値が変化
  function deviceorientationHandler(e){
    const beta = e.beta;
    const gamma = e.gamma;
    const alpha = e.alpha;
    const dir = getCompassHeading(alpha, beta, gamma);
    $("#print_dir").text('dir:' + (dir|0) );


    //compass
    $('#circle').css({'transform': 'rotate(' + dir|0 + 'deg)'});
  };

  function getCompassHeading(alpha, beta, gamma){
    const degtorad = Math.PI / 180;

    const _x = beta ? beta * degtorad : 0;
    const _y = gamma ? gamma * degtorad : 0;
    const _z = alpha ? alpha * degtorad : 0;

    const cY = Math.cos(_y);
    const cZ = Math.cos(_z);
    const sX = Math.sin(_x);
    const sY = Math.sin(_y);
    const sZ = Math.sin(_z);

    const Vx = -cZ * sY - sZ * sX * cY;
    const Vy = -sZ * sY + cZ * sX * cY;

    let compassHeading = Math.atan(Vx / Vy);

    if (Vy < 0){ compassHeading += Math.PI;}
    else if(Vx < 0){ compassHeading += 2 * Math.PI;}
    return compassHeading * ( 180 / Math.PI );
  };

  size = Math.min($("#main").width(),$("#main").height());
  $("#compass").width(size);
  $("#compass").height(size);
  centering($("#compass"));
  centering($("#circle"));
  centering($("#circle-out"));
  centering($("#compass-progress"));

  $("#circle-north").height(size*0.9*0.04);

  needle_size_rate = 0.7
  $("#needle").width(size*0.9*needle_size_rate);
  $("#needle").height(size*0.9*needle_size_rate);
  centering($("#needle"));
  $("#needle-red").width(size*0.9*needle_size_rate/2);
  $("#needle-white").width(size*0.9*needle_size_rate/2);
  $("#needle-red").css({'marginLeft': -size*0.9*needle_size_rate/4});
  $("#needle-white").css({'marginLeft': -size*0.9*needle_size_rate/4});

  // 渡したblock要素をセンタリングする
  function centering(block){
    block.css({'top':'50%', left:'50%'});
    let w = block.width();
    let h = block.height();
    block.css({'marginTop':-w/2 ,'marginLeft':-h/2});
  };

  //プログレスバー
  var element = document.getElementById("compass-progress");
  var compass_progress = new ProgressBar.Circle('#compass-progress', {
    color: '#aedefc',
    strokeWidth: 0.3,
  });

  compass_progress.animate(0.5);

});
