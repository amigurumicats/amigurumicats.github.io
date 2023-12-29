/*

*/

"use strict";

const { createContext, useContext, useState, useEffect } = React;


// util
const union_set = (set_a, set_b) => {
    let result = new Set(set_a);
    for (const el of set_b) result.add(el);
    return result
}


const _calc_resources = (data, item_id, num) => {
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

    let res = { "id": item_id, "name": item["name"], "count": num, "tier": item["tier"], "from": {} };
    if ("at" in item) res["at"] = item["at"];
    let at = new Set();

    for (const [from_id, from_num] of Object.entries(item["from"])) {
        const n = ("craft_unit" in item) ? Math.ceil(from_num * num / item["craft_unit"]) : from_num * num;
        const [from_res, from_at] = _calc_resources(data, from_id, n);
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
        const [item_res, item_at] = _calc_resources(data, item_id, item_num);
        res[item_id] = item_res;
        now_ats = union_set(now_ats, item_at);
    }

    while (true) {
        let next_ats = new Set();
        for (const now_at of now_ats.keys()) {
            if (now_at in res) continue;
            const [res_at, new_at] = _calc_resources(data, now_at, 1);
            res[now_at] = res_at;
            next_ats = union_set(next_ats, new_at);
        }
        if (next_ats.size === 0) break;
        now_ats = next_ats;
    }

    return res
}


const _marge_leaf_node = (leaf_info_a, leaf_info_b) => {
    /*
    leaf_info: {
        item_id: {
            "count": num,
            "next": {
                item_id: {
                    "require": num,
                    "craft": num
                }
            }
        }
    }
    */
    let new_leaf_info = Object.assign({}, leaf_info_a);
    for (const [item_id, item_info] of Object.entries(leaf_info_b)) {
        if (item_id in new_leaf_info) {
            new_leaf_info[item_id]["count"] += item_info["count"];
            for (const [next_id, next_info] of Object.entries(item_info["next"])) {
                if (next_id in new_leaf_info[item_id]["next"]) {
                    new_leaf_info[item_id]["next"][next_id]["require"] += next_info["require"];
                    new_leaf_info[item_id]["next"][next_id]["craft"] += next_info["craft"];
                } else {
                    new_leaf_info[item_id]["next"][next_id] = next_info;
                }
            }
        } else {
            new_leaf_info[item_id] = item_info;
            continue;
        }
    }
    return new_leaf_info;
}


const _calc_leaf_node = (resource_node) => {
    /*
    Args:
        resource_node: {
            "id": item_id(string),
            "name": { lang: string },
            "tier": num,
            "at": item_id(string),
            "count": num,
            "done": bool?,
            "from": { resources }?
        }
    Returns:
        {
            item_id: {
                "count": num,  // 合計数
                "next": {
                    item_id: {  // 次に作るもの
                        "require": num,  // 必要数
                        "craft": num  // 作る数
                    }
                }
            }
        }
    */
    if (resource_node["done"] === true) return {};
    if (resource_node["from"]) {
        let result = {};
        if (Object.values(resource_node["from"]).every(from_node => from_node["done"])) {
            return {
                [resource_node["id"]]: {
                    "count": resource_node["count"],
                    "next": {}
                }
            }
        }

        for (const from_node of Object.values(resource_node["from"])) {
            if (from_node["done"] === true) continue;
            if (from_node["from"]) {
                if (Object.values(from_node["from"]).every(n => n["done"])) {
                    result = _marge_leaf_node(result, {
                        [from_node["id"]]: {
                            "count": from_node["count"],
                            "next": {
                                [resource_node["id"]]: {
                                    "require": from_node["count"],
                                    "craft": resource_node["count"]
                                }
                            }
                        }
                    });
                } else {
                    result = _marge_leaf_node(result, _calc_leaf_node(from_node));
                }
            } else {
                result = _marge_leaf_node(result, {
                    [from_node["id"]]: {
                        "count": from_node["count"],
                        "next": {
                            [resource_node["id"]]: {
                                "require": from_node["count"],
                                "craft": resource_node["count"]
                            }
                        }
                    }
                });
            }
        }
        return result;
    } else {
        return {
            [resource_node["id"]]: {
                "count": resource_node["count"],
                "next": {}
            }
        }
    }

}


