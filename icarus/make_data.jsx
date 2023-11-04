/*
データを作りやすくするためのツール

id: string
{
    "name": {
        "en": string,
        "ja": string
    },
    "tier": number,  // [0-4]
    "at": string(id)?,
    "from": {id => number}?,
    "craft_unit": number?,  // default: 1
    "search_tags": string[]
}

*/
"use strict";

const { useState, useEffect } = React;

const langs = ["en", "ja"];

const toItems = (data) => {
    let result = {};
    const makeName = (item_name) => Object.fromEntries(langs.map((lang) => [lang, item_name[lang] || ""]));
    const makeTags = (item) => Object.values(item["name"]).filter(name => 0 < name.length);

    for (const [item_id, item] of Object.entries(data)) {
        let tags = item["search_tags"] || makeTags(item);
        tags = tags.map((tag) => tag.toLowerCase());
        let froms = item["from"] ? Object.entries(item["from"]) : [];
        froms = [...froms, ["", 1]];

        result[[item_id]] = {
            "item_id": item_id,
            "name": makeName(item["name"]),
            "tier": item["tier"] || 0,
            "at": item["at"] || "",
            "from": froms,
            "craft_unit": item["craft_unit"] || 1,
            "search_tags": tags
        };
    }
    return result;
}

const makeJsonStr = (items) => {
    return JSON.stringify(pretifyItems(items), undefined, 4);
}

const pretifyItems = (items) => {
    // itemsをいい感じに整形する
    let result = {};
    for (const item of Object.values(items)) {
        if (item["item_id"].length <= 0) continue;

        // objは追加した順番に出力される
        let pretified_item = {
            "name": item["name"],
            "tier": item["tier"]
        };

        if (0 < item["at"].length) {
            pretified_item["at"] = item["at"];
        }

        const from = item["from"].filter(([item_id, count]) => 0 < item_id.length && 0 < count);
        if (from.length > 0) {
            pretified_item["from"] = Object.fromEntries(from);
        }

        if (1 < item["craft_unit"]) {
            pretified_item["craft_unit"] = item["craft_unit"];
        }

        pretified_item["search_tags"] = item["search_tags"].filter((tag) => 0 < tag.length);

        result[item["item_id"]] = pretified_item;
    }

    // id順に並べる
    let sorted_result = Object.keys(result).sort().reduce((obj, key) => {
        obj[key] = result[key];
        return obj;
    }, {});

    return sorted_result;
}


