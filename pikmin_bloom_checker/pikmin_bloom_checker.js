var vm = new Vue({
    el: "#page",
    data: {
        table_header: ["デコ名", "赤", "黄", "青", "紫", "白", "羽", "岩", ""],
        table_data: [
            // state => 0: 未所持, 1: 苗所持, 2: ピクミン所持, 3: デコ所持
            { id: "restaurant", name: "レストラン", state: [0, 0, 0, 0, 0, 0, 0], isVisible: true },
            { id: "cafe", name: "カフェ",  state: [0, 0, 0, 0, 0, 0, 0], isVisible: true},
            { id: "dessert", name: "デザート", state: [0, 0, 0, 0, 0, 0, 0], isVisible: true },
            { id: "cinema", name: "映画館", state: [0, 0, 0, 0, 0, 0, 0], isVisible: true },
            { id: "pharmacy", name: "薬局", state: [0, 0, 0, 0, 0, 0, 0], isVisible: true },
            { id: "zoo", name: "動物園", state: [0, 0, 0, 0, 0, 0, 0], isVisible: true },
            { id: "forest_0", name: "森(クワガタ)", state: [0, 0, 0, 0, 0, 0, 0], isVisible: true },
            { id: "forest_1", name: "森(ドングリ)", state: [0, 0, 0, 0, 0, 0, 0], isVisible: true },
            { id: "waterside", name: "水辺", state: [0, 0, 0, 0, 0, 0, 0], isVisible: true },
            { id: "post_office", name: "郵便局", state: [0, 0, 0, 0, 0, 0, 0], isVisible: true },
            { id: "museum", name: "美術館", state: [0, 0, 0, 0, 0, 0, 0], isVisible: true },
            { id: "airport", name: "空港", state: [0, 0, 0, 0, 0, 0, 0], isVisible: true },
            { id: "station", name: "駅", state: [0, 0, 0, 0, 0, 0, 0], isVisible: true },
            { id: "beach", name: "砂浜", state: [0, 0, 0, 0, 0, 0, 0], isVisible: true },
            { id: "hamburger", name: "ハンバーガーショップ", state: [0, 0, 0, 0, 0, 0, 0], isVisible: true },
            { id: "convenience_store", name: "コンビニ", state: [0, 0, 0, 0, 0, 0, 0], isVisible: true },
            { id: "supermarket_0", name: "スーパーマーケット(キノコ)", state: [0, 0, 0, 0, 0, 0, 0], isVisible: true },
            { id: "supermarket_1", name: "スーパーマーケット(バナナ)", state: [0, 0, 0, 0, 0, 0, 0], isVisible: true },
            { id: "bakery", name: "ベーカリー", state: [0, 0, 0, 0, 0, 0, 0], isVisible: true },
            { id: "beauty_salon", name: "美容院", state: [0, 0, 0, 0, 0, 0, 0], isVisible: true },
            { id: "fashion", name: "ファッション", state: [0, 0, 0, 0, 0, 0, 0], isVisible: true },
            { id: "park", name: "公園", state: [0, 0, 0, 0, 0, 0, 0], isVisible: true },
            { id: "roadside", name: "みちばた", state: [0, 0, 0, 0, 0, 0, 0], isVisible: true },
        ],
        selected_state: -1,
    },
    methods: {
        changeState: function (i_row, i_col) {
            /*
            クリックしたところを選択中のもの(selected_state)にする
            ただし、すでになっている場合、未所持(0)にする
            未所持を選択中に未所持のところをクリックした場合、何もしない
            selected_stateが-1のときは、1つずつ巡回
            */
            now_state = this.table_data[i_row].state[i_col];
            if (this.selected_state == -1) {
                new_state = (now_state + 1) % 4;
            } else if (now_state != this.selected_state) {
                new_state = this.selected_state;
            } else if (this.selected_state != 0) {
                new_state = 0;
            } else {
                return
            }

            // NOTE: arrayに対しての変更は、setしないとリアクティブに変更されない
            Vue.set(this.table_data[i_row].state, i_col, new_state);

            this._saveStateRow(i_row);
        },
        changeStateAll: function (i_row) {
            if (this.selected_state == -1) return
            for (i_col in this.table_data[i_row].state) {
                Vue.set(this.table_data[i_row].state, i_col, this.selected_state);
            }

            this._saveStateRow(i_row);
        },
        changeVisibility: function (i_row) {
            Vue.set(this.table_data[i_row], "isVisible", !this.table_data[i_row]["isVisible"]);
        },
        selectState: function (state) {
            this.selected_state = this.selected_state == state ? -1 : state;
        },
        _saveStateRow: function (i_row) {
            // localstorageのデータを更新する
            row = this.table_data[i_row];
            localStorage.setItem(row.id, row.state.join(","));
        },
        clearData: function () {
            this.table_data.forEach((row, i_row) => {
                this.table_data[i_row].state.forEach((_, i_col) => {
                    Vue.set(this.table_data[i_row].state, i_col, 0);
                })
            })
            localStorage.clear();
        }
    },
    mounted: function () {
        // localstorageから初期状態セット
        this.table_data.forEach((row, i_row) => {
            let ls = localStorage.getItem(row.id);
            if (!ls) { return };
            let ls_spl = ls.split(",").slice(0, 7).map(x => parseInt(x));  // 前7つだけとってintにする
            ls_spl.forEach((col, i_col) => {
                Vue.set(this.table_data[i_row].state, i_col, col);
            });
        });
    },
    computed: {
        completeRateText: function() {
            // "所持率: 30% (3/10)"のようなテキストを作る
            let top = 0;
            let bottom = 0;
            for (row of this.table_data) {
                for (col of row.state) {
                    if (col == 3) { top += 1; }
                    bottom += 1;
                }
            }
            let rate = (bottom == 0) ? 0 : (top / bottom * 100).toFixed(2);
            return `所持率: ${rate}% (${top}/${bottom})`
        },
        isCompleted: function () {
            // computedに引数を渡すためのイディオム
            // https://qiita.com/wataru65818460/items/f38898236512f654df4c
            return function (i_row) {
                return this.table_data[i_row].state.every(x => x == 3)
            }
        }
    }
})
