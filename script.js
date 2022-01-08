var vm = new Vue({
  el: "#page",
  data: {
    path: "/",
    search_keyword: "",
    allItemList: [  // 全てのitem
      {id: 0, path: "/", text: "playable", icon_img: "img/icon_folder.png", icon_img_hover: "img/icon_folder_open.png"},
      {id: 1, path: "/", text: "webapp", icon_img: "img/icon_folder.png", icon_img_hover: "img/icon_folder_open.png"},
      {id: 2, path: "/", text: "other", icon_img: "img/icon_folder.png", icon_img_hover: "img/icon_folder_open.png"},
      {id: 3, path: "/webapp/", text: "web謎リンク集(仮)", description: "Rails製webアプリ。2019年にDjangoに移植&アップデート。", icon_img: "img/icon_webnazolinks.png", icon_img_hover: "img/icon_webnazolinks.png", link: "https://webnazolinks.herokuapp.com"},
      {id: 4, path: "/playable/", text: "laby", description: "一番最初に作ったwebコンテンツ", icon_img: "img/icon_file.png", icon_img_hover: "img/icon_file.png", link: "laby/laby.html"},
      { id: 5, path: "/webapp/", text: "謎解き単語検索β", description: "Django製webアプリ", icon_img: "img/icon_file.png", icon_img_hover: "img/icon_file.png", link: "https://shiwehi.com/tools/wordsearch/"},
      { id: 6, path: "/webapp/", text: "Pikmin Bloom デコチェッカー", description: "純js製なのでクライアントだけで動く", icon_img: "img/icon_file.png", icon_img_hover: "img/icon_file.png", link: "pikmin_bloom_checker"},
      // {id: 5, path: "/playable/", text: 'cursor', description:'死ぬほど動作不安定。解けなくてもだいたい環境のせい。', icon_img: 'img/icon_file.png', icon_img_hover: 'img/icon_file.png', link: 'cursor/cursor.html'},
    ],
    itemList: []  // 表示されるitem
  },
  methods: {
    chengeDir: function(){
      this.itemList = this.allItemList.filter(function(item){return item.path == this.path}, this);
    },
    keywordSearch: function(){
      if(this.search_keyword === ''){
        this.chengeDir();
      }
      else{
        this.itemList = this.allItemList.filter(function(item){return item.text.indexOf(this.search_keyword) != -1}, this);  // textに指定文字列を含んでいるものを抽出
      }
    },
    clickFolder: function(e){
      if(this.allItemList[e.id].link == null){
        this.path += this.allItemList[e.id].text + "/";  // クリックされた要素を受け取ってpath更新
        this.chengeDir();
      }
      else{
        // TODO: リンク飛ばす
        window.open(this.allItemList[e.id].link, "");
      }
    },
    backDir: function(){
      if(this.path == "/") return;
      this.path = this.path.split("/").slice(0,-2).join("/") + "/";
      this.chengeDir();
    },
  },
  mounted: function(){
    this.$nextTick(this.chengeDir())  // 初期化。nextTickないとchangeDir()が使える前に呼び出されてしまう
  }
})

Vue.component("my-item", {
  props: ["receive"],
  data: function(){
    return {
      img_src: "",  // 表示される画像のpath
    }
  },
  methods: {
    mouseOver: function(){
      this.img_src = this.receive.icon_img_hover
    },
    mouseLeave: function(){
      this.img_src = this.receive.icon_img
    },
  },
  mounted: function(){
    this.img_src = this.receive.icon_img  // 初期化
  },
  template:  `
    <li>
      <div class="item" :title="receive.description" @click="$emit('click_folder', receive)" @mouseover="mouseOver" @mouseleave="mouseLeave">
        <img :src="this.img_src">
        <div class="label">{{ receive.text }}</div>
      </div>
    </li>
  `,
})
