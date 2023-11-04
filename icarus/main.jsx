/*
TODO
- タブ追加
    - 根だけ表示
    - ツリー表示(今のやつ)
    - 葉だけ表示

*/

"use strict";

const { createContext, useContext, useState, useEffect } = React;


// util
const union_set = (set_a, set_b) => {
    let result = new Set(set_a);
    for (const el of set_b) result.add(el);
    return result
}


const calc_resources = (data, item_id, num) => {
    /*
    Args:
        item_id: string
        num: int

    Returns:
        resources: {
                item_id: {  // 必要な素材
                    "id": str,
                    "count": int,  // 合計必要量
                    "from": { ... }?
                    "at": str?
                }
            }
        at: Set[item_id]
    */

    if (!(item_id in data)) {
        console.log(`error item_id: {item_id}`);
        return {}
    }

    const item = data[item_id];

    if (!("from" in item)) {
        // 生素材
        const res = {"id": item_id, "name": item["name"], "count": num, "tier": item["tier"]};
        return [res, new Set()]
    }

    let res = { "id": item_id, "name": item["name"], "count": num, "tier": item["tier"], "from": {}};
    if ("at" in item) res["at"] = item["at"];
    let at = new Set();

    for (const [from_id, from_num] of Object.entries(item["from"])) {
        const n = ("craft_unit" in item) ? Math.ceil(from_num * num / item["craft_unit"]) : from_num * num;
        const[from_res, from_at] = calc_resources(data, from_id, n);
        res["from"][from_id] = from_res;
        at = union_set(at, from_at);
    }

    if ("at" in item) {
        res["at"] = item["at"];
        at.add(item["at"]);
    }

    return [res, at]
}


const make_require = (data, todo) => {
    /*
    Args:
        todo: {
            item_id: int
        }

    Returns:
        resources: {
            item_id: {
                "count": int,
                "from": { ... }
            }
        }
    */

    let res = {};
    let now_ats = new Set();

    for (const [item_id, item_num] of Object.entries(todo)) {
        const [item_res, item_at] = calc_resources(data, item_id, item_num);
        res[item_id] = item_res;
        now_ats = union_set(now_ats, item_at);
    }

    while (true) {
        let next_ats = new Set();
        for (const now_at of now_ats.keys()) {
            if (now_at in res) continue;
            const [res_at, new_at] = calc_resources(data, now_at, 1);
            res[now_at] = res_at;
            next_ats = union_set(next_ats, new_at);
        }
        if (next_ats.size === 0) break;
        now_ats = next_ats;
    }

    return res
};



const langContext = createContext();
const dataContext = createContext();

const App = () => {

    const [lang, setLang] = useState("ja");  // {"ja", "en"}
    const [data, setData] = useState({});

    const [todo, setTodo] = useState({});
    const [resource, setResource] = useState({});
    const [isShowModal, setIsShowModal] = useState(false);

    useEffect(() => {
        // データ取得
        fetch("assets/data.json")
            .then((resp) => resp.json())
            .then((resp_json) => {
                setData(resp_json);
            })
    }, []);

    const _setTodo = (newTodo) => {
        setResource(make_require(data, newTodo));
        setTodo(newTodo);
    }

    return (
        <dataContext.Provider value={data}>
            <langContext.Provider value={lang}>
                <div id="header">
                    <div className="header_text">ICARUS resource calculator</div>
                    <button className="edit_todo" onClick={() => setIsShowModal(true)}></button>
                    <select className="select_lang" value={lang} onChange={(e) => setLang(e.target.value)}>
                        <option value="ja">ja</option>
                        <option value="en">en</option>
                    </select>
                </div>
                <Modal isShow={isShowModal} setIsShow={setIsShowModal} todo={todo} setTodo={_setTodo} />
                <ResourceTree resource={resource} setResource={setResource} />
                <div className="buffer"></div>
            </langContext.Provider>
        </dataContext.Provider>
    )
}

const Modal = ({ isShow, setIsShow, todo, setTodo }) => {
    /*
    todoリストを編集するモーダル
    */
    const data = useContext(dataContext);

    // モーダルを閉じたときに反映されるようにする
    const [nowtodo, setNowtodo] = useState(todo);
    const [searchtier, setSearchtier] = useState(-1);
    const [searchtext, setSearchtext] = useState("");

    const closeModal = () => {
        setTodo(nowtodo);
        setSearchtier(-1);
        setSearchtext("");
        setIsShow(false);
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
        showItems = showItems.filter((id) => data[id]["search_tags"].some((tag) => tag.includes(searchtext)));
    }

    if (!isShow) return;

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
                            onClick={() => {
                                const newtodo = Object.assign({}, nowtodo);
                                if (!newtodo[id]) {
                                    newtodo[id] = 1;
                                    setNowtodo(newtodo);
                                }
                            }}
                        />
                    ))}
                </div>
                <div className="buffer"></div>
            </div>
        </div>
    )
}

