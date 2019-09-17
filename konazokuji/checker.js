$(function(){

  //文字列 -> 数字列 の変換を行う
  //fc2は日本語名のファイルが作成できないため
  var str2int = function(str){
    var encoder = new TextEncoder("utf-8");
    enc = encoder.encode(str).join('');
  	return encodeURIComponent(enc)
  }

  $('#submit').on('click', function(){
    $('#message').text('チェック中...');
    //ボタンを無効化
    $('#submit').prop('disabled', true);

    //ファイル名確認用
    //console.log(str2int($('#answer').val()));

    //ajax通信を行う
    $.ajax({
      url: './answer/'+str2int($('#answer').val()),
      type: 'get',
      timeout: 2000,
      dataType: 'text',
    })
    .done(function(data){
      //通信成功時に実行
      //dataには答えファイルの中身が入っている
      //答えファイルの書式・処理の仕方は自由
      //ここでは、'ok',遷移先URL、数字列化する前の文字列、をそれぞれカンマ区切りにしている
      res = data.replace('\n','').split(',')
      //確認用
      //console.log(res);
      if(res[0] == 'ok'){
        $('#message').text('正解です');
        correct(data);
      }
      else{
        $('#message').text('不正解です');
      }
    })
    .fail(function(jqXHR, textStatus, errorThrown){
      //通信失敗時に実行
      if(textStatus == 'timeout'){
        //タイムアウト
        $('#message').text('通信障害が発生しています');
      }
      else{
        $('#message').text('不正解です');
      }
    })
    .always(function(){
      //常に実行
      $('#submit').prop('disabled', false);
    });

  });


	$('.tweet-button').on('click',function(){
	    window.open('https://twitter.com/intent/tweet?text=小謎くじに隠されていた謎を解き明かしました!&hashtags=小謎くじ');
		});
});
