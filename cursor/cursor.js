//cursor.js (c) 2018 amigurumicats
//nyao!

var context = new AudioContext();
// Audio 用の buffer を読み込む
var getAudioBuffer = function(url, fn){
  var req = new XMLHttpRequest();
  req.responseType = 'arraybuffer';
  req.onreadystatechange = function() {
    if (req.readyState === 4){
      if (req.status === 0 || req.status === 200){
        // array buffer を audio buffer に変換
        context.decodeAudioData(req.response, function(buffer){
          fn(buffer);
        });
      }
    }
  };
  req.open('GET', url, true);
  req.send('');
};

// サウンドを再生
var playSound = function(buffer){
  var source = context.createBufferSource();
  source.buffer = buffer;
  source.connect(context.destination);
  source.start(0);
};

//画像のプリロード
var image = [];
image[0] = new Image(); image[0].src = './assets/cursor_normal.png';
image[1] = new Image(); image[1].src = './assets/cursor_text.png';
image[2] = new Image(); image[2].src = './assets/cursor_grab.png';
image[3] = new Image(); image[3].src = './assets/cursor_grabbing.png';
image[4] = new Image(); image[4].src = './assets/cursor_hourglass_1.png';
image[5] = new Image(); image[5].src = './assets/cursor_hourglass_2.png';
image[6] = new Image(); image[6].src = './assets/cursor_hourglass_3.png';
image[7] = new Image(); image[7].src = './assets/cursor_hourglass_4.png';
image[8] = new Image(); image[8].src = './assets/cursor_hourglass_5.png';
image[9] = new Image(); image[9].src = './assets/cursor_hourglass_6.png';
image[10] = new Image(); image[10].src = './assets/cursor_hourglass_7.png';
image[11] = new Image(); image[11].src = './assets/cursor_hourglass_8.png';
image[12] = new Image(); image[12].src = './assets/cursor_hourglass_9.png';
image[13] = new Image(); image[13].src = './assets/cursor_copy.png';
image[14] = new Image(); image[14].src = './assets/cursor_sonar.png';
image[15] = new Image(); image[15].src = './assets/cursor_pen.png';


var make6path = function(wait_time){
  var array = [1,2,1,2,3,4,3,4,5,6,5,6,7,8,7,8,9];
  if(wait_time < 18){
    return 'url(' + image[array[wait_time-1]+3].src + '),auto';
  }
  return 'url(' + image[12].src + '),auto';
}

