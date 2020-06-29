
$(function(){

$(".select_box").on("click", function(){
    $("#modal_"+this.id).show();
})

$(".modal_back").on("click", function(){
    $(this.parentElement).hide();
})

$(".modal li").on("click", function(){
    let suffix = this.parentElement.parentElement.parentElement.id.slice(6);
    $("#"+suffix).text(this.textContent);
    $("#modal_"+suffix).hide();
})

})



