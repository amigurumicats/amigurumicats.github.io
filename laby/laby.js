//laby.js (c) 2016 @amigurumicats
//nyao!

$(function(){
	var position = 16;
	var count = 0;
	var list = new Array(5);
	var counter = 10;
	
	function Map(){
		this.vertical = "------ ------ ------ ------ ------";
		this.horizon = "----- ----- ----- ----- ----- -----";
	}
	
	var mapnum =  Math.floor(Math.random()*5);
	var map = new Array(6);
	for(var i = 0;i < 6;i++){
		map[i] = new Map();
	}
	map[0].vertical = "-#--#----##------#--#-#----#--";
	map[0].horizon = "-------#---#-#--#-#-#--------#";
	map[1].vertical = "--#---#####-----##-#----#----#";
	map[1].horizon = "----#---#--##---###--#-#-----#";
	map[2].vertical = "-#-----###---#---##--#--------";
	map[2].horizon = "------#-#----##-##---#--#-#---";
	map[3].vertical = "-------#-##--###-##--##--#----";
	map[3].horizon = "#--#---#-#-#-#-------#------#-";
	map[4].vertical = "----#---##---#--#--#--#-#----#";
	map[4].horizon = "--#--#--#--#-#- ##----###------";
	
	$(".button").hover(
		function(){
			if(!isGoal(position)){
				$(this).stop().animate({backgroundColor:"#EEEEEE"},200);
			}
		},
		function(){
			if(!isGoal(position)){
				$(this).stop().animate({backgroundColor:"#FFFFFF"},100);
			}
		}
	);
	
	
	$("#go").click(function(){
		if(!isGoal()){
			if(count == 5){
				move(position = calc(position));
				counter -= 1;
				$("#counter").text(counter);
				if(!counter){
					$("#counter").css("color","#FF0000");
				}
				if(isGoal(position)){
					clearList();
					$("#end").css("visibility","visible");
					$("#tweet-btn").css("visibility","visible");
					$(this).stop().animate({backgroundColor:"#FFFFFF"},100);
					
					return;
				}
				clearList();
			}
		}
	});
	
	$("#delete").click(function(){
		if(!isGoal(position)){
			clearList();
		}
	});
	
	$("#reset").click(function(){
		if(!isGoal(position)){
			position = 16;
			move(position);
			clearList();
		}
	});
	
	$(window).keydown(function(key){
		if(!isGoal(position) && key.keyCode < 41 && key.keyCode > 36 && count < 5 && counter){
			list[count] = key.keyCode - 37;
			switch(list[count]){
				case 0:
					$("#left"+count).css("visibility","visible");
					break;
				case 1:
					$("#up"+count).css("visibility","visible");
					break;
				case 2:
					$("#right"+count).css("visibility","visible");
					break;
				case 3:
					$("#down"+count).css("visibility","visible");
					break;
				}
			count++;
		}
	});
	
	var move = function(position){
		var x = (position % 5) * 80;
		var y = (position / 5 | 0) * 80;
		$("#box").css("top",y).css("left",x);
	};
	
	var clearList = function(){
		for(var i = 0;i < 5;i++){
			list[i] = 0;
		}
		$(".left").css("visibility","hidden");
		$(".up").css("visibility","hidden");
		$(".right").css("visibility","hidden");
		$(".down").css("visibility","hidden");
		count = 0;
	};
	
	var isGoal = function(pos){
		return pos == 8 || false;
	}
	
	var calc = function(pos){
		var isAbort = false;
		for(var j = 0;j < 5;j++){
			switch(list[j]){
				case 0:
					if(map[mapnum].vertical.charAt((pos/5|0)*6+(pos%5)) == "-"){
						if(pos % 5 == 0){
							pos = 16;
							isAbort = true;
						}
						else{
							pos -= 1;
						}
					}
					break;
				case 1:
					if(map[mapnum].horizon.charAt(pos) == "-"){
						if((pos/5|0)==0){
							pos = 16;
							isAbort = true;
						}
						else{
							pos -= 5;
						}
					}
					break;
				case 2:
					if(map[mapnum].vertical.charAt((pos/5|0)*6+(pos%5)+1) == "-"){
						if(pos % 5 == 4){
							pos = 16;
							isAbort = true;
						}
						else{
							pos += 1;
						}
					}
					break;
				case 3:
					if(map[mapnum].horizon.charAt(pos+5) == "-"){
						if((pos/5|0)==4){
							pos = 16;
							isAbort = true;
						}
						else{
							pos += 5;
						}
					}
					break;
			}//switch
			if(isGoal(pos)){
				break;
			}
			if(isAbort)break;
		}//for
		return pos;
	};
	
	$("#tweet-btn").click(function(){
		window.open(make_tweet_path(mapnum),"_blank");
	})
	
});

var make_tweet_path = function(mapnum){
	return 'https://twitter.com/intent/tweet?text=Labyをクリアしました! [' + mapnum + '] http://amigurumicats.web.fc2.com/laby.html'
}

