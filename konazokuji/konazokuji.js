$(function(){
  $('.drawer-inner').on('click',function(e){
    id = $(this).parent().attr('id');
    if(e.offsetY < 150){
      $('#'+id+' .drawer-inner').animate({
        'top': '-150px'
      },300);
    }
    else{
      $('#'+id+' .drawer-inner').animate({
        'top': '0px'
      },300);
    }
  });

});

var correct = function(responseText){
  res = responseText.replace('\n','').split(',')
  console.log(res);
  if(isFinite(parseInt(res[0]))){
    $('#drawer-'+res[0]+' .drawer-inner').animate({
      'backgroundColor': '#ffb6b9'
    });
    $('#drawer-'+res[0]+' .drawer-inner .text').animate({
      'color': '#c40018'
    });
    $('#drawer-'+res[0]+' .drawer-inner .hint').animate({
      'color': '#ffffff'
    });
    $('#drawer-'+res[0]+' .drawer-inner .hint').html(res[1]);
  }
  else{
    window.location.href = res[0];
  }
}