const ItemSelectedTile = ({ item_id, count, updateCount, deleteItem }) => {
    /*
    モーダル中一番上のtodoリストに反映されるべきアイテム
    アイテムの必要個数を変えたり、削除したりできる
    */
    const data = useContext(dataContext);
    const lang = useContext(langContext);

    const item = data[item_id];

    const [prev_local_count, setPrevLocalCount] = useState(count);
    const [local_text, setLocalText] = useState(count);

    const onBlur = () => {
        // 入力終了時の処理
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
        <div className={`item_selected_tile tier${item["tier"]}`}>
            <div className="item_text">{item["name"][lang]}</div>
            <button className="dec" onClick={() => _updateCount(Math.max(0, count-1))}></button>
            <input type="text" value={local_text} onChange={(e) => { setLocalText(e.target.value) }} onBlur={onBlur}></input>
            <button className="inc" onClick={() => _updateCount(count + 1)}></button>
            <button className="delete_item" onClick={deleteItem}></button>
        </div>
    )
}

const ItemSelectTile = ({ item_id, onClick }) => {
    /*
    モーダル中下のアイテム一覧表示
    これをクリックするとtodoにアイテムが追加される
    */
    const data = useContext(dataContext);
    const lang = useContext(langContext);

    const item = data[item_id];

    const [isShowTooltip, setIsShowTooltip] = useState(false);

    return (
        <div
            className={`item_tile tier${item["tier"]}`}
            onClick={onClick}
            onMouseEnter={() => setIsShowTooltip(true)}
            onMouseLeave={() => setIsShowTooltip(false)}
        >
            {item["name"][lang]}
            {isShowTooltip && <ToolTip item_id={item_id} />}
        </div>
    )

}


const ResourceTree = ({ resource, setResource }) => {

    const onCheckChild = (item_id, item_resource) => {
        let new_resource = Object.assign({}, resource);
        new_resource[item_id] = item_resource;
        setResource(new_resource);
    }

    // tier順(昇順)に並べる
    const sorted_resource = Object.values(resource).sort((a, b) => a["tier"] - b["tier"]);

    return (
        <div className="resource_tree">
            {sorted_resource.map((node) => <ResourceNode key={node["id"]} node={node} onCheckFrom={onCheckChild} />)}
        </div>
    )
}

const ResourceNode = ({ node, onCheckFrom }) => {

    const lang = useContext(langContext);

    const onCheck = () => {
        let new_resource = Object.assign({}, node);
        new_resource["done"] = ("done" in new_resource) ? !new_resource["done"] : true;
        onCheckFrom(node.id, new_resource);
    }

    const onCheckChild = (child_id, new_child) => {
        let new_resource = Object.assign({}, node);
        new_resource["from"][child_id] = new_child;
        onCheckFrom(node.id, new_resource);
    }

    const [isShowTooltip, setIsShowTooltip] = useState(false);

    if ("from" in node && !node["done"]) {
        // tier順(昇順)に並べる
        const sorted_node = Object.values(node["from"]).sort((a, b) => a["tier"] - b["tier"]);

        return (
            <div className="tree_node_container">
                <div className="tree_node">
                    <div
                        className={`tree_node_inner tier${node["tier"]}`}
                        onMouseEnter={() => setIsShowTooltip(true)}
                        onMouseLeave={() => setIsShowTooltip(false)}
                    >
                        <div className="tree_node_text">
                            {node["name"][lang]}
                        </div>
                        <div className="tree_node_count">
                            {node["count"]}
                        </div>
                        <div className={`icon_check ${node["done"] ? "checked" : ""}`} onClick={onCheck}></div>
                        {isShowTooltip && <ToolTip item_id={node["id"]} />}
                    </div>
                    {Object.entries(sorted_node).map(([from_id, from_node]) => <ResourceNode key={from_id} node={from_node} onCheckFrom={onCheckChild} />)}
                </div>
            </div>
        )
    }

    return (
        <div className="tree_node_container">
            <div className="tree_node">
                <div
                    className={`tree_node_inner tier${node["tier"]}`}
                    onMouseEnter={() => setIsShowTooltip(true)}
                    onMouseLeave={() => setIsShowTooltip(false)}
                >
                    <div className="tree_node_text">
                        {node["name"][lang]}
                    </div>
                    <div className="tree_node_count">
                        {node["count"]}
                    </div>
                    <div className={`icon_check ${node["done"] ? "checked" : ""}`} onClick={onCheck}></div>
                    {isShowTooltip && <ToolTip item_id={node["id"]} />}
                </div>
            </div>
        </div>
    )
}

const ToolTip = ({ item_id }) => {
    const data = useContext(dataContext);
    const lang = useContext(langContext);

    if (!item_id || !data[item_id]) return null
    const item = data[item_id];

    const at_jsx = (() => {
        if (!item["at"]) return null
        const at_id = item["at"];
        if (!data[at_id]) return null
        return (<div className="tooltip_text">At: {data[at_id]["name"][lang]}</div>)
    })();

    const from_jsx = (() => {
        if (!item["from"]) return null
        if (Object.keys(item["from"]).length <= 0) return null
        return (
            <>
                <hr />
                From:
                {Object.entries(item["from"]).map(([from_id, count]) => <div className="tooltip_text" key={`from_${from_id}`}>{data[from_id]["name"][lang]} : {count}</div>)}
            </>
        )
    })();

    return (
        <div className="tooltip">
            <div className="tooltip_text">{item["name"][lang]}</div>
            <div className="tooltip_text">Tier: {item["tier"]}</div>
            {at_jsx}
            {from_jsx}
        </div>
    )
}



const domContainer = document.querySelector("#app");
const root = ReactDOM.createRoot(domContainer);
root.render(React.createElement(App));