const App = () => {

    const [items, setItems] = useState({});
    const [displayItemSet, setDisplayItemSet] = useState(new Set());  // 表示するItemのidのSet
    const [searchText, setSearchText] = useState("");
    const [errorItemSet, setErrorItemSet] = useState(new Set());  // 項目エラーのあるItemのidのSet
    const [isShowOnlyError, setIsShowOnlyError] = useState(false);
    const [message, setMessage] = useState("");

    const updateItem = (id, item) => {
        const newItems = Object.assign(Object.assign({}, items), {[id]: item});
        setItems(newItems);
    }

    const addItem = () => {
        const new_id = crypto.randomUUID();
        const newTemp = {
            [new_id]: {
                "item_id": "",
                "name": Object.fromEntries(langs.map(lang => [lang, ""])),
                "tier": 0,
                "at": "",
                "craft_unit": 1,
                "from": [["", 1]],
                "search_tags": []
            }
        }
        setItems((prev) => Object.assign(newTemp, prev));
        setDisplayItemSet((prev) => new Set([...prev, new_id]));
    }

    const importFile = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";
        input.addEventListener("change", async (e) => {
            const t = await e.target.files[0].text();
            const newItems = toItems(JSON.parse(t))
            setItems(newItems);
            updateDisplayItemSet(newItems, searchText, isShowOnlyError);
        });
        input.click();
    }

    const checkData = (items) => {
        // チェックして、エラーのあるitemのidをerrorItemSetにerrorItemSetに反映する
        console.log("check ...");

        let errorSet = new Set();
        let idCount = {};

        for (const item of Object.values(items)) {
            const item_id = item["item_id"];
            if (!item_id || item_id.length <= 0) continue;
            idCount[item_id] = (item_id in idCount) ? idCount[item_id]+1 : 1;
        }

        for (const [id, item] of Object.entries(items)) {
            // item_idが空のものは無視
            if (!item["item_id"] || item["item_id"].length <= 0) continue;

            // item_idの重複チェック
            if (2 <= idCount[item["item_id"]]) {
                errorSet.add(id);
                console.log(id, "id duplicated");
            }

            for (const lang of langs) {
                if (item["name"][lang] && 0 < item["name"][lang].length) continue;
                errorSet.add(id);
                console.log(id, "name empty");
            }
            if (item["craft_unit"] < 1) {
                errorSet.add(id);
                console.log(id, "craft_unit < 1")
            }
            if (item["at"] && 0 < item["at"].length && !(item["at"] in idCount)) {
                errorSet.add(id);
                console.log(id, item["at"], "at invalid");
            }
            for (const [from_id, from_count] of item["from"]) {
                if (from_id.length < 1) continue;
                if (!(from_id in idCount)) {
                    errorSet.add(id);
                    console.log(id, from_id, "from_id invalid")
                }
                if (from_count < 1) {
                    errorSet.add(id);
                    console.log(id, from_id, "from_count < 1")
                }
            }
            if (item["search_tags"].filter((tag) => 0 < tag.length).length < 1) {
                errorSet.add(id);
                console.log(id, "search_tags empty");
            }
        }

        setErrorItemSet(errorSet);
        setMessage(`エラー: ${errorSet.size} 件`);

        return errorSet;
    }

    const exportJson = () => {
        const error_set = checkData(items);
        if (0 < error_set.size) return;

        const export_str = makeJsonStr(items);
        const export_blob = new Blob([export_str], {"type": "text/json"});
        const export_url = URL.createObjectURL(export_blob);
        const export_a = document.createElement("a");
        export_a.href = export_url;
        export_a.download = "data.json";
        export_a.click();
        export_a.remove();
    }

    const updateDisplayItemSet = (items, searchText, isShowOnlyError) => {
        let display_item_set = new Set(Object.keys(items));
        if (0 < searchText.length) {
            display_item_set = new Set([...display_item_set].filter((id) => items[id]["search_tags"].some((tag) => tag.includes(searchText))));
        }
        if (isShowOnlyError) {
            display_item_set = new Set([...display_item_set].filter((id) => errorItemSet.has(id)));
        }
        setDisplayItemSet(display_item_set);
    }

    const _setSearchText = (newSearchText) => {
        // 検索条件が変わったときだけ、フィルターを更新する
        // 検索テキストが入ってるときに新規追加を押しても何も表示されないように見える、のを防止する
        updateDisplayItemSet(items, newSearchText, isShowOnlyError);
        setSearchText(newSearchText);
    }

    const _setIsShowOnlyError = (newIsShowOnlyError) => {
        // 検索条件が変わったときだけ、フィルターを更新する
        updateDisplayItemSet(items, searchText, newIsShowOnlyError);
        setIsShowOnlyError(newIsShowOnlyError);
    }


    return (
        <>
            <div id="header">
                <div className="header_text">ICARUS resource calculator data maker</div>
            </div>
            <datalist id="item_list">
                {Object.entries(items).map(([id, item]) => <option key={id} value={item["item_id"]}>{item["search_tags"].join(",")}</option>)}
            </datalist>
            <div className="main">
                <div className="buttons">
                    <div className="button" onClick={importFile}>インポート</div>
                    <div className="button" onClick={addItem}>新規追加</div>
                    <div className="button" onClick={() => checkData(items)}>データチェック</div>
                    <div className="button" onClick={exportJson}>エクスポート(json)</div>
                </div>
                {}
                <div className="message">{message}</div>
                <input className="search" type="text" value={searchText} onChange={(e) => _setSearchText(e.target.value)} />
                <input type="checkbox" value={isShowOnlyError} onChange={() => _setIsShowOnlyError(!isShowOnlyError)} /><span style={{"fontSize": "14px"}}>エラーのみ</span>

                <div className="datacard_container">
                    {Object.entries(items).map(([id, item]) =>
                        displayItemSet.has(id) && <DataCard key={id} id={id} item={item} updateItem={updateItem} isError={errorItemSet.has(id)} />
                    )}
                </div>
            </div>
        </>
    )
}


