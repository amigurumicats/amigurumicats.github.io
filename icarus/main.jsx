"use strict";

const { useState } = React

/*
TODO:
- make_require
    - 最後に端数の調整をする
- データ作る
- UI
    - ItemTileをマウスオーバーで詳細表示(tooltip)
        - メイン画面のやつは追加でクラフト先とそれぞれ個数も表示する
    - 最上部TODOに済つけたら下も済つけたり、残り個数表示したり、infoの情報変えたりってできる？
    - デザイン
    - ItemTileの数字を、桁が増えても枠に収まるようfont-sizeを小さくする
        - https://kuroeveryday.blogspot.com/2017/05/calculate-element-width-with-offsetwidth.html
        - https://www.bravesoft.co.jp/blog/archives/15492
- bug
    - info
        - silica_oreのクラフト先がconcrete_furnace(concrete_mixになってほしい)
*/


// util
const union_set = (set_a, set_b) => {
    let _union = new Set(set_a);
    for (const el of set_b) _union.add(el);
    return _union
}


const merge_resources = (res_a, res_b) => {
    // 破壊的
    for (const [bk, bv] of Object.entries(res_b)) {
        if (!res_a[bk]) {
            res_a[bk] = bv;
            continue
        }
        res_a[bk]["sum"] += bv["sum"];
        if (!bv["info"]) continue
        if (!res_a[bk]["info"]) {
            res_a[bk]["info"] = bv["info"];
            continue
        }
        for (const [id, c] of Object.entries(bv["info"])) {
            res_a[bk]["info"][id] = res_a[bk]["info"][id] ? res_a[bk]["info"][id]+c : c
        }
    }
}


const calc_resources = (item_id, num) => {
    /*
    Returns:
        resources
            {
                item_id: {  // 必要な素材
                    sum: int  // 合計必要量
                    info: {
                        item_id: int  // クラフト先と個数
                    }
                }
            }
        at: Set[item_id]
    */

    const d = data[item_id];
    if (!d) {
        console.log(`[error] ${item_id}`);
        return [{}, new Set()]
    }

    if (!d["from"]) {
        // 生素材
        return [{ [item_id]: { "sum": num, "info": {} } }, new Set()]
    }
    // クラフト素材
    let at = new Set();
    if (d["at"]) at.add(d["at"]);
    let res = {[item_id]: {"sum": num, "info": {}}};
    for (const [id, n] of Object.entries(d["from"])) {
        let [res_sub, at_sub] = calc_resources(id, n*num);
        // info
        // TODO: infoがちょっとうまくいってない(silica_oreのinfo先がconcrete_furnaceになる(concrete_mixになってほしい))
        for (const id_sub of Object.keys(res_sub)) {
            res_sub[id_sub]["info"] = {[item_id]: res_sub[id_sub]["sum"]}
        }
        at = union_set(at, at_sub);
        merge_resources(res, res_sub);
    }
    return [res, at]
}


const make_require = (todo) => {
    let res = {};
    let ats = new Set();
    for (const [id, count] of Object.entries(todo)){
        const [res_sub, ats_sub] = calc_resources(id, count);
        ats = union_set(ats, ats_sub);
        merge_resources(res, res_sub);
    }

    // atを全部洗い出す
    let new_ats = new Set(ats);
    while (true) {
        let now_ats = new Set(new_ats);
        new_ats.clear()
        for (const now_at of now_ats.keys()) {
            if (!data[now_at]) {
                console.log(`[error] ${now_at}`);
                continue;
            }
            let new_at = data[now_at]["at"];
            if (new_at && (!ats.has(new_at))) {
                ats.add(new_at);
                new_ats.add(new_at);
            }
        }
        if (new_ats.size === 0) break;
    }
    // atの分の素材を足す
    for (const at of ats.keys()) {
        if (res[at]) continue
        const [res_at, _] = calc_resources(at, 1);
        merge_resources(res, res_at);
    }

    // TODO: 最後に端数の調整をする

    console.log(res);  // DEBUG

    return res
}


const App = () => {
    const [todo, setTodo] = useState({});
    const [modalisshow, setModalisshow] = useState(false);

    const require = make_require(todo);

    // tierごとに分ける
    let todo_by_tier = {0: [], 1: [], 2: [], 3: [], 4:[]};
    for (const id of Object.keys(require)) todo_by_tier[data[id]["tier"]].push(id);

    return (
        <>
            <Modal isshow={modalisshow} setIsshow={setModalisshow} todo={todo} setTodo={setTodo} />

            <div className="list">
                {Object.entries(todo).map(([id, count]) => (
                    <ItemListTile key={id} item_id={id} item_count={count} />
                ))}
                <button className="add" onClick={() => setModalisshow(true)}></button>
            </div>

            {
                [4,3,2,1,0].map((tier) => (
                    <div className="list" key={tier}>
                        {
                            todo_by_tier[tier].map((id) => (
                                <ItemListTile
                                    key={id}
                                    item_id={id}
                                    item_count={require[id]["sum"]}
                                    info={require[id]["info"]}
                                />
                            ))
                        }
                    </div>
                ))
            }
        </>
    );
}


const ItemListTile = ({item_id, item_count, info}) => {
    /*
    メイン画面のアイテムタイル
    */
    const [isdone, setIsdone] = useState(false);

    return (
        <div className="item_tile" onClick={() => setIsdone(!isdone)}>
            <div className="item_icon">{item_id}</div>
            <span className="count">{item_count}</span>
            <ItemTileToolTip id={item_id} info={info}/>
            {isdone && <div className="done"></div>}
        </div>
    )
}