const calc_leaf = (resources) => {
    /*
    Args:
        resources: {
            item_id: {
                "id": item_id(string),
                "name": { lang: string },
                "tier": num,
                "at": item_id(string),
                "count": num,
                "done": bool?,
                "from": { resources }?
            }
        }

    Returns:
        {
            item_id: {
                "count": num,
                "next": {
                    item_id: {
                        "require": num,
                        "craft": num
                    }
                }
            }
        }
    */
    let result = {};
    for (const resource_node of Object.values(resources)) {
        result = _marge_leaf_node(result, _calc_leaf_node(resource_node));
    }

    return result;
}



const langContext = createContext();
const dataContext = createContext();

const App = () => {

    const [lang, setLang] = useState("ja");  // "ja", "en"
    const [data, setData] = useState({});
    const [activeTab, setActiveTab] = useState("todo");  // "todo", "tree", "leaf"

    const [todo, setTodo] = useState({});
    const [resource, setResource] = useState({});

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

    const tabs = {
        "todo": <EditTodo todo={todo} setTodo={_setTodo} />,
        "tree": <ResourceTree resource={resource} setResource={setResource} />,
        "leaf": <ResourceLeafList leafs={calc_leaf(resource)} setResource={setResource} />
    };


    return (
        <dataContext.Provider value={data}>
            <langContext.Provider value={lang}>
                <div id="header">
                    <div className="header_text">ICARUS resource calculator</div>
                    <select className="select_lang" value={lang} onChange={(e) => setLang(e.target.value)}>
                        <option value="ja">ja</option>
                        <option value="en">en</option>
                    </select>
                </div>

                <div className="tabs">
                    { Object.keys(tabs).map(key =>
                        <div
                            key={key}
                            className={`tab ${key === activeTab ? "active" : ""}`}
                            onClick={() => setActiveTab(key)}
                        >
                            {text["tab"][key][lang]}
                        </div>) }
                </div>
                <div className="tab_content">
                    { tabs[activeTab] }
                </div>

                <div className="buffer"></div>
            </langContext.Provider>
        </dataContext.Provider>
    )
}

const EditTodo = ({ todo, setTodo }) => {
    const data = useContext(dataContext);
    const lang = useContext(langContext);

    const [searchtier, setSearchtier] = useState(-1);
    const [searchtext, setSearchtext] = useState("");

    const updateCount = (id, count) => {
        const newtodo = Object.assign({}, todo);
        newtodo[id] = newtodo[id] ? count : 1;
        setTodo(newtodo);
    }

    const deleteItem = (id) => {
        const newtodo = Object.assign({}, todo);
        delete newtodo[id];
        setTodo(newtodo);
    }

    let showItems = Object.keys(data);
    if (searchtier >= 0) {
        showItems = showItems.filter((id) => data[id]["tier"] === searchtier);
    }
    if (searchtext) {
        showItems = showItems.filter((id) => data[id]["search_tags"].some((tag) => tag.includes(searchtext)));
    }

    return (
        <div className="edit_todo">
            <div className="list">
                {(Object.keys(todo).length <= 0)
                    ? <div className="small_text">{text["empty_item"][lang]}</div>
                    : Object.entries(todo).map(([id, count]) => (
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
                            const newtodo = Object.assign({}, todo);
                            if (!newtodo[id]) {
                                newtodo[id] = 1;
                                setTodo(newtodo);
                            }
                        }}
                    />
                ))}
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
    const lang = useContext(langContext);

    const onCheckChild = (item_id, item_resource) => {
        let new_resource = Object.assign({}, resource);
        new_resource[item_id] = item_resource;
        setResource(new_resource);
    }

    const _resetCheck = (res) => {
        let new_res = Object.assign({}, res);
        new_res["done"] = false;
        if (!(new_res["from"])) return new_res;
        for (const from_key of Object.keys(new_res["from"])) {
            new_res["from"][from_key] = _resetCheck(new_res["from"][from_key]);
        };
        return new_res;
    }

    const resetCheck = () => {
        let new_resource = Object.assign({}, resource);
        for (const res_id of Object.keys(new_resource)) {
            new_resource[res_id] = _resetCheck(new_resource[res_id]);
        }
        setResource(new_resource);
    }

    // tier順(昇順)に並べる
    const sorted_resource = Object.values(resource).sort((a, b) => a["tier"] - b["tier"]);

    return (
        <div className="resource_tree">
            <div
                className="button"
                onClick={resetCheck}
            >{text["reset_check"][lang]}</div>
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
        return (<div className="tooltip_text">At : {data[at_id]["name"][lang]}</div>)
    })();

    const from_jsx = (() => {
        if (!item["from"]) return null
        if (Object.keys(item["from"]).length <= 0) return null
        const craft_unit_jsx = (() => {
            if ("craft_unit" in item && item["craft_unit"] !== 1) {
                return (<>
                    Craft unit : {item["craft_unit"]}
                </>)
            }
            return null
        })();

        return (
            <>
                <hr />
                From :
                {Object.entries(item["from"]).map(([from_id, count]) => <div className="tooltip_text" key={`from_${from_id}`}>{data[from_id]["name"][lang]} : {count}</div>)}
                {craft_unit_jsx}
            </>
        )
    })();

    return (
        <div className="tooltip">
            <div className="tooltip_text">{item["name"][lang]}</div>
            <div className="tooltip_text">Tier : {item["tier"]}</div>
            {at_jsx}
            {from_jsx}
        </div>
    )
}