const DataCard = ({ id, item, updateItem, isError }) => {

    const _updateItem = (key, newValue) => {
        const newItem = Object.assign(Object.assign({}, item), {[key]: newValue});
        updateItem(id, newItem);
    }

    const updateName = (lang, newValue) => {
        const newName = Object.assign(Object.assign({}, item["name"]), {[lang]: newValue});
        _updateItem("name", newName);
    }

    const updateFrom = (index, col, value) => {
        let newFrom = item["from"].map(([item_id, item_count]) => [item_id, item_count]);
        newFrom[index][col] = value;
        // 一番下の行のidが変更されたら、新しい行を追加する
        if (col === 0 && item["from"].length <= index+1) {
            newFrom.push(["", 1]);
        }
        _updateItem("from", newFrom);
    }


    return (
        <div className="datacard">
            {isError && <div className="error_icon"></div>}
            <div className="card_row">
                <div className="title">id : </div>
                <input value={item["item_id"]} onChange={(e) => _updateItem("item_id", e.target.value)} />
                <select value={item["tier"]} onChange={(e) => _updateItem("tier", e.target.value)}>
                    <option value="0">Tier 0</option>
                    <option value="1">Tier 1</option>
                    <option value="2">Tier 2</option>
                    <option value="3">Tier 3</option>
                    <option value="4">Tier 4</option>
                </select>
            </div>
            <div className="card_row">
                <div className="title">name : </div>
                { langs.map((lang) =>
                    <div className="card_row" key={lang}>
                        <div className="small_text">{lang}</div>
                        <input type="text" value={item["name"][lang]} onChange={(e) => updateName(lang, e.target.value)} />
                    </div>
                ) }
            </div>
            <div className="card_row">
                <div className="title">at : </div>
                <input type="text" list="item_list" value={item["at"]} onChange={(e) => _updateItem("at", e.target.value)} />
                <div className="title">craft unit : </div>
                <input className="item_craft_unit" type="number" value={item["craft_unit"]} onChange={(e) => _updateItem("craft_unit", e.target.value)} />
            </div>
            <div className="from_container">
                <div className="title">from : </div>
                <div className="from_list">
                    {item["from"].map(([item_id, item_count], index) =>
                        <div key={index} className="from">
                            <input type="text" list="item_list" value={item_id} onChange={(e) => updateFrom(index, 0, e.target.value)} />
                            <input type="number" value={item_count} onChange={(e) => updateFrom(index, 1, e.target.value)} />
                        </div>
                    )}
                </div>
            </div>
            <InputTags tags={item["search_tags"]} updateTags={(tags) => _updateItem("search_tags", tags.map((tag) => tag.toLowerCase()))} />
        </div>
    )
}


const InputTags = ({ tags, updateTags }) => {
    /*
    タグ入力のコントロール
    */

    const [text, setText] = useState("");

    const onKeyDown = (e) => {
        if (e.keyCode === 13 && 0 < text.length) {  // NOTE: e.keyだと変換確定のEnterと区別がつかない
            if (!tags.includes(text)) {
                updateTags([...tags, text]);
            }
            setText("");
        }
    }

    const deleteTag = (delete_tag) => {
        updateTags(tags.filter((tag => tag !== delete_tag)));
    }

    return (
        <div className="input_tags">
            {tags.map((tag) =>
                <div key={tag} className="tag">
                    <div className="tag_text">{tag}</div>
                    <div className="tag_delete" onClick={() => deleteTag(tag)}></div>
                </div>
            )}
            <input
                className="input_tag"
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={onKeyDown}
            />
        </div>
    )
}


const domContainer = document.querySelector("#app");
const root = ReactDOM.createRoot(domContainer);
root.render(React.createElement(App));