const ItemSelectedTile = ({item_id, count, updateCount, deleteItem}) => {
    /*
    モーダル中一番上のtodoリストに反映されるべきアイテム
    アイテムの必要個数を変えたり、削除したりできる
    */
    const [prev_local_count, setPrevLocalCount] = useState(count);
    const [local_text, setLocalText] = useState(count);

    const onChange = (e) => { setLocalText(e.target.value); }

    const onBlur = () => {
        let value = Math.trunc(Number(local_text));
        if (value >= 0) {
            updateCount(value);
        } else {
            // 入力が不適なときは以前の有効な入力に戻す
            setLocalText(prev_local_count);
        }
    }

    const _updateCount = (value) => {
        setLocalText(value);
        setPrevLocalCount(value);
        updateCount(value);
    }

    return (
        <div className="item_tile">
            <div className="item_icon">{item_id}</div>
            <div className="item_delete" onClick={deleteItem}></div>
            <button className="inc" onClick={() => _updateCount(count+1)}></button>
            <button className="dec" onClick={() => _updateCount(Math.max(0, count-1))}></button>
            <input type="text" value={local_text} onChange={(e) => onChange(e)} onBlur={() => onBlur()}></input>
            <ItemTileToolTip id={item_id}/>
        </div>
    )
}


const ItemSelectTile = ({item_id, onclick}) => {
    /*
    モーダル中下のアイテム一覧表示
    これをクリックするとtodoにアイテムが追加される
    */
    return (
        <div className="item_tile item_tile_small" onClick={() => onclick(item_id)}>
            <div className="item_icon">{item_id}</div>
            <ItemTileToolTip id={item_id}/>
        </div>
    )
}

const ItemTileToolTip = ({id, info}) => {
    /*
    id: ツールチップを表示するアイテムID
    info: 詳細情報。クラフト先とその個数
        {
            item_id: count
        }
    */
    if (!id || !data[id]) return null
    return (
        <div className="tooltip">
            <div>{data[id]["name"]["en"]} / {data[id]["name"]["ja"]}</div>
            <div>Tier: {data[id]["tier"]}</div>
            {data[id]["at"] && data[data[id]["at"]] && <div>Require: {data[data[id]["at"]]["name"]["en"]} / {data[data[id]["at"]]["name"]["ja"]}</div>}
            {data[id]["from"] && !!Object.keys(data[id]["from"]).length && Object.entries(data[id]["from"]).map(([ from_id, count ]) => from_id && <div key={`from_${from_id}`}>{from_id} {count}</div>)}
            {info && !!Object.keys(info).length && Object.entries(info).map(([ to_id, count ]) => to_id && <div key={`to_${to_id}`}>{to_id} {count}</div>)}
        </div>
    )
}


const Modal = ({isshow, setIsshow, todo, setTodo}) => {
    /*
    todoリストを編集するモーダル
    */
    // モーダルを閉じたときに反映されるようにする
    const [nowtodo, setNowtodo] = useState(todo);
    const [searchtier, setSearchtier] = useState(-1);
    const [searchtext, setSearchtext] = useState("");

    const closeModal = () => {
        setTodo(nowtodo);
        setSearchtier(-1);
        setSearchtext("");
        setIsshow(false);
    }

    const updateCount = (id, count) => {
        const newtodo = Object.assign({}, nowtodo);
        newtodo[id] = newtodo[id] ? count : 1;
        setNowtodo(newtodo);
    }

    const deleteItem = (id) => {
        const newtodo = Object.assign({}, nowtodo);
        delete newtodo[id];
        setNowtodo(newtodo);
    }

    let showItems = Object.keys(data);
    if (searchtier >= 0) {
        showItems = showItems.filter((id) => data[id]["tier"] === searchtier);
    }
    if (searchtext) {
        showItems = showItems.filter((id) => id.includes(searchtext) || data[id]["name"]["en"].includes(searchtext) || data[id]["name"]["ja"].includes(searchtext));
    }

    if (!isshow) return;

    return (
        <div id="modal_overlay" onClick={closeModal} >
            <div id="modal_content" onClick={(e) => e.stopPropagation()}>
                <div className="list">
                    {Object.entries(nowtodo).map(([id, count]) => (
                        <ItemSelectedTile
                            key={id}
                            item_id={id}
                            count={count}
                            updateCount={(c) => updateCount(id, c)}
                            deleteItem={() => deleteItem(id)}
                        />
                    ))}
                </div>
                <div className="search">
                    <select onChange={(e) => setSearchtier(Number(e.target.value))}>
                        <option value="-1"></option>
                        <option value="0">Tier 0</option>
                        <option value="1">Tier 1</option>
                        <option value="2">Tier 2</option>
                        <option value="3">Tier 3</option>
                        <option value="4">Tier 4</option>
                    </select>
                    <div className="icon_search"></div>
                    <input type="text" onChange={(e) => setSearchtext(e.target.value)}></input>
                </div>
                <div className="list">
                    {showItems.map((id) => (
                        <ItemSelectTile
                            key={id}
                            item_id={id}
                            onclick={(id) => {
                                const newtodo = Object.assign({}, nowtodo);
                                if (!newtodo[id]) {
                                    newtodo[id] = 1;
                                    setNowtodo(newtodo);
                                }
                            }}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}


const domContainer = document.querySelector("#app");
const root = ReactDOM.createRoot(domContainer);
root.render(React.createElement(App));