$(function(){

  //stage-0
  $('#stage-0').mousemove(function(e){
    var classname = e.target.className;
    if(classname == 'invert') $(this).css('cursor','url('+image[1].src+'),auto');
    else $(this).css('cursor','url('+image[0].src+'),auto');
  });

  $('#stage-0 .button').on('click',function(){
    $('html,body').animate({
      scrollLeft: $('#stage-1').offset().left
    },1200);
  });

  //stage-1
  //カーソル
  $('#stage-1').hover(function(){
    $(this).css('cursor','url('+image[2].src+'),auto');
  });
  $('#stage-1').mouseup(function() {
    $(this).css('cursor','url('+image[2].src+'),auto');
  }).mousedown(function() {
    $( this ).css('cursor','url('+image[3].src+'),auto');
  });
  //文字
  $('#stage-1 .char').draggable({
    containment: '#stage-1',
    scroll: false,
  });
  //クリアチェック
  var starttime;
  $('#stage-1 #stage-1-outercircle')
  .mouseup(function(){
    var currenttime = new Date();
    //console.log(currenttime - starttime);
    if(currenttime - starttime > 5000){
      $('html,body').animate({
        scrollLeft: $('#stage-2').offset().left
      },1200);
    }
  })
  .mousedown(function(){
    starttime = new Date();
  });
  var grabsx = -1;
  var grabsy = -1;
  var width_1 = $('#stage-1').width();
  var height_1 = $('#stage-1').height();
  var range_1 = Math.min(width_1,height_1)/5;
  var turned_flag = false;
  //カーソル
  $('#stage-1').hover(function(){
    $(this).css('cursor','url(./assets/cursor_grab.png),auto');
  });
  $('#stage-1').mouseup(function(){
    $(this).css('cursor','url(./assets/cursor_grab.png),auto');
    grabsx = -1;
    grabsy = -1;
  }).mousedown(function(e){
    $(this).css('cursor','url(./assets/cursor_grabbing.png),auto');
    if(e.offsetX > width_1 - range_1 && e.offsetY < range_1){
      grabsx = e.offsetX;
      grabsy = e.offsetY;
    }
  }).mousemove(function(e){
    if(grabsx != -1){
      var distance = Math.sqrt(Math.pow(e.offsetX - (grabsx), 2) + Math.pow(e.offsetY - (grabsy), 2));
      //console.log(distance);
      if(distance > 80 && grabsx - e.offsetX > 0 && grabsy - e.offsetY < 0){
        //めくれる
        if(!turned_flag){
          turned_flag = true;
          console.log('ペラッ');
          $('#stage-1 .corner').animate({opacity: 0.4}, 500);
          $('#stage-1 .corner').css({pointerEvents: 'auto'});
          getAudioBuffer('./assets/page06.mp3',function(buffer){ playSound(buffer) });
        }
      }
    }
  });

  //stage-2
  //ソナー
  var clicktime = new Date();
  $('#stage-2').on('click',function(e){
    var id = e.target.id;
    if(id == 'stage-2'){
      var currenttime = new Date();
      if(currenttime - clicktime > 1000){
        clicktime = currenttime;
        var timeline = new TimelineMax();
        timeline.set('#sonar', {
          visibility: 'visible',
          width: 1,
          height: 1,
          top: e.offsetY,
          left: e.offsetX,
        });
        timeline.to("#sonar", 1, {
          width: 1000,
          height: 1000,
          top: '-=500',
          left: '-=500',
          ease: Power0.easeNone,
        });
        timeline.set("#sonar", {
          visibility: 'hidden',
          width: 1,
          height: 1,
        });
        point = $('#stage-2 #point').position();
        var distance = Math.sqrt(Math.pow(e.offsetX - (point.left), 2) + Math.pow(e.offsetY - (point.top), 2))-24;
        getAudioBuffer('./assets/sonar.mp3',function(buffer){ playSound(buffer) });
        if(distance < 500){
          var timeline2 = new TimelineMax();
          timeline2.to('#sonar', 0.2,{
            delay: distance/500,
            borderWidth: 8,
          });
          timeline2.to('#sonar', 0.2, {
            borderWidth: 1,
          });
        }
      }
    }
    else if(id == 'point'){
      $('html,body').animate({ scrollTop: $('#stage-3').offset().top },1000);
    }

  });
  //カーソル
  $('#stage-2').hover(function(){
    $(this).css('cursor','url('+image[14].src+'),auto');
  });

  //stage-3
  //カーソル
  $('#stage-3').hover(function(){
    $(this).css('cursor','none');
  });
  $('#stage-3').on('mouseover', function() {
    $('#stage-3 #cursor_img').css({'visibility': 'visible'});
  }).on('mouseout', function() {
    $('#stage-3 #cursor_img').css({'visibility': 'hidden'});
  });
  //canvas設定
  var canvas_w = $('#stage-3').width() * 2;
  var canvas_h = $('#stage-3').height() * 2;
  $('#stage-3 #canvas').attr({'width': canvas_w, 'height': canvas_h});
  $('#stage-3 #canvas').width(canvas_w/2);
  $('#stage-3 #canvas').height(canvas_h/2);
  //描画
  var ctx = $('#stage-3 #canvas')[0].getContext('2d');
  var prevX,prevY;
  var pressed = false;
  $('#stage-3 #canvas').mouseup(function() {
    pressed = false;
  }).mousedown(function(e) {
    pressed = true;
    prevX = e.offsetX * 2;
    prevY = e.offsetY * 2;
  }).mousemove(function(e){
    //カーソル
    $('#stage-3 #cursor_img').css({
      'top': e.clientY-16,
      'left': e.clientX,
    });
    var x = e.offsetX * 2;
    var y = e.offsetY * 2;
    if(pressed){
      ctx.strokeStyle = "#339900";
      ctx.lineWidth = 20;
      ctx.lineJoin= "round";
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(prevX, prevY);
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.closePath();
    }
    prevX = x;
    prevY = y;
  });

  //クリアチェック
  var checkpixel = function(data){
    if(data[0] != 51) return false;
    if(data[1] != 153) return false;
    if(data[2] != 0) return false;
    return true;
  }
  var imageData;
  $('#stage-3 #canvas').on('click',function(){
    //console.log('1');
    imageData = ctx.getImageData(20, 20, 1, 1).data;
    if(!(checkpixel(imageData))) return;
    //console.log('2');
    imageData = ctx.getImageData(canvas_w-20, 20, 1, 1).data;
    if(!(checkpixel(imageData))) return;
    //console.log('3');
    imageData = ctx.getImageData(20, canvas_h-20, 1, 1).data;
    if(!(checkpixel(imageData))) return;
    //console.log('4');
    imageData = ctx.getImageData(canvas_w-20, canvas_h-20, 1, 1).data;
    if(!(checkpixel(imageData))) return;
    $('html,body').animate({
      scrollTop: $('#stage-4').offset().top
    },1000);
  });

  //stage-4
  $('#stage-4').hover(function(){
    $(this).css('cursor','url('+image[1].src+'),auto');
  });
  $('#stage-4 #next').on('click',function(){
    $('html,body').animate({
      scrollLeft: $('#stage-5').offset().left
    },1200);
  });

  //stage-5
  $('#stage-5 .button').on('click',function(){
    textVal = 'ここを連打';
    var copyFrom = document.createElement("textarea");
    copyFrom.textContent = textVal;
    var bodyElm = document.getElementsByTagName("body")[0];
    bodyElm.appendChild(copyFrom);
    copyFrom.select();
    var retVal = document.execCommand('copy');
    bodyElm.removeChild(copyFrom);
  });
  //カーソル
  $('#stage-5').mousemove(function(e){
    var classname = e.target.className;
    if(classname == 'textarea') $("#stage-5 .textarea").css('cursor','url('+image[13].src+'),auto');
    else $(this).css('cursor','url('+image[0].src+'),auto');
  });
  //クリアチェック
  var clicknum = 0;
  $('#stage-5 .textarea').on('click',function(){
    var currenttime = new Date();
    if(currenttime - clicktime > 1000) clicknum = 0;
    else clicknum += 1;
    if(clicknum == 10){
      $('html,body').animate({
        scrollLeft: $('#stage-6').offset().left
      },1200);
    }
    clicktime = currenttime;
  });

  //stage-6
  var wait_time = 0;
  var timer_stage_6;
  //カーソル
  $('#stage-6').hover(function(){
    $('#stage-6').css('cursor',make6path(1));
  });
  //砂時計
  $('#stage-6')
    .mouseover(function(){
      timer_stage_6 = setInterval(function(){
        wait_time += 1;
        //console.log(wait_time);
        //console.log(make6path(wait_time));
        $('#stage-6').css('cursor',make6path(wait_time));
        if(wait_time == 17){
          clearInterval(timer_stage_6);
          $('html,body').animate({
            scrollTop: $('#stage-7').offset().top
          },1000);
        }
      }, 1000);
    })
    .mouseout(function(){
      clearInterval(timer_stage_6);
      wait_time = 0;
    })
    .mousemove(function(){
      wait_time = 0;
    });

  //stage-7
  var grabsx = -1;
  var grabsy = -1;
  var width_7 = $('#stage-7').width();
  var height_7 = $('#stage-7').height();
  var range_7 = Math.min(width_7,height_7)/5;
  var turned_flag = false;
  //カーソル
  $('#stage-7').hover(function(){
    $(this).css('cursor','url(./assets/cursor_grab.png),auto');
  });
  $('#stage-7').mouseup(function(){
    $(this).css('cursor','url(./assets/cursor_grab.png),auto');
    grabsx = -1;
    grabsy = -1;
  }).mousedown(function(e){
    $(this).css('cursor','url(./assets/cursor_grabbing.png),auto');
    if(e.offsetX > width_7 - range_7 && e.offsetY < range_7){
      grabsx = e.offsetX;
      grabsy = e.offsetY;
    }
  }).mousemove(function(e){
    if(grabsx != -1){
      var distance = Math.sqrt(Math.pow(e.offsetX - (grabsx), 2) + Math.pow(e.offsetY - (grabsy), 2));
      //console.log(distance);
      if(distance > 80 && grabsx - e.offsetX > 0 && grabsy - e.offsetY < 0){
        //めくれる
        if(!turned_flag){
          turned_flag = true;
          // console.log('ペラッ');
          $('#stage-7 .corner').animate({opacity: 0.4}, 500);
          $('#stage-7 .corner').css({pointerEvents: 'auto'});
          getAudioBuffer('./assets/page06.mp3',function(buffer){ playSound(buffer) });
        }
      }
    }
  });
  //うごかせるもの
  $('#stage-7 .circle').draggable({
    containment: '#stage-7',
    scroll: false,
  });
  $('#stage-7 #text-7-1').draggable({
    containment: '#stage-7',
    scroll: false,
  });
  //上へ
  $('#stage-7 .corner').on('click',function(){
    $('html,body').animate({
      scrollTop: $('#stage-0').offset().top
    },1000);
  });
  //右へ
  $('#stage-7 #stage-7-circle')
  .mouseup(function(){
    var currenttime = new Date();
    //console.log(currenttime - starttime);
    if(currenttime - starttime > 5000){
      $('html,body').animate({
        scrollLeft: $('#stage-8').offset().left
      },2000);
    }
  })
  .mousedown(function(){
    starttime = new Date();
  });


  //stage-8
  $('#stage-8 .button').on('click',function(){
    window.open('https://twitter.com/intent/tweet?text=cursorをクリアしました! http://amigurumicats.github.io/cursor/cursor.html&hashtags=カーソル');
  });


});