const ResourceLeafList = ({ leafs, setResource }) => {
    return (
        <div className="leafs">
            {
                Object.entries(leafs).map(([item_id, leaf_info]) =>
                    <ResourceLeafNode key={item_id} item_id={item_id} leaf_info={leaf_info} setResource={setResource} />
                )
            }
        </div>
    )
}

const ResourceLeafNode = ({ item_id, leaf_info, setResource }) => {
    const data = useContext(dataContext);
    const lang = useContext(langContext);

    const [isShowTooltip, setIsShowTooltip] = useState(false);

    const item = data[item_id];

    const checkResource = () => {
        const _checkResource = (res) => {
            let new_res = Object.assign({}, res);
            // leaf(fromがない・fromが全部doneである)かつid===item_idのもの
            if ("from" in new_res) {
                if (new_res["id"] === item_id && Object.values(new_res["from"]).every(n => n["done"])) {
                    new_res["done"] = true;
                }
                for (const from_key of Object.keys(new_res["from"])) {
                    new_res["from"][from_key] = _checkResource(new_res["from"][from_key]);
                }
            } else {
                if (new_res["id"] === item_id) {
                    new_res["done"] = true;
                }
            }
            return new_res;
        }

        setResource((res) => {
            console.log(res);
            let new_res = Object.assign({}, res);
            for (const res_key of Object.keys(new_res)) {
                new_res[res_key] = _checkResource(new_res[res_key]);
            }
            console.log(new_res);
            return new_res;
        })
    }

    return (
        <div
            key={item_id}
            className={`leaf tier${item["tier"]}`}
            onMouseEnter={() => setIsShowTooltip(true)}
            onMouseLeave={() => setIsShowTooltip(false)}
            onClick={checkResource}
        >
            <div className="leaf_text">{item["name"][lang]}</div>
            <div className="leaf_count">{leaf_info["count"]}</div>
            {isShowTooltip && <LeafToolTip item_id={item_id} leaf_info={leaf_info} />}
        </div>
    )
}

const LeafToolTip = ({ item_id, leaf_info }) => {
    const data = useContext(dataContext);
    const lang = useContext(langContext);

    const item = data[item_id];

    const at_jsx = (() => {
        if (!item["at"]) return null
        const at_id = item["at"];
        if (!data[at_id]) return null
        return (<div className="tooltip_text">At : {data[at_id]["name"][lang]}</div>)
    })();

    const to_jsx = (() => {
        if (Object.keys(leaf_info["next"]).length <= 0) return null;
        return (
            <>
                <hr />
                To:
                {
                    Object.entries(leaf_info["next"]).map(([next_id, next_info]) =>
                        <div
                            key={next_id}
                            className="tooltip_text"
                        >
                            {data[next_id]["name"][lang]}({next_info["craft"]}) : {next_info["require"]}
                        </div>
                    )
                }
            </>
        )
    })();

    const from_jsx = (() => {
        if (!item["from"] || Object.keys(item["from"]).length <= 0) return null
        return (
            <>
                <hr />
                From :
                {Object.entries(item["from"]).map(([from_id, count]) => <div className="tooltip_text" key={`from_${from_id}`}>{data[from_id]["name"][lang]} : {count}</div>)}
            </>
        )
    })();


    return (
        <div className="tooltip">
            <div className="tooltip_text">{item["name"][lang]}</div>
            <div className="tooltip_text">Tier : {item["tier"]}</div>
            {at_jsx}
            {to_jsx}
            {from_jsx}
        </div>
    )
}


const domContainer = document.querySelector("#app");
const root = ReactDOM.createRoot(domContainer);
root.render(React.createElement(App));
